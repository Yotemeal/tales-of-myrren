#!/usr/bin/env python3
"""Strict native PNG atlas validation, without touching production game files."""
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"public/assets/fishing"
m=json.loads((DIR/"fishing_spots_v1.json").read_text())
assert m["status"]=="visual-review-only"
assert m["schema"]=="myrren.fishing.native-sprite-atlas.v1"
assert m["frameWidth"]==32 and m["frameHeight"]==24
assert m["columns"]==4 and m["rows"]==5
assert m["frameDurationMs"]>=150 and m["frameDurationMs"]<=350
assert m["anchor"]=={"x":16,"y":12}
assert list(m["mapping"])==["spot1","spot2","spot3","spot4","spot5"]
assert [m["mapping"][f"spot{i}"]["level"] for i in range(1,6)]==[1,12,25,40,70]
im=Image.open(DIR/"fishing_spots_v1.png")
im.load()
assert im.mode=="RGBA", "Uncompressed native alpha is required"
assert im.size==(128,120),im.size
assert im.getpixel((0,0))[3]==0
all_sig=set()
for row in range(5):
 signatures=[]
 for frame in range(4):
  im0=im.crop((frame*32,row*24,(frame+1)*32,(row+1)*24))
  alpha=im0.getchannel("A")
  bbox=alpha.getbbox()
  assert bbox is not None,(row,frame)
  assert bbox[0]>0 and bbox[1]>0 and bbox[2]<32 and bbox[3]<24,(row,frame,bbox)
  count=sum(1 for v in alpha.getdata() if v>8)
  assert 35<=count<=240,(row,frame,count)
  signatures.append(im0.tobytes())
 assert len(set(signatures))>=3,"Animation poses must differ: "+str(row)
 all_sig.add(signatures[0])
assert len(all_sig)==5,"Each fishing tier must have distinct art"
assert not (ROOT/"public"/"fishing-sprite-runtime.js").exists(), "review branch must not add gameplay code"
print("PASS: 20 authored 32x24 RGBA frames (5 types x 4), safe bounds and distinct motion.")
