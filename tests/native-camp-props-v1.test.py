#!/usr/bin/env python3
"""Validate the original Crater Camp PNG atlas; never changes gameplay."""
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
D=ROOT/"public/assets/camp"
m=json.loads((D/"camp_props_v1.json").read_text())
assert m["schema"]=="myrren.camp.props.native-atlas.v1"
assert m["status"]=="art-review-only" and not m["gameplayIntegrated"]
assert m["cell"]==[64,64] and m["resolution"]==[256,384]
assert m["columns"]==4 and m["rows"]==6
assert m["originalCharacter"]==[21,27] and m["terrainTile"]==[16,16]
names=["bank_chest","jobs_board","blacksmith_anvil","open_furnace","campfire","lantern"]
assert list(m["props"])==names
png=Image.open(D/"camp_props_v1.png")
png.load()
assert png.size==(256,384)
im=png.convert("RGBA")
assert im.getpixel((0,0))[3]==0
count=0
for row,name in enumerate(names):
    p=m["props"][name]
    assert p["row"]==row
    assert p["sourceRect"]=={"x":0,"y":row*64,"width":64,"height":64}
    assert p["footAnchorInCell"]==[32,56]
    assert p["sourcePixelOffsetInCell"]==[
        32-p["sourceAnchor"][0],56-p["sourceAnchor"][1]]
    assert p["frames"] in [1,4] and len(p["sourceSize"])==2
    cells=[]
    for frame in range(4):
        cell=im.crop((frame*64,row*64,(frame+1)*64,(row+1)*64))
        bounds=cell.getchannel("A").getbbox()
        if frame>=p["frames"]:
            assert bounds is None,(name,frame,"unused cell not empty")
            continue
        count+=1
        assert bounds and bounds[0]>=0 and bounds[1]>=0 and bounds[2]<=64 and bounds[3]<=64
        assert cell.getpixel((0,0))[3]==0
        cells.append(cell)
    if p["frames"]>1:
        n=len({c.tobytes() for c in cells})
        assert n >= (2 if name in ("jobs_board","lantern") else 3),(name,n)
        assert len({c.crop((0,56,64,64)).tobytes() for c in cells})==1,(name,"feet moved")
    print("PASS:",name,p["sourceSize"],p["frames"],"image frames; consistent foot anchor")
assert count==18
# Review branch must not activate new sprites in live game.
game=(ROOT/"public/myrren-game.js").read_text()
env=(ROOT/"public/myrren-environment.js").read_text()
assert "camp_props_v1.png" not in game and "camp_props_v1.png" not in env
print("PASS: 18 native cells, 6 unique camp props; no live renderer replacement")
