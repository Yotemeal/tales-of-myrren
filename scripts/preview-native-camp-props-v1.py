#!/usr/bin/env python3
"""Review-only contact sheet and animation from the committed native pixel atlas."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

def font(size):
    try:return ImageFont.truetype("DejaVuSans.ttf",size)
    except OSError:return ImageFont.load_default()

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path,default=Path("/tmp/myrren-camp-props-qa"))
    args=p.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    src=Path(__file__).resolve().parents[1]/"public/assets/camp"
    m=json.loads((src/"camp_props_v1.json").read_text())
    atlas=Image.open(src/"camp_props_v1.png").convert("RGBA")
    assert atlas.size==(256,384)
    bg=Image.new("RGB",(960,620),"#26312f")
    d=ImageDraw.Draw(bg)
    d.text((25,17),"TALES OF MYRREN — NATIVE CRATER CAMP PROPS V1",font=font(21),fill="#efd9b4")
    d.text((25,47),"REVIEW ONLY: original transparent PNG pixels, NOT installed in gameplay",font=font(13),fill="#abc2b7")
    for idx,(name,entry) in enumerate(m["props"].items()):
        x=15+(idx%3)*315;y=82+(idx//3)*265
        d.rounded_rectangle((x,y,x+305,y+250),radius=9,fill="#344540",outline="#72897e",width=2)
        d.text((x+12,y+11),name.replace("_"," ").upper(),font=font(14),fill="#efd2a0")
        row=entry["row"]
        cell=atlas.crop((0,row*64,64,row*64+64))
        background=Image.new("RGBA",(64,64),"#506b5c")
        bd=ImageDraw.Draw(background)
        for gy in range(0,64,8):
            for gx in range(0,64,8):
                if ((gx+gy)//8)%2==0:bd.rectangle((gx,gy,gx+7,gy+7),fill="#597363")
        background.alpha_composite(cell)
        large=background.resize((192,192),Image.Resampling.NEAREST).convert("RGB")
        bg.paste(large,(x+56,y+37))
        d.text((x+12,y+231),f"{entry['sourceSize'][0]} x {entry['sourceSize'][1]} native | {entry['frames']} frame(s)",font=font(12),fill="#b2cfc3")
    bg.save(args.out/"CAMP_PROPS_FROM_GITHUB_ATLAS.png",optimize=True)
    seq=[]
    for f in range(4):
        frame=Image.new("RGBA",(192,64),"#526757")
        for j,row in enumerate((3,4,5)):
            frame.alpha_composite(atlas.crop((f*64,row*64,(f+1)*64,(row+1)*64)),(j*64,0))
        seq.append(frame.resize((768,256),Image.Resampling.NEAREST))
    seq[0].save(args.out/"CAMP_PROPS_GITHUB_ATLAS_GIF.gif",save_all=True,append_images=seq[1:],
                duration=240,loop=0,disposal=2,optimize=False)
    print("PASS: six original PNG sources and animated review GIF rendered from committed atlas")

if __name__=="__main__":main()
