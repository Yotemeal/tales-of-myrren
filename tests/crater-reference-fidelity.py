"""Validate preview metadata; optionally compare every crop to source JPEGs."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
m=json.loads((root/'public/crater-reference-frames.json').read_text())
expected={'R1':'449125F1','R2':'92B94231','R3':'7180DC61','R4':'F7AA665A','R5':'ABD545E9','R6':'E8219F5C'}
assert len(m['creatures'])==16
assert [sum(c['category']==k for c in m['creatures']) for k in ['Hostiles','Wildlife','Pets']]==[8,5,3]
assert all(r['originalFilename'].startswith(expected[ref]) for ref,r in m['references'].items())
originals=Path(sys.argv[1]) if len(sys.argv)>1 else None
count=0
for c in m['creatures']:
    r=m['references'][c['reference']];atlas=Image.open(root/'public'/r['file']).convert('RGB')
    if originals:
        path=originals/r['originalFilename'];assert hashlib.sha256(path.read_bytes()).hexdigest()==r['sha256']
        original=Image.open(path).convert('RGB')
    for state,clip in c['states'].items():
        assert clip['frames'] and isinstance(clip['loop'],bool)
        for f in clip['frames']:
            assert f['x']>=0 and f['y']>=0 and f['w']>0 and f['h']>0
            assert f['x']+f['w']<=atlas.width and f['y']+f['h']<=atlas.height
            if originals:
                packed=atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
                assert packed.tobytes()==original.crop(f['sourceBox']).tobytes(),(c['id'],state)
            count+=1
assert next(c for c in m['creatures'] if c['id']=='dire_wolf')['reference']=='R6'
assert 'Tree-climb frames' in next(c for c in m['creatures'] if c['id']=='squirrel')['missing']
print('PASS:',count,'reference crops; 8/5/3 registry; source identities; bounds; explicit missing frames.'+(' Every crop matches original pixels.' if originals else ' Original-pixel comparison not requested.'))
