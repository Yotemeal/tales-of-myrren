#!/usr/bin/env python3
"""Present ACTUAL Chromium screenshots as annotated QA crops, not replacement art."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 550, 530
PAD = 12
HEADER = 112
CROP_LOGICAL_W, CROP_LOGICAL_H = 260, 230
GROUPS = {
    "trees": {"Bramblewood", "Alder", "Ironbark", "Elderthorn", "Starroot"},
    "ores": {"Copper", "Tin", "Iron", "Coal", "Black Iron", "Obsidianite", "Myrrenite", "Meteorite"},
}

def load_font(size):
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()

def crop_scene(record, folder):
    file = folder / record["screenshot"]
    if not file.is_file():
        raise ValueError("Missing real gameplay screenshot: " + str(file))
    screen = Image.open(file).convert("RGB")
    canvas = record["canvas"]
    logical = canvas["width"]
    if logical <= 0:
        raise ValueError("Invalid recorded game canvas width")
    scale = screen.width / logical
    # The game camera places the actual player at x=half screen, y=.47 of height.
    cx = screen.width / 2
    cy = canvas["height"] * 0.47 * scale
    crop_w = round(CROP_LOGICAL_W * scale)
    crop_h = round(CROP_LOGICAL_H * scale)
    box = (
        round(cx - crop_w/2),
        round(cy - crop_h + 48*scale),
        round(cx + crop_w/2),
        round(cy + 48*scale)
    )
    if box[0] < 0 or box[1] < 0 or box[2] > screen.width or box[3] > screen.height:
        raise ValueError("QA crop would clip game canvas for " + record["screenshot"])
    crop = screen.crop(box)
    # Presentation zoom only. The original screenshots and source art are untouched.
    return crop.resize((520,460),Image.Resampling.NEAREST)

def build(records, device, group, folder):
    selected = [r for r in records if r["device"]==device and r["resource"] in GROUPS[group]]
    if len(selected) != len(GROUPS[group]):
        raise ValueError("Missing resources for "+device+"/"+group)
    # Preserve the deterministic order of the original browser audit.
    cols=2
    row_count=(len(selected)+cols-1)//cols
    width=cols*W
    height=HEADER+row_count*H+24
    background=(23,28,35)
    sheet=Image.new("RGB",(width,height),background)
    d=ImageDraw.Draw(sheet)
    title=load_font(23)
    body=load_font(17)
    small=load_font(15)
    d.text((20,14),"TALES OF MYRREN | REAL GAME SCALE | "+group.upper(),
           font=title,fill=(239,226,192))
    d.text((20,48),device.upper()+" — Chromium public/ game, screenshot crops, 2× presentation zoom",
           font=body,fill=(193,210,202))
    d.text((20,75),"Reference only. Not a sprite atlas, approved art, or an asset replacement.",
           font=small,fill=(242,163,126))
    for i,r in enumerate(selected):
        col,row=i%cols,i//cols
        x=col*W+PAD
        y=HEADER+row*H
        d.rounded_rectangle((x,y,x+W-24,y+H-13),radius=13,outline=(129,121,98),width=2)
        d.text((x+13,y+13),r["resource"],font=title,fill=(249,231,190))
        d.text((x+13,y+45),str(r["drawWidthGamePixels"])+" rendered world px  |  source "+
               str(r["sourceSize"]["width"])+"×"+str(r["sourceSize"]["height"]),
               font=small,fill=(208,214,196))
        crop=crop_scene(r,folder)
        sheet.paste(crop,(x+3,y+74))
        d.text((x+14,y+W-4),
               "Kez: 21×27 native  |  Resource: "+str(r["widthVsKez"])+"× Kez width",
               font=small,fill=(196,218,210))
    target=folder/("world-scale-"+device+"-"+group+"-contact.png")
    sheet.save(target,optimize=True)
    print("WROTE",target.name,width,"x",height)
    return target.name

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path,default=Path("/tmp/myrren-world-scale-qa"))
    args=p.parse_args()
    json_file=args.out/"world-scale-runtime-measurements.json"
    info=json.loads(json_file.read_text())
    rows=info["rows"]
    outputs=[]
    for dev in ("desktop","mobile"):
        for group in ("trees","ores"):
            outputs.append(build(rows,dev,group,args.out))
    listing=["# Actual game scale — reviewer contact sheets",
             "",
             "All panel imagery is cropped from the real browser screenshots in this artifact.",
             "Crops use nearest-neighbour 2× presentation zoom. This does not change source files.",
             "Use the accompanying uncropped real-game PNGs to judge normal gameplay readability.",
             ""]
    listing += ["- "+name for name in outputs]
    listing += ["","The 21×27 Kez sprite remains the fixed scale reference.",
                "Trees are currently much larger than Kez; ore draw width is 17.28 game pixels.",
                "This is not approval to change world geometry or native character size.",""]
    (args.out/"CONTACT_SHEETS_README.md").write_text("\n".join(listing))
    print("PASS: four labelled contact sheets from real gameplay captures")

if __name__=="__main__":
    main()
