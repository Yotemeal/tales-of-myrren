#!/usr/bin/env python3
"""Review media from the committed PNG. Display backgrounds are NOT baked into the atlas."""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/"public/assets/fishing"
def font(size,bold=False):
    try:return ImageFont.truetype("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",size)
    except OSError:return ImageFont.load_default()
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path,default=Path("/tmp/myrren-fishing-art-review"))
    args=p.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    img=Image.open(ASSET/"fishing_spots_v1.png").convert("RGBA")
    manifest=json.loads((ASSET/"fishing_spots_v1.json").read_text())
    W,H=manifest["frameWidth"],manifest["frameHeight"]
    assert img.size==(W*4,H*5)
    scale=6; boxw=238;boxh=245
    sheet=Image.new("RGB",(boxw*4+16,boxh*5+116),(22,27,33))
    d=ImageDraw.Draw(sheet)
    d.text((22,18),"TALES OF MYRREN / NATIVE FISHING ART V1",font=font(22,True),fill=(238,227,196))
    d.text((22,53),"Four frames per type, 32x24 original pixels, transparent source atlas.",font=font(15),fill=(172,203,195))
    d.text((22,78),"ART REVIEW ONLY — GAME IS UNCHANGED",font=font(15,True),fill=(234,162,124))
    for index,(key,data) in enumerate(manifest["mapping"].items()):
        for frame in range(4):
            x=8+frame*boxw;y=116+index*boxh
            d.rounded_rectangle((x,y,x+boxw-8,y+boxh-8),radius=9,outline=(102,124,118),fill=(34,43,49))
            background=Image.new("RGBA",(W,H),(50,88,91))
            bd=ImageDraw.Draw(background)
            for yy in range(1,H,4):
                for xx in range(0,W,7):
                    if (xx//7+yy//4)%3==0:
                        bd.line((xx,yy,xx+4,yy),fill=(67,104,103,255))
            sub=img.crop((frame*W,index*H,(frame+1)*W,(index+1)*H))
            background.alpha_composite(sub)
            scaled=background.resize((W*scale,H*scale),Image.Resampling.NEAREST).convert("RGB")
            sheet.paste(scaled,(x+17,y+20))
            name=data["style"].title()
            d.text((x+12,y+177),f"{key}  /  LV {data['level']}",font=font(14,True),fill=(235,224,196))
            d.text((x+12,y+202),f"{name} — frame {frame+1}",font=font(11),fill=(158,192,186))
    sheet.save(args.out/"fishing_spots_v1_review.png",optimize=True)
    anim=[]
    for frame in range(4):
        preview=Image.new("RGBA",(5*W,H),(0,0,0,0))
        for row in range(5):
            preview.alpha_composite(img.crop((frame*W,row*H,(frame+1)*W,(row+1)*H)),(row*W,0))
        anim.append(preview.resize((5*W*4,H*4),Image.Resampling.NEAREST))
    anim[0].save(args.out/"fishing_spots_v1_animation.gif",save_all=True,
        append_images=anim[1:],duration=220,loop=0,disposal=2,optimize=False)
    print("PASS: review preview and animation generated from the committed PNG; no artwork modified")
if __name__=="__main__":main()
