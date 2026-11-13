#!/usr/bin/env python3
"""Native transparent resource art validation. Does not change live game code."""
from pathlib import Path
import json
from PIL import Image

ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/"manifest.json"

def validate():
    m=json.loads(MANIFEST.read_text())
    assert m["schema"]=="myrren.native-environment-art.v1"
    assert m["status"]=="visual-review-only" and m["requiresVisualApproval"]
    assert m["tileNativeSize"]==16
    assert m["characterReference"]["width"]==21
    assert m["characterReference"]["height"]==27
    assert set(m["art"])=={"bramblewood","alder","copper","tin"}
    assert {m["art"][name]["sourceResourceKey"] for name in ("bramblewood","alder")}=={"tree","oak"}
    for name,meta in m["art"].items():
        w,h=meta["frameWidth"],meta["frameHeight"]
        total=meta["columns"]
        assert meta["rows"]==1
        atlas=Image.open(ROOT/meta["path"]);atlas.load()
        assert atlas.mode=="RGBA" and atlas.size==(w*total,h),(name,atlas.size)
        poses=[atlas.crop((n*w,0,(n+1)*w,h)) for n in range(total)]
        assert len({pose.tobytes() for pose in poses})>=2,name
        for n,p in enumerate(poses):
            bounds=p.getchannel("A").getbbox()
            assert bounds is not None and 0<bounds[0]<bounds[2]<w,(name,n,bounds)
            assert p.getpixel((0,0))[3]==0
            assert set(p.getchannel("A").get_flattened_data()) <= {0,255}
        if meta["kind"]=="tree":
            assert (w,h,total)==(72,88,4)
            assert meta["anchor"]=={"x":36,"y":85}
            assert len(meta["animationMs"])==4
            # Trunk and roots must remain perfectly static through all breeze frames.
            roots=[p.crop((28,71,47,88)).tobytes() for p in poses]
            assert len(set(roots))==1,"trunk shifted "+name
            assert all(p.getchannel("A").getbbox()[3]>=86 for p in poses)
            stump=Image.open(ROOT/meta["depletedPath"]);stump.load()
            assert stump.mode=="RGBA" and stump.size==(72,88)
            b=stump.getchannel("A").getbbox()
            assert b and b[1]>=60 and b[3]>=86, (name,"stump bounds",b)
            assert set(stump.getchannel("A").get_flattened_data()) <= {0,255}
        else:
            assert (w,h,total)==(24,22,2)
            assert meta["anchor"]=={"x":12,"y":20}
            assert meta["states"]==["live","depleted"]
            assert poses[0].tobytes()!=poses[1].tobytes()
            assert poses[0].getchannel("A").tobytes()==poses[1].getchannel("A").tobytes()
        print("PASS:",name,atlas.size,"native RGBA, no clipping or alignment regression")
    print("PASS: 4 atlases, 2 stump PNGs, 12 native frames, fixed ground anchors")

if __name__=="__main__":
    validate()
