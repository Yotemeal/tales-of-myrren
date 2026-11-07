"""Regression fixtures measured from the approved R5 animals, not crop edges."""
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
m=json.loads((root/'public/crater-reference-frames.json').read_text())
pets={c['id']:c for c in m['creatures'] if c['category']=='Pets'}
assert {key:p['draftFitHeight'] for key,p in pets.items()}=={'timber_glider':18,'geode_mole':16,'river_otter':18}
assert all(p['draftFitHeight']<40/2 for p in pets.values()),'companions must remain small beside the approximately 40px player'
otter=pets['river_otter'];assert otter['fitSourceHeight']==68,'adding crop padding must not change the source-pixel scale'
# Inclusive bounds of complete animals/splashes measured in the original board.
body_bounds={
 'walk':[(529,629,615,671),(639,625,719,671),(746,622,828,671),(857,626,940,671)],
 'swim':[(996,629,1104,668),(1123,624,1234,667),(1253,628,1365,667),(1385,624,1496,667)],
 'idle':[(533,725,625,798),(656,725,746,798),(771,721,868,798)],
 'dive-catch':[(952,738,1084,799),(1104,738,1230,793),(1253,728,1363,795),(1394,723,1493,792)]
}
count=0
for state,bounds in body_bounds.items():
 for frame,(left,top,right,bottom) in zip(otter['states'][state]['frames'],bounds):
  l,t,r,b=frame['sourceBox']
  assert l<=left-3 and t<=top-3 and r>=right+3 and b>=bottom+3,(state,frame['sourceBox'],'body/head/tail must have padding')
  assert (bottom-top+1)*otter['draftFitHeight']/otter['fitSourceHeight']<=22,'otter body must remain around half player height or smaller'
  count+=1
assert count==15
print('PASS: all three pet scales stay small; all 15 otter poses retain complete heads, tails, fish and splashes with padding.')
