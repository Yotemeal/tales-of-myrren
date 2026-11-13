#!/usr/bin/env python3
"""Tales of Myrren: original compact adventurer, authored in native pixels.

Generate the source RGBA atlas, transparent standalone front sprite, frame
metadata/socket positions and a nearest-neighbour QA contact sheet.
Requires Pillow >= 10. Not a game runtime integration.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

CELL_W, CELL_H = 32, 40
ANCHOR = (16, 39)  # bottom-centre frame-local pivot; feet occupy y=38
DIRECTIONS = ("front", "right", "back", "left")
ACTIONS = ("idle", "walk", "punch", "sword", "hurt", "death")
FRAMES = 4
# Small cohesive colour ramp; no borrowed source-image pixels.
P = {
    "ink": "#29211e", "hair_dark": "#49312b", "hair": "#765047",
    "hair_lit": "#956356", "hair_light": "#ac7a66",
    "skin_shade": "#d98f6d", "skin": "#f3b18a", "skin_lit": "#ffd0a9",
    "white": "#fff8e7", "eye": "#251f23", "scar": "#b66f63",
    "cape_dark": "#343d2a", "cape": "#52633a", "cape_light": "#75864d",
    "shirt_shade": "#937257", "shirt": "#c4a07c", "shirt_lit": "#e0bd96",
    "leather_dark": "#533a30", "leather": "#825344", "leather_lit": "#a36d53",
    "metal": "#cda85b", "metal_lit": "#f8d47d", "boot": "#3c302c",
}


def paint(direction: str, action: str, frame: int) -> Image.Image:
    """Draw one fully opaque-edge sprite on a transparent 32x40 canvas."""
    if direction not in DIRECTIONS or action not in ACTIONS or not 0 <= frame < 4:
        raise ValueError((direction, action, frame))
    face = "side" if direction in ("right", "left") else direction
    # Draw facing RIGHT natively, flip for LEFT; no mismatched eye/hair planes.
    move = (-1, 0, 1, 0)[frame] if action == "walk" else 0
    bob = (0, -1, 0, -1)[frame] if action == "walk" else 0
    breathe = 1 if action == "idle" and frame in (1, 2) else 0
    recoil = 1 if action == "hurt" and frame in (1, 3) else 0
    squat = 1 if action == "death" and frame == 1 else 0
    top = bob + squat + recoil
    image = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    def R(box, col): d.rectangle(tuple(map(int,box)), fill=P[col])
    def G(coords,col): d.polygon([(int(x),int(y)) for x,y in coords],fill=P[col])

    # Boots remain grounded; marching legs move one source pixel only.
    ll = (-move if face != "side" else move)
    rr = (move if face != "side" else -move)
    if frame == 0 and action == "walk": ll, rr = 0, 0
    R((10+ll,31,15+ll,38),"ink")
    R((17+rr,31,22+rr,38),"ink")
    R((11+ll,32,14+ll,36),"leather")
    R((18+rr,32,21+rr,36),"leather")
    R((10+ll,36,15+ll,38),"boot")
    R((17+rr,36,22+rr,38),"boot")
    R((11+ll,35,14+ll,35),"leather_lit")
    R((18+rr,35,21+rr,35),"leather_lit")

    # Cape and hands: short sleeves with no separate oversized elbow joints.
    R((9,24+top,23,34+top),"ink")
    R((10,24+top,22,33+top),"cape_dark")
    R((11,25+top,21,32+top),"shirt_shade")
    R((12,25+top,20,31+top),"shirt")
    R((13,25+top,18,28+top),"shirt_lit")
    if face == "back":
        G([(10,24+top),(22,24+top),(23,33+top),(9,33+top)],"cape")
        R((12,26+top,20,32+top),"cape_dark")
        R((13,27+top,18,28+top),"cape")
        R((15,27+top,16,30+top),"cape_light")
    else:
        G([(9,24+top),(12,24+top),(13,32+top),(9,33+top)],"cape")
        G([(20,24+top),(23,24+top),(23,33+top),(19,32+top)],"cape")
        R((10,25+top,10,29+top),"cape_light")
        R((21,25+top,21,28+top),"cape_light")

    # Compact arms, embedded in the tunic; attack moves hand, not anatomy scale.
    arm_left_y = 26+top + (move if action == "walk" else 0)
    arm_right_y = 26+top - (move if action == "walk" else 0)
    rx, ry = 23, arm_right_y
    if action == "punch": rx += (0,1,3,1)[frame]; ry -= (0,1,2,0)[frame]
    if action == "sword": rx += (0,1,3,1)[frame]; ry -= (0,4,6,2)[frame]
    if action == "hurt": rx -= recoil
    R((6,arm_left_y,10,31+top),"ink")
    R((7,arm_left_y+1,10,29+top),"cape")
    R((6,29+top,9,32+top),"ink")
    R((7,29+top,8,31+top),"skin")
    R((22,ry,26+(rx-23),31+top if action not in ("punch","sword") else ry+5),"ink")
    R((22,ry+1,25+(rx-23),ry+3),"cape")
    R((rx+1,ry+3,rx+3,ry+5),"skin")
    R((rx+1,ry+3,rx+2,ry+3),"skin_lit")

    # Belt faces forward/side; no buckle on back-facing sprite.
    R((11,31+top,21,33+top),"leather_dark")
    if face != "back":
        R((14,31+top,18,33+top),"ink")
        R((15,31+top,17,32+top),"metal")
        R((16,31+top,16,31+top),"metal_lit")
    else:
        R((12,31+top,20,32+top),"leather")
    R((11,34+top,21,34+top),"leather")

    # Head: distinctive broad dark-brown forelock, gently different at sides.
    # Intentional pixel silhouette, not traced or sampled from another title.
    H = top
    G([(9,10+H),(12,7+H),(20,7+H),(24,10+H),(25,16+H),
       (24,22+H),(21,25+H),(11,25+H),(8,22+H),(7,16+H)],"ink")
    if face == "back":
        G([(9,11+H),(12,8+H),(20,8+H),(23,11+H),(24,19+H),
           (22,24+H),(10,24+H),(8,20+H)],"hair_dark")
        G([(11,10+H),(20,9+H),(22,12+H),(21,21+H),(11,22+H),(9,18+H)],"hair")
        R((12,10+H,18,12+H),"hair_lit")
        R((11,16+H,13,20+H),"hair_dark")
        R((18,18+H,20,22+H),"hair_dark")
        R((15,11+H,16,15+H),"hair_light")
    else:
        G([(10,13+H),(22,13+H),(24,17+H),(23,21+H),
           (20,24+H),(12,24+H),(9,21+H),(8,17+H)],"skin_shade")
        R((11,14+H,21,22+H),"skin")
        R((12,14+H,18,16+H),"skin_lit")
        R((11,22+H,20,23+H),"skin")
        if face == "front":
            R((11,18+H,14,20+H),"white")
            R((18,18+H,21,20+H),"white")
            R((13,19+H,14,20+H),"eye")
            R((19,19+H,20,20+H),"eye")
            R((11,17+H,14,17+H),"hair_lit")
            R((18,17+H,21,17+H),"hair_lit")
            R((17,22+H,19,22+H),"scar")
            R((18,21+H,19,21+H),"scar")
        else:  # side profile, looking right
            R((20,17+H,22,19+H),"white")
            R((21,18+H,22,19+H),"eye")
            R((23,20+H,24,21+H),"skin_shade")
            R((18,22+H,20,22+H),"scar")
        # Hair reads as one compact helmet-sized mass with an original centre dip.
        G([(8,11+H),(11,8+H),(20,8+H),(23,10+H),(25,13+H),
           (24,17+H),(21,15+H),(20,13+H),(18,16+H),
           (16,17+H),(14,14+H),(12,17+H),(9,16+H)],"hair_dark")
        G([(10,11+H),(13,9+H),(20,9+H),(22,12+H),
           (20,13+H),(18,15+H),(16,14+H),(13,12+H)],"hair")
        R((12,10+H,15,10+H),"hair_lit")
        R((18,10+H,20,11+H),"hair_lit")
        R((15,13+H,16,15+H),"hair")
        R((8,15+H,9,20+H),"hair_dark")
        R((23,15+H,24,20+H),"hair_dark")
    # Green neckerchief: unique original identity, below face, no facial overlap.
    if face != "back":
        R((11,24+H,21,26+H),"cape_dark")
        R((12,24+H,20,25+H),"cape")
        R((13,25+H,14,26+H),"cape_light")
        R((16,25+H,17,26+H),"metal")
        if breathe: R((18,26+H,19,26+H),"cape_light")
    else:
        R((11,24+H,21,25+H),"cape_dark")

    if direction in ("left", "back"):
        image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    # Native collapse: each frame retains cell size and planted ground line.
    if action == "death" and frame >= 2:
        bb = image.getbbox()
        standing = image.crop(bb)
        if frame == 2:
            fallen = standing.rotate(45 if direction != "left" else -45,
                                     resample=Image.Resampling.NEAREST, expand=True)
        else:
            fallen = standing.rotate(90 if direction != "left" else -90,
                                     resample=Image.Resampling.NEAREST, expand=True)
        # No cropping: max dimension fits 32 native pixels for a side collapse.
        if fallen.width > 32:
            # A 45-degree frame is naturally wider. Trim only transparent margin,
            # then use a hand-scoped stepped squash (no image interpolation).
            fallen = fallen.crop(fallen.getbbox())
            if fallen.width > 32:
                fallen = fallen.resize((32,fallen.height),resample=Image.Resampling.NEAREST)
        if fallen.height > 32:
            fallen = fallen.crop(fallen.getbbox())
            if fallen.height > 32:
                fallen = fallen.resize((fallen.width,32),resample=Image.Resampling.NEAREST)
        image = Image.new("RGBA",(32,40))
        x = (32-fallen.width)//2
        y = 39-fallen.height
        image.alpha_composite(fallen,(x,y))
    return image


def socket_positions(direction: str, action: str, frame: int) -> dict:
    """Frame-local one-pixel sockets; verify weapon/shield art at integration."""
    mov = (-1,0,1,0)[frame] if action=="walk" else 0
    right_dx = (0,1,3,1)[frame] if action in ("punch","sword") else 0
    right_dy = (0,-4,-6,-2)[frame] if action=="sword" else ((0,-1,-2,0)[frame] if action=="punch" else 0)
    if direction in ("front","right"):
        dominant=[27+right_dx,30+right_dy-mov]
        offhand=[7,30+mov]
    else:
        dominant=[4-right_dx,30+right_dy-mov]
        offhand=[24,30+mov]
    if action=="death" and frame>=2:
        return {"dominant":None,"offhand":None,"weaponVisible":False}
    return {"dominant":dominant,"offhand":offhand,"weaponVisible":True}


def build(out: Path) -> None:
    out.mkdir(parents=True,exist_ok=True)
    atlas=Image.new("RGBA",(CELL_W*FRAMES*len(ACTIONS),CELL_H*len(DIRECTIONS)))
    frames=[]
    for di,direction in enumerate(DIRECTIONS):
        for ai,action in enumerate(ACTIONS):
            for f in range(FRAMES):
                im=paint(direction,action,f)
                col=ai*FRAMES+f
                atlas.alpha_composite(im,(col*CELL_W,di*CELL_H))
                bb=im.getbbox()
                frames.append({"direction":direction,"action":action,"frame":f,
                               "rect":[col*CELL_W,di*CELL_H,CELL_W,CELL_H],
                               "bbox":list(bb) if bb else None,
                               "sockets":socket_positions(direction,action,f)})
    target=out/"myrren_adventurer_v1_32x40.png"
    # Exact indexed palette; transparent palette index 0, no colour quantisation.
    # The PNG decodes losslessly to our original RGBA native pixels.
    colours = [(0,0,0,0)] + [tuple(bytes.fromhex(v[1:]))+(255,) for v in P.values()]
    lookup = {c:i for i,c in enumerate(colours)}
    indexed = Image.new("P", atlas.size)
    indexed.putpalette([channel for rgba in colours for channel in rgba[:3]] + [0] * (768-3*len(colours)))
    indexed.putdata([lookup[c] for c in atlas.getdata()])
    indexed.info["transparency"] = 0
    indexed.save(target,optimize=True)
    paint("front","idle",0).save(out/"myrren_adventurer_v1_front.png",optimize=True)
    # QA grid: first pose of each action across all directions at 4× nearest.
    tile=48
    qa=Image.new("RGBA",(len(ACTIONS)*tile,len(DIRECTIONS)*tile),(232,226,208,255))
    for di,direction in enumerate(DIRECTIONS):
        for ai,action in enumerate(ACTIONS):
            sprite=paint(direction,action,0).resize((32,40),Image.Resampling.NEAREST)
            qa.alpha_composite(sprite,(ai*tile+8,di*tile+4))
    qa=qa.resize((qa.width*3,qa.height*3),Image.Resampling.NEAREST)
    qa.save(out/"myrren_adventurer_v1_review.png",optimize=True)
    (out/"myrren_adventurer_v1_manifest.json").write_text(json.dumps({
        "schemaVersion":1,"asset":"Myrren Adventurer V1","status":"art_handoff_not_live",
        "pixelArt":"original 32x40 native pixels, lossless indexed PNG with binary transparency (RGBA after decode), no runtime smoothing",
        "sheet":"myrren_adventurer_v1_32x40.png", "width":atlas.width,"height":atlas.height,
        "cell":[CELL_W,CELL_H],"anchor":list(ANCHOR),"feetLine":38,
        "directions":list(DIRECTIONS),"actions":list(ACTIONS),"framesPerAction":4,
        "layout":"rows=directions; columns=action_index*4+frame",
        "palette":P,"frameMap":frames,
        "drawScale":"candidate native 1x; compare in real game at 1x/2x; do not mutate hitboxes",
        "layering":"base only; future six-slot armour and independent weapons/shields",
        "sourceGenerator":"build_character.py", "originalImageIsNotPixelGrid":True,
        "sha256":hashlib.sha256(target.read_bytes()).hexdigest(),
        "releaseApproved":False,"integrated":False
    },indent=2)+"\n")
    print(f"generated {len(frames)} frames, {atlas.size}, PNG {target.stat().st_size} bytes")
    print("sha256",hashlib.sha256(target.read_bytes()).hexdigest())

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",type=Path,default=Path(__file__).resolve().parent)
    build(ap.parse_args().out)
