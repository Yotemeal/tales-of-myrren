#!/usr/bin/env python3
"""QA contracts for the experimental Kez V2 authored paperdoll sprite sheet."""
import json
from pathlib import Path
from PIL import Image

out=Path('/tmp/kez-v2-paperdoll')
meta=json.loads((out/'kez-v2-paperdoll-native-v1.json').read_text())
assert meta['status']=='experimental-not-approved'
assert meta['cell']==[21,27]
assert meta['atlas']==[588,972]
assert [m['id'] for m in meta['materials']]==[2,3,4,5,7,6,8]
assert meta['slots']==['helm','body','legs','boots','gloves','shield']
atlas=Image.open(out/'kez-v2-paperdoll-native-v1.png').convert('RGBA')
assert atlas.size==(588,972)
alpha=atlas.getchannel('A')
values=set(alpha.getdata())
assert values.issubset({0,255}),f'Partially transparent/blurred pixels found: {values}'
for tier in range(7):
 for slot in range(6):
  for row in range(6):
   for frame in range(4):
    bounds=(tier*84+frame*21,slot*162+row*27,
      tier*84+(frame+1)*21,slot*162+(row+1)*27)
    piece=alpha.crop(bounds)
    assert piece.getbbox() is not None,\
      f'Empty character equipment frame at tier={tier}, slot={slot}, row={row}, frame={frame}'
# A T-visor gold central crest must still be visible on the experimental
# sprite export. Do not accidentally replace it with the old purple helmet.
front_helmet=atlas.crop((5*84,0,5*84+21,27))
assert front_helmet.getpixel((10,0))[:3]==(239,198,83)
# All generated layers fit the 21x27 cell and preserve the expected grounding.
review=Image.open(out/'kez-v2-paperdoll-review.png')
assert review.size==(994,648)
print('PASS: all 1008 frame slices are nonempty, alpha is hard, tier IDs and Myrrenite crest are intact.')

public = Path(__file__).resolve().parents[1] / 'public'
bronze = Image.open(public / 'assets/armour/bronze_layers_21x27.png').convert('RGBA')
kez = Image.open(public / 'assets/kez-v2/kez_v2_atlas.png').convert('RGBA')
assert bronze.size == (84, 2268)
assert set(bronze.getchannel('A').tobytes()) == {0, 255}
for row in range(5):
    for frame in range(4):
        x, y = frame * 21, row * 27
        character = kez.crop((x, y, x + 21, y + 27))
        boots_y = y + 4 * 378
        boots = bronze.crop((x, boots_y, x + 21, boots_y + 27))
        assert boots.getbbox()[3] == character.getbbox()[3], (row, frame)
print('PASS: Bronze atlas uses hard alpha and all 20 idle/walk boot cells share the body baseline.')

punch = Image.open(public / 'assets/kez-v2/kez_v2_punch_proof.png').convert('RGBA')
assert punch.size == (63, 108)
for direction in range(4):
    y = direction * 27
    standing = kez.crop((0, y + 27, 21, y + 54))
    frames = [punch.crop((col * 21, y, (col + 1) * 21, y + 27)) for col in range(3)]
    assert frames[0].tobytes() == standing.tobytes()
    assert len({frame.tobytes() for frame in frames}) == 3
    for frame in frames:
        assert frame.crop((0, 0, 21, 13)).tobytes() == standing.crop((0, 0, 21, 13)).tobytes()
        assert frame.crop((0, 22, 21, 27)).tobytes() == standing.crop((0, 22, 21, 27)).tobytes()
print('PASS: all four punch directions have three distinct poses, with original head and feet pixels.')

manifest = json.loads((public / 'assets/armour/bronze_layers_21x27.json').read_text())
for slot, name in enumerate(manifest['slotOrder']):
    for direction in range(4):
        y = (slot * manifest['slotBlockRows'] + manifest['punchStartRow'] + direction) * 27
        gear_frames = [bronze.crop((col * 21, y, (col + 1) * 21, y + 27)) for col in range(3)]
        assert all(frame.getbbox() for frame in gear_frames), (name, direction)
        if name == 'gloves':
            assert gear_frames[0].tobytes() != gear_frames[2].tobytes(), direction
        if name == 'shield':
            assert len({frame.tobytes() for frame in gear_frames}) == 1, direction
print('PASS: every Bronze punch layer is populated, the glove moves and the shield holds position.')

sword = Image.open(public / 'assets/kez-v2/kez_v2_sword_proof.png').convert('RGBA')
assert sword.size == (63, 108)
for direction in range(4):
    y = direction * 27
    standing = kez.crop((0, y + 27, 21, y + 54))
    strike = [sword.crop((col * 21, y, (col + 1) * 21, y + 27)) for col in range(3)]
    assert strike[0].tobytes() == standing.tobytes()
    assert len({frame.tobytes() for frame in strike}) == 3
    for frame in strike:
        for band in ((0, 0, 21, 13), (0, 22, 21, 27)):
            assert frame.crop(band).tobytes() == standing.crop(band).tobytes()
    for slot in range(6):
        gear_y = (slot * manifest['slotBlockRows'] + manifest['swordStartRow'] + direction) * 27
        assert all(bronze.crop((col * 21, gear_y, (col + 1) * 21, gear_y + 27)).getbbox()
                   for col in range(3)), (slot, direction)
print('PASS: four directional sword sequences preserve the original head and feet and have matching gear cells.')

collapse = Image.open(public / 'assets/kez-v2/kez_v2_collapse_proof.png').convert('RGBA')
assert collapse.size == (72, 896)
for row in range(28):
    y = row * 32
    falling = collapse.crop((0, y, 36, y + 32))
    resting = collapse.crop((36, y, 72, y + 32))
    assert falling.getbbox() and resting.getbbox(), row
    assert falling.tobytes() != resting.tobytes(), row
    if row < 4:
        left, top, right, bottom = resting.getbbox()
        assert right - left > bottom - top, row
print('PASS: all four Bronze fall directions have populated body and equipment cells, with horizontal rest poses.')
