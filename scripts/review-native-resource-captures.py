#!/usr/bin/env python3
"""Compose genuine game-canvas screenshots. Never edit source assets/game JS."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
KINDS={"trees":[("bramblewood","Bramblewood / conifer"),("alder","Alder / broadleaf")],"ores":[("copper","Copper"),("tin","Tin")]}
STATES=[("current","CURRENT LIVE"),("native-live","NEW PNG LIVE"),("native-depleted","NEW PNG DEPLETED")]
def font(size,bold=False):
    try:return ImageFont.truetype("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",size)
    except OSError:return ImageFont.load_default()
def crop_image(src,entry,device):
    im=Image.open(src).convert("RGB")
    dpr=2 if device=="mobile" else 1
    # Browser positions the player at 50% screen width / 47% screen height.
    cx=im.width*.5+(entry["resource"]["x"]-entry["player"]["x"])*dpr*.5
    cy=im.height*.47+(entry["resource"]["y"]-entry["player"]["y"])*dpr*.5-34*dpr
    w,h=320*dpr,260*dpr
    rect=(round(cx-w/2),round(cy-h/2),round(cx+w/2),round(cy+h/2))
    assert rect[0]>=0 and rect[1]>=0 and rect[2]<=im.width and rect[3]<=im.height,(src,rect,im.size)
    return im.crop(rect).resize((640,520),Image.Resampling.NEAREST)
def build(folder,device,category,entries):
    cw,ch=670,650
    page=Image.new("RGB",(cw*3+10,ch*4+110),(22,30,36))
    d=ImageDraw.Draw(page)
    d.text((22,13),"TALES OF MYRREN — ACTUAL-GAME RESOURCE COMPARISON",font=font(22,True),fill=(241,227,193))
    d.text((22,48),device.upper()+" | "+category.upper()+" | Current versus native resource sprites",font=font(17),fill=(178,206,191))
    d.text((22,77),"QA ISOLATED = other trees hidden IN TEST BROWSER ONLY; not natural gameplay.",font=font(13),fill=(241,169,132))
    for item,(name,label) in enumerate(KINDS[category]):
        kind={"bramblewood":"tree","alder":"oak"}.get(name,name)
        where=entries[(device,kind)]
        for mode,mode_name in (("natural","NATURAL GAME"),("qa-isolated","QA ISOLATED")):
            row=item*2+int(mode=="qa-isolated")
            for col,(state,state_name) in enumerate(STATES):
                filename=device+"-"+name+"-"+("qa-isolated-" if mode=="qa-isolated" else "")+state+".png"
                source=folder/filename
                assert source.exists(),str(source)
                x=col*cw+10;y=row*ch+115
                d.rounded_rectangle((x,y,x+cw-12,y+ch-12),radius=8,outline=(99,134,123),width=2)
                d.text((x+15,y+11),label+" / "+mode_name,font=font(17,True),fill=(239,224,189))
                d.text((x+15,y+43),state_name,font=font(14),fill=(183,208,198))
                page.paste(crop_image(source,where,device),(x+8,y+83))
                d.text((x+15,y+612),"Actual Chromium game canvas crop; NOT a sprite atlas",font=font(11),fill=(161,191,180))
    filename=f"myrren-{device}-{category}-resource-proof-sheet.png"
    page.save(folder/filename,optimize=True)
    print("WROTE",filename)
    return filename
def main():
    p=argparse.ArgumentParser();p.add_argument("--out",type=Path,default=Path("/tmp/myrren-native-resources-browser-qa"))
    folder=p.parse_args().out
    data=json.loads((folder/"qa-scenes.json").read_text())
    assert data.get("gameCodeChanged") is False
    entries={(e["device"],e["kind"]):e for e in data["proofScenes"]}
    assert len(entries)==8
    output=[build(folder,dev,grp,entries) for dev in ("desktop","mobile") for grp in ("trees","ores")]
    (folder/"READ_FIRST_CONTACT_SHEETS.md").write_text(
      "# Source-resource screenshot audit\n\nThese proof sheets are cropped from actual Chromium gameplay screenshots. "
      "NATURAL GAME uses unchanged world rendering; QA ISOLATED temporarily hides non-selected tree sprites in the test browser, "
      "NOT in the live game. This is not evidence of a gameplay merge or of visual approval.\n\n"
      +"\n".join("- "+name for name in output)+"\n")
    print("PASS: four labelled review sheets from 48 authentic game canvas captures")
if __name__=="__main__":main()
