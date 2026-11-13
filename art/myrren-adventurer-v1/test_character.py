#!/usr/bin/env python3
"""Asset QA for the non-live Myrren Adventurer V1 atlas."""
import hashlib
import json
from pathlib import Path
from PIL import Image
from build_character import ACTIONS, CELL_H, CELL_W, DIRECTIONS, FRAMES, paint

root=Path(__file__).resolve().parent
manifest=json.loads((root/'myrren_adventurer_v1_manifest.json').read_text())
source=(root/'myrren_adventurer_v1_32x40.png').read_bytes()
atlas=Image.open(root/'myrren_adventurer_v1_32x40.png').convert('RGBA')
assert atlas.size==(768,160)
assert hashlib.sha256(source).hexdigest()==manifest['sha256']
assert manifest['anchor']==[16,39]
assert manifest['directions']==list(DIRECTIONS)
assert manifest['actions']==list(ACTIONS)
assert len(manifest['frameMap'])==96
assert set(atlas.getchannel('A').getdata())=={0,255}
for record in manifest['frameMap']:
    x,y,w,h=record['rect']
    frame=atlas.crop((x,y,x+w,y+h))
    expected=paint(record['direction'],record['action'],record['frame'])
    assert frame.tobytes()==expected.tobytes(),record
    bounds=frame.getbbox()
    assert bounds is not None
    assert bounds==tuple(record['bbox']),record
    assert bounds[0]>=0 and bounds[2]<=32 and bounds[3]==39,record
    sockets=record['sockets']
    if sockets['weaponVisible']:
        assert sockets['dominant']!=sockets['offhand']
        for key in ('dominant','offhand'):
            sx,sy=sockets[key]
            assert 0<=sx<=31 and 0<=sy<=39,(record,key)
    else:
        assert record['action']=='death' and record['frame']>=2
# Strong guarantee of exact indexed export: decode must reproduce program source.
assert Image.open(root/'myrren_adventurer_v1_front.png').convert('RGBA').tobytes()==paint('front','idle',0).tobytes()
print('PASS: 96 non-empty frames; hard alpha; byte-exact palette output; anchored soles; sockets; SHA-256')
