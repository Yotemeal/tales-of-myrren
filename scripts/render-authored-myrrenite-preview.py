#!/usr/bin/env python3
"""Compose the *actual authored PNG layers*, never a generated concept poster."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse
p=argparse.ArgumentParser()
p.add_argument('--assets',default='/tmp/myrren-authored')
p.add_argument('--out',default='/tmp/myrren-authored/actual-myrrenite-contact-sheet.png')
a=p.parse_args()
root=Path(a.assets)
parts={s:Image.open(root/(s+'.png')).convert('RGBA') for s in ('base','6-head','6-body','6-legs','6-boots','6-gloves','6-shield')}
directions=('front','back','left','right')
poses=('idle','walk','attack')
scale=5
cellW=32*scale+24;cellH=48*scale+40
out=Image.new('RGB',(cellW*4,cellH*12),'#15242b')
draw=ImageDraw.Draw(out)
def cut(slot,row,frame):
    im=parts[slot]
    return im.crop((frame*32,row*48,frame*32+32,row*48+48))
for di,direction in enumerate(directions):
    for pi,pose in enumerate(poses):
        for frame in range(4):
            row=di*3+pi
            sprite=Image.new('RGBA',(32,48))
            def paste(slot):
                sprite.alpha_composite(cut(slot,row,frame))
            if direction in ('left','right'):paste('6-shield')
            for slot in ('base','6-boots','6-legs','6-body','6-gloves','6-head'):
                paste(slot)
            if direction in ('front','back'):paste('6-shield')
            # All pixels in this sheet are from source atlas cells.
            scaled=sprite.resize((32*scale,48*scale),Image.Resampling.NEAREST)
            x=frame*cellW+12;y=row*cellH+24
            out.paste(scaled,(x,y),scaled)
            draw.text((x,y-18),f'{direction} / {pose} / {frame}',fill='#d9dfcf')
out.save(a.out)
print('Saved actual atlas contact sheet',a.out)
