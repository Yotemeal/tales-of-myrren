#!/usr/bin/env python3
"""Data-integrity checks for unapproved Bronze 21x27 transparent layer atlas."""
from pathlib import Path
from PIL import Image
from hashlib import sha256

root=Path(__file__).resolve().parents[1]
atlas=root/'public/assets/armour/bronze_layers_21x27.png'
image=Image.open(atlas).convert('RGBA')
assert image.size==(84,972),f'Unexpected atlas size: {image.size}'
assert set(image.getchannel('A').getdata())=={0,255},'Sprite pixels must be opaque or fully transparent'

slot_names=('shield','helmet','body','legs','boots','gloves')
frame_rows=('idle','front','back','left','right','side-attack')
for slot in range(6):
 for row in range(6):
  hashes=set()
  for frame in range(4):
   cell=image.crop((frame*21,(slot*6+row)*27,(frame+1)*21,(slot*6+row+1)*27))
   assert cell.getbbox() is not None,(
    f'Empty {slot_names[slot]} {frame_rows[row]} frame {frame}')
   hashes.add(sha256(cell.tobytes()).digest())
  # Leg motion is animated in the current proof; don't regress it to a static atlas.
  if slot in (3,4) and row in (1,2,3,4):
   assert len(hashes)>=2,f'{slot_names[slot]} {frame_rows[row]} walking is frozen'

# IMPORTANT: other pieces still hold their silhouette static across frames.
# That is an art backlog item, not an approval criterion for this initial proof.
print('PASS: 144 native cells, exact 21x27 mapping, hard alpha, nonempty slots, moving legs/boots')
print('NOTE: full sword, attack, shield and animated chest/arms remain unapproved visual work')
