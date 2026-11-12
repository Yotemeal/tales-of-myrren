#!/usr/bin/env python3
"""Validate the original Crater Camp PNG atlas; never changes gameplay."""
import json
from pathlib import Path
from hashlib import sha256
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
# These five review sprites have not been redesigned. Keep their decoded
# native pixels exactly as they were before the approved anvil replacement.
unchanged_rows={
    "bank_chest":"85511b5a2a630411b11acc5c48e1c5bfe38eb343244e745badc63783e65e8126",
    "jobs_board":"e2387a4239e47584a0f9c8fb2c221545e454e7fb2721cd59cf7d545e3245c735",
    "open_furnace":"41b4511e4a503c8b0b6420faf6f7a6a18ab901ce8f3ac9014573f4146e7b06f7",
    "campfire":"5dac41be61ceb604339c85ac7777ca306c9bf40170fcf3d9192449b9c240d2c7",
    "lantern":"80517802494aaf5f8b6681c72123eac9f8c00b2d8aec3fcacf41cc48b90803a1"
}
count=0
for row,name in enumerate(names):
    strip=im.crop((0,row*64,256,(row+1)*64))
    if name in unchanged_rows:
        assert sha256(strip.tobytes()).hexdigest()==unchanged_rows[name], (
            name,"approved non-anvil sprite pixels changed"
        )
    if name=="blacksmith_anvil":
        # Revised face, horn, waist and stump stay within the original
        # 64×64 native cell without disturbing the shared foot anchor.
        assert strip.crop((0,0,64,64)).getchannel("A").getbbox()==(12,27,55,60), (
            "revised anvil silhouette or source alignment changed"
        )
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
