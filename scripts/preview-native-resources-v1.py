#!/usr/bin/env python3
"""Create review-only enlarged PNG/GIF directly from committed native atlases."""
import json, argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ASSETS=Path(__file__).resolve().parents[1]/"public/assets/resources/native-v1"
def font(size,bold=False):
    try: return ImageFont.truetype("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",size)
    except OSError: return ImageFont.load_default()

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--out",type=Path,default=Path("/tmp/myrren-native-resources-v1-art"))
    args=cli.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((ASSETS/"manifest.json").read_text())
    items=list(manifest["art"].items())
    cellw,cellh=290,315
    sheet=Image.new("RGB",(cellw*4+20,cellh*4+99),(23,32,37))
    d=ImageDraw.Draw(sheet)
    d.text((18,15),"MYRREN / NATIVE WORLD RESOURCE ART",font=font(23,True),fill=(234,228,202))
    d.text((18,52),"Transparent source PNGs, original pixels — NOT integrated or art-approved",font=font(15),fill=(179,205,195))
    for row,(name,meta) in enumerate(items):
        image=Image.open(ASSETS/meta["path"]).convert("RGBA")
        w,h=meta["frameWidth"],meta["frameHeight"]
        for frame in range(meta["columns"]):
            x=10+frame*cellw;y=92+row*cellh
            d.rounded_rectangle((x,y,x+cellw-10,y+cellh-10),radius=9,outline=(104,140,124),width=2)
            imagecell=image.crop((frame*w,0,(frame+1)*w,h))
            preview=Image.new("RGBA",(w,h),(51,76,67))
            background=ImageDraw.Draw(preview)
            for tx in range(0,w,16):
                for ty in range(0,h,16):
                    if (tx//16+ty//16)%2:background.rectangle((tx,ty,tx+15,ty+15),fill=(57,83,73))
            preview.alpha_composite(imagecell)
            scale=3 if meta["kind"]=="tree" else 7
            display=preview.resize((w*scale,h*scale),Image.Resampling.NEAREST).convert("RGB")
            sheet.paste(display,(x+(cellw-10-display.width)//2,y+12))
            d.text((x+10,y+cellh-55),name.upper(),font=font(15,True),fill=(238,229,191))
            desc=f"Frame {frame+1}" if meta["kind"]=="tree" else ["AVAILABLE","DEPLETED"][frame]
            d.text((x+10,y+cellh-31),desc+f"  •  {w}x{h} native",font=font(13),fill=(169,202,193))
    sheet.save(args.out/"native_world_resource_atlases_v1_review.png",optimize=True)
    stumps=Image.new("RGBA",(72*2,88),(47,70,62,255))
    for i,kind in enumerate(["bramblewood","alder"]):
        stumps.alpha_composite(Image.open(ASSETS/manifest["art"][kind]["depletedPath"]).convert("RGBA"),(i*72,0))
    stumps.resize((72*2*4,88*4),Image.Resampling.NEAREST).save(args.out/"native_tree_stumps_v1_review.png",optimize=True)
    imgs=[]
    for f in range(4):
        layer=Image.new("RGBA",(72*2,88),(48,77,67,255))
        for col,key in enumerate(("bramblewood","alder")):
            atlas=Image.open(ASSETS/manifest["art"][key]["path"]).convert("RGBA")
            layer.alpha_composite(atlas.crop((f*72,0,(f+1)*72,88)),(col*72,0))
        imgs.append(layer.resize((72*2*4,88*4),Image.Resampling.NEAREST))
    imgs[0].save(args.out/"native_tree_breeze_v1.gif",save_all=True,
        append_images=imgs[1:],duration=[750,180,180,180],loop=0,disposal=2,optimize=False)
    print("PASS: generated original-source tree/ore review, stump preview and breeze GIF.")

if __name__=="__main__":main()
