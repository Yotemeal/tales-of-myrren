#!/usr/bin/env python3
"""Validate the committed original Myrren terrain PNG, not runtime-generated art."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"public/assets/terrain"
metadata=json.loads((DIR/"starter_terrain_v1.json").read_text())
with Image.open(DIR/"starter_terrain_v1.png") as original:
    original.load()
    assert original.size==(128,112)
    image=original.convert("RGBA")
assert metadata["status"]=="art-review-only"
assert metadata["schema"]=="myrren.terrain.native-atlas.v1"
assert (metadata["tileWidth"],metadata["tileHeight"])==(16,16)
assert (metadata["columns"],metadata["rows"])==(8,7)
assert metadata["opaqueTerrain"] is True
assert len(metadata["tiles"])==56
assert metadata["maskBits"]=={"N":1,"E":2,"S":4,"W":8}
assert metadata["reference"].startswith("Original Kez V2 native 21x27")
tiles={}
for name,m in metadata["tiles"].items():
    assert m["index"]==8*m["row"]+m["column"]
    x,y=m["column"]*16,m["row"]*16
    t=image.crop((x,y,x+16,y+16))
    assert t.getchannel("A").getextrema()==(255,255),name
    assert len(t.getcolors())>=3,name
    tiles[name]=t
assert len({t.tobytes() for t in tiles.values()})>=54
for prefix,base in (("path",24),("water",40)):
    for mask in range(16):
        name=f"{prefix}_mask_{mask:02d}"
        t=tiles[name];m=metadata["tiles"][name]
        assert m["mask"]==mask
        assert m["index"]==base+mask
        # Each connected cardinal exit must have a solid 8-pixel centre.
        for bit,positions in ((1,[(x,0) for x in range(4,12)]),
                              (2,[(15,y) for y in range(4,12)]),
                              (4,[(x,15) for x in range(4,12)]),
                              (8,[(0,y) for y in range(4,12)])):
            if mask&bit:
                # Grass is dark green; dirt and water exits must not be grass.
                assert all(t.getpixel(pt)[0]>=50 for pt in positions),(name,bit)
        if mask==15:
            colors=set(t.get_flattened_data())
            assert len(colors)<12,"Four-way junction must not contain grass holes"
for group,count in (("grass",8),("dirt",4),("ruin_stone",4),("water",4),
                    ("corrupted_grass",2),("gravel",2)):
    assert sum(name.startswith(group+"_") for name in tiles)==count+(
        16 if group=="water" else 0)
# Runtime uses the validated PNG at its native tile size.
game=(ROOT/"public"/"myrren-environment.js").read_text()
assert "starter_terrain_v1.png" in game
assert "terrainAtlas.naturalWidth===128&&terrainAtlas.naturalHeight===112" in game
print("PASS: 56 intact 16x16 native pixel tiles, no transparent holes; production atlas dimensions match")
