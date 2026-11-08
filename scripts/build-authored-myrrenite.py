#!/usr/bin/env python3
"""Deterministic hand-pixelled Myrrenite proof-of-art.
Seven RGBA atlases, 32x48 cells, four directions x idle/walk/attack x four frames.
This is source artwork, NOT a scaled/cropped concept image. Requires Pillow.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import argparse

W,H=32,48
SLOTS=('base','6-head','6-body','6-legs','6-boots','6-gloves','6-shield')
INK='#101b22'; DEEP='#075357'; DARK='#08797b'; TEAL='#10a7a1'
LIGHT='#43d6c5'; GOLD='#d99b2a'; GLOW='#ffe48c'; SHADOW='#293b45'
SKIN='#e2a77a'; BROWN='#65452d'

def box(d,coords,fill,outline=INK):
    d.rectangle(coords,fill=fill,outline=outline)
def poly(d,coords,fill,outline=INK):
    d.polygon(coords,fill=fill)
    d.line(coords+[coords[0]],fill=outline,width=1)
def pixel(d,x,y,c):d.point((x,y),fill=c)

def draw_slot(slot,direction,pose,frame):
    im=Image.new('RGBA',(W,H))
    d=ImageDraw.Draw(im)
    side=direction in ('left','right')
    mirror=direction=='left'
    # A consistent anchored skeleton, with a 2px bob and staggered feet.
    bob=(-1 if pose=='walk' and frame in (1,3) else 0)
    leg=(-2,0,2,0)[frame] if pose=='walk' else 0
    attack=pose=='attack'
    arm=(-3,-5,1,3)[frame] if attack else (1,-1,0,-1)[frame] if pose=='walk' else 0
    def rect(x0,y0,x1,y1,fill,edge=INK):
        if mirror:x0,x1=W-1-x1,W-1-x0
        box(d,(x0,y0+bob,x1,y1+bob),fill,edge)
    def shape(points,fill,edge=INK):
        if mirror:points=[(W-1-x,y) for x,y in points]
        points=[(x,y+bob) for x,y in points]
        poly(d,points,fill,edge)
    def mark(x,y,c):
        if mirror:x=W-1-x
        pixel(d,x,y+bob,c)
    if slot=='base':
        # Body, legs and hands remain visible when individual gear slots are empty.
        rect(10,17,21,34,BROWN)
        rect(11,32,15,44,SHADOW)
        rect(17,32,21,44,SHADOW)
        rect(10,43,16,45,BROWN);rect(17,43,23,45,BROWN)
        rect(6,21+arm,10,33+arm,SKIN)
        rect(21,21-arm,25,33-arm,SKIN)
        rect(10,6,21,20,SKIN)
        if direction=='front':
            mark(13,13,INK);mark(19,13,INK)
        elif side:
            mark(19,13,INK)
        rect(11,18,20,21,SHADOW)
    elif slot=='6-head':
        if side:
            shape([(11,5),(17,3),(22,7),(23,18),(20,22),(12,21),(9,17),(9,9)],DEEP)
            rect(11,6,18,9,TEAL);rect(17,9,21,16,DARK)
            rect(18,12,22,14,INK);rect(20,15,22,17,INK)
            rect(11,4,14,8,GOLD);mark(13,5,GLOW)
            rect(11,19,18,21,GOLD)
        else:
            shape([(11,4),(15,2),(20,4),(24,8),(24,18),(20,22),(11,22),(7,18),(7,8)],DEEP)
            rect(9,6,22,9,TEAL)
            rect(15,3,17,10,GOLD);mark(16,4,GLOW)
            rect(8,11,23,13,GOLD);rect(9,12,22,12,GLOW)
            if direction=='front':
                rect(10,14,21,16,INK)
                rect(14,16,17,21,INK)
                rect(15,18,16,20,GOLD,INK)
            else:
                rect(10,14,21,19,DARK);rect(14,16,17,19,TEAL)
            mark(8,12,GLOW);mark(23,12,GLOW)
    elif slot=='6-body':
        if side:
            shape([(10,21),(18,19),(23,22),(23,33),(19,37),(10,34)],DEEP)
            rect(12,23,20,27,TEAL);rect(12,28,19,30,DARK)
            shape([(17,21),(21,21),(24,24),(22,27),(18,26)],GOLD)
            rect(13,32,21,34,GOLD)
        else:
            shape([(10,20),(21,20),(25,24),(23,34),(20,36),(11,36),(8,33),(7,24)],DEEP)
            shape([(10,22),(15,24),(16,28),(11,30),(9,27)],TEAL)
            shape([(22,22),(17,24),(16,28),(21,30),(23,27)],DARK)
            shape([(11,20),(16,23),(21,20),(20,24),(16,27),(12,24)],GOLD)
            rect(15,24,17,26,GLOW)
            rect(10,32,22,34,GOLD)
            rect(13,35,19,37,TEAL)
    elif slot=='6-legs':
        if side:
            rect(12,34,17,42,DEEP);rect(18,34,22,42,DARK)
            rect(12,35,16,36,GOLD);rect(19,35,22,36,GOLD)
            rect(13,39,16,40,TEAL)
        else:
            shift=leg if pose=='walk' else 0
            rect(10,35,15,42+max(0,shift),DEEP)
            rect(17,35,22,42+max(0,-shift),DEEP)
            rect(11,35,14,36,GOLD);rect(18,35,21,36,GOLD)
            rect(11,39,14,40,TEAL);rect(18,39,21,40,TEAL)
    elif slot=='6-boots':
        shift=leg if pose=='walk' else 0
        if side:
            rect(11,42,18,45,DEEP);rect(17,42,24,45,DARK)
            rect(13,42,17,43,GOLD);rect(19,42,23,43,GOLD)
        else:
            rect(9,42+max(0,shift),15,46+max(0,shift),DEEP)
            rect(17,42+max(0,-shift),23,46+max(0,-shift),DEEP)
            rect(10,43+max(0,shift),14,44+max(0,shift),GOLD)
            rect(18,43+max(0,-shift),22,44+max(0,-shift),GOLD)
    elif slot=='6-gloves':
        rect(6,23+arm,10,29+arm,DEEP)
        rect(21,23-arm,25,29-arm,DEEP)
        rect(7,23+arm,9,24+arm,GOLD)
        rect(22,23-arm,24,24-arm,GOLD)
        rect(7,27+arm,9,28+arm,TEAL)
        rect(22,27-arm,24,28-arm,TEAL)
    elif slot=='6-shield':
        # The offhand shield is distinct from the weapon, and never contains a sword.
        if direction=='front':
            x=24
        elif direction=='back':
            x=17
        else:
            x=25
        if mirror:x=32-x
        shape([(x-4,22),(x+3,22),(x+5,25),(x+4,34),(x,39),(x-4,34),(x-5,25)],GOLD)
        shape([(x-3,24),(x+2,24),(x+3,26),(x+2,33),(x,36),(x-3,33),(x-4,26)],DEEP)
        rect_x=x if not mirror else W-1-x
        # Emblem is four small bright pixels, not an oversized UI symbol.
        for dx,dy in ((0,27),(-1,29),(0,29),(1,29),(0,31)):
            mark(rect_x+dx,dy,GLOW)
    return im

def build(out):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    for slot in SLOTS:
        sheet=Image.new('RGBA',(W*4,H*12))
        for di,direction in enumerate(('front','back','left','right')):
            for pi,pose in enumerate(('idle','walk','attack')):
                for frame in range(4):
                    im=draw_slot(slot,direction,pose,frame)
                    sheet.paste(im,(frame*W,(di*3+pi)*H),im)
        sheet.save(out/(slot+'.png'))
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',default='public/assets/authored-character')
    args=p.parse_args();print('Built seven authored transparent Myrrenite atlases in',build(args.out))
