#!/usr/bin/env python3
"""Visual QA composite: actual native Myrrenite pixels over a real game screenshot.
This is explicitly a composite, not an integrated game screenshot.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse
p=argparse.ArgumentParser()
p.add_argument('--assets',required=True)
p.add_argument('--game',required=True)
p.add_argument('--out',required=True)
args=p.parse_args()
source=Path(args.assets)
base=Image.open(args.game).convert('RGBA')
parts={name:Image.open(source/(name+'.png')).convert('RGBA') for name in ('base','6-head','6-body','6-legs','6-boots','6-gloves','6-shield')}
def sprite(row,frame):
    dst=Image.new('RGBA',(32,48))
    for name in ('base','6-boots','6-legs','6-body','6-gloves','6-head','6-shield'):
        im=parts[name].crop((frame*32,row*48,frame*32+32,row*48+48))
        dst.alpha_composite(im)
    return dst
# A comparison outside the HUD at actual display sizes, not a claim of
# exact in-world position, occlusion or working animation.
overlay=Image.new('RGBA',base.size)
draw=ImageDraw.Draw(overlay)
placements=[(24,36),(32,48)]
for idx,(w,h) in enumerate(placements):
    im=sprite(0,0).resize((w,h),Image.Resampling.NEAREST)
    x=min(base.width-w-12, max(12,int(base.width*.42)+idx*int(base.width*.15)))
    y=min(base.height-h-24,max(90,int(base.height*.50)))
    overlay.alpha_composite(im,(x,y))
    draw.rectangle((x-3,y-3,x+w+3,y+h+3),outline='#f6d47c',width=1)
    draw.text((x-3,y+h+6),f'{w}x{h} display',fill='#fff1b7')
base=Image.alpha_composite(base,overlay)
ImageDraw.Draw(base).text((10,base.height-18),'COMPOSITED SCALE TEST — NOT LIVE INTEGRATION',fill='#ffe09c')
base.convert('RGB').save(args.out)
print('Wrote',args.out)
