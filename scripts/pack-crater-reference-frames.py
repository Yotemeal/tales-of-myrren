"""Pack exact crops from approved JPEG boards for a fitting study, not final sprites.

Usage: python scripts/pack-crater-reference-frames.py /path/to/originals
No redrawing, resizing, palette conversion, masking or invented frames.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = Path(sys.argv[1])
manifest = json.loads((ROOT / 'docs/CRATER_REFERENCE_MANIFEST.json').read_text())
refs = {r['reference']: r for r in manifest['references']}
images = {}
for ref, item in refs.items():
    path = ORIGINALS / item['original_filename']
    if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
        raise ValueError('Original reference checksum differs: ' + ref)
    images[ref] = Image.open(path).convert('RGB')

creatures = []
def creature(id, name, category, ref, height, states, gaps=()):
    creatures.append(dict(id=id, name=name, category=category, reference=ref,
        draftFitHeight=height, states=states, missing=list(gaps)))

def group(box, count, loop=False):
    return dict(box=box, count=count, loop=loop)

for id,name,top,bottom,height in [('forest_rat','Forest Rat',165,242,14),('wild_boar','Wild Boar',426,507,24),('forest_troll','Forest Troll',704,793,44)]:
    creature(id,name,'Hostiles','R1',height,{
        'idle':group([449,top,655,bottom],2,True),
        'move':group([689,top,927,bottom],2,True),
        'attack':group([944,top,1173,bottom],2),
        'hit':group([1191,top,1313,bottom],1),
        'death':group([1340,top,1518,bottom],1)},['Front/back views','Exact production frame timings'])

for id,name,top,bottom,attack_top,death_top,height in [('goblin_miner','Goblin Miner',175,250,296,329,26),('goblin_guard','Goblin Guard',471,574,610,654,32)]:
    attack_bottom=396 if id=='goblin_miner' else 726
    creature(id,name,'Hostiles','R3',height,{
        'idle':group([676,top,1047,bottom],3,True),
        'move':group([1080,top,1519,bottom],3,True),
        'attack':group([676,attack_top,1054,attack_bottom],4),
        'hit':group([1080,attack_top+12,1212,attack_bottom],1),
        'death':group([1268,death_top,1519,attack_bottom],2)},['Front/back views','Exact production frame timings'])

for id,name,top,bottom,attack_top,attack_bottom,height in [('cave_guardian','Cave Guardian',155,242,282,370,46),('jewelheart_guardian','Jewelheart Guardian',426,518,571,689,68)]:
    creature(id,name,'Hostiles','R2',height,{
        'idle':group([635,top,1063,bottom],4,True),
        'move':group([1093,top,1522,bottom],4,True),
        'attack':group([630,attack_top,1067,attack_bottom],4),
        'hit':group([1090,attack_top+6,1218,attack_bottom],1),
        'death':group([1250,attack_top+8,1520,attack_bottom],3 if id=='jewelheart_guardian' else 2)},['Front/back views','Exact production frame timings'])

creature('dire_wolf','Dire Wolf','Hostiles','R6',30,{
    'idle':group([640,166,1058,267],3,True),'move':group([1082,164,1520,267],3,True),
    'attack':group([638,312,1059,424],3),'hit':group([1080,321,1222,424],1),
    'death':group([1265,350,1521,424],1)},['Animated rocky/cave camouflage variants','Front/back views','Exact production frame timings'])

for id,name,top,bottom,height,count in [('forest_deer','Forest Deer',151,244,31,3),('rabbit','Rabbit',298,380,13,4),('squirrel','Squirrel',439,521,16,4),('raven','Raven',567,665,18,4),('fox','Fox',722,807,22,3)]:
    creature(id,name,'Wildlife','R4',height,{
        'idle':group([540,top,956,bottom],3,True),
        'takeoff' if id=='raven' else 'flee':group([976,top,1520,bottom],count,True)
    },(['Tree-climb frames'] if id=='squirrel' else [])+['Front/back views','Exact production frame timings'])

creature('timber_glider','Timber Glider','Pets','R5',30,{
    'walk':group([525,145,955,213],4,True),'glide':group([1002,137,1520,213],4),
    'idle':group([525,260,955,332],3,True),'climb':group([1002,245,1520,332],4)
},['Front/back views','Exact production frame timings'])
creature('geode_mole','Geode Mole','Pets','R5',26,{
    'burrow':group([523,386,1052,453],5,True),'surface':group([1070,386,1520,453],4),
    'dig':group([523,477,1052,562],5)
},['Front/back views','Exact production frame timings'])
creature('river_otter','River Otter','Pets','R5',28,{
    'walk':group([525,621,955,689],4,True),'swim':group([1002,621,1520,689],4,True),
    'idle':group([525,732,955,810],3,True),'dive-catch':group([1002,727,1520,810],4)
},['Front/back views','Exact production frame timings'])

# Hand-measured crop boundaries: these boards do not use uniform frame grids.
def boxes(id,state,coords):
    c=next(c for c in creatures if c['id']==id);c['states'][state]={'boxes':coords,'loop':c['states'][state]['loop']}
for id,top,bottom in [('forest_rat',165,242),('wild_boar',426,507),('forest_troll',704,793)]:
    boxes(id,'idle',[[440,top,550,bottom],[555,top,658,bottom]])
    boxes(id,'attack',[[943,top,1056,bottom],[1057,top,1161,bottom]])
for id,top,bottom in [('goblin_miner',175,250),('goblin_guard',471,574)]:
    boxes(id,'idle',[[660 if id=='goblin_guard' else 675,top,780 if id=='goblin_guard' else 770,bottom],[790,top,910 if id=='goblin_guard' else 890,bottom],[916,top,1030,bottom]])
    boxes(id,'move',[[1100,top,1226,bottom],[1242,top,1377,bottom],[1380,top,1525,bottom]])
boxes('goblin_miner','attack',[[650,309,749,395],[760,309,861,395],[874,309,1038,395],[1040,309,1131,395]])
boxes('goblin_miner','hit',[[1155,309,1250,395]])
boxes('goblin_miner','death',[[1287,329,1394,395],[1401,329,1525,395]])
boxes('goblin_guard','attack',[[650,615,777,725],[780,615,893,725],[895,615,1011,725],[1012,615,1132,725]])
boxes('goblin_guard','hit',[[1150,625,1269,725]])
boxes('goblin_guard','death',[[1287,654,1395,725],[1401,654,1525,725]])
boxes('cave_guardian','idle',[[620,155,724,231],[724,155,828,231],[828,155,931,231],[931,155,1035,231]])
boxes('cave_guardian','move',[[1085,153,1192,231],[1192,153,1299,231],[1299,153,1406,231],[1406,153,1515,231]])
boxes('cave_guardian','attack',[[610,282,704,365],[713,282,833,365],[837,282,949,365],[950,282,1095,365]])
boxes('cave_guardian','hit',[[1135,282,1268,365]])
boxes('cave_guardian','death',[[1285,297,1402,365],[1403,297,1520,365]])
boxes('jewelheart_guardian','idle',[[665,425,772,519],[772,425,880,519],[880,425,988,519],[988,425,1096,519]])
boxes('jewelheart_guardian','move',[[1105,425,1210,519],[1210,425,1315,519],[1315,425,1420,519],[1420,425,1525,519]])
boxes('jewelheart_guardian','attack',[[665,571,775,682],[777,571,871,682],[876,571,971,682],[974,571,1110,682]])
boxes('jewelheart_guardian','hit',[[1128,581,1250,682]])
boxes('jewelheart_guardian','death',[[1260,601,1365,682],[1366,601,1453,682],[1454,601,1525,682]])
boxes('dire_wolf','idle',[[640,165,775,254],[783,165,909,254],[912,165,1028,254]])
boxes('dire_wolf','move',[[1070,165,1208,254],[1215,165,1360,254],[1370,165,1520,254]])
boxes('dire_wolf','attack',[[632,310,766,413],[770,310,920,413],[922,302,1088,413]])
boxes('dire_wolf','hit',[[1125,315,1268,412]])
boxes('dire_wolf','death',[[1310,350,1510,412]])
boxes('forest_deer','flee',[[979,151,1141,244],[1165,151,1324,244],[1358,151,1518,244]])
boxes('rabbit','flee',[[975,298,1110,380],[1120,298,1255,380],[1262,298,1398,380],[1402,298,1525,380]])
boxes('squirrel','flee',[[975,439,1115,521],[1120,439,1258,521],[1264,439,1402,521],[1405,439,1525,521]])
boxes('raven','takeoff',[[977,567,1104,665],[1105,567,1235,665],[1237,562,1375,665],[1377,556,1525,665]])
boxes('fox','flee',[[975,722,1156,807],[1166,722,1341,807],[1350,722,1525,807]])
boxes('timber_glider','walk',[[528,145,625,213],[638,145,734,213],[748,145,844,213],[856,145,954,213]])
boxes('timber_glider','glide',[[1008,145,1116,213],[1125,145,1254,213],[1260,137,1388,213],[1395,137,1510,213]])
boxes('timber_glider','idle',[[528,260,638,332],[650,260,755,332],[765,260,870,332]])
boxes('timber_glider','climb',[[950,251,1077,333],[1093,251,1221,333],[1234,251,1360,333],[1373,251,1505,333]])
boxes('geode_mole','dig',[[550,496,827,562],[853,496,1060,562],[1100,496,1295,562]])
boxes('river_otter','walk',[[529,621,626,689],[639,621,737,689],[749,621,848,689],[859,621,953,689]])
boxes('river_otter','swim',[[1000,621,1112,689],[1125,621,1240,689],[1253,621,1370,689],[1386,621,1508,689]])
boxes('river_otter','idle',[[530,732,635,810],[652,732,750,810],[770,732,866,810]])
boxes('river_otter','dive-catch',[[949,746,1102,810],[1105,746,1244,810],[1247,746,1372,810],[1375,746,1511,810]])

# Final crop audit: isolate each complete pose instead of neighbouring limbs.
boxes('jewelheart_guardian','idle',[[671,425,771,519],[782,425,881,519],[893,425,989,519],[1002,425,1096,519]])
boxes('jewelheart_guardian','move',[[1115,425,1222,519],[1222,425,1333,519],[1335,425,1429,519],[1428,425,1525,519]])
for id,top,bottom,spans in [
    ('forest_deer',151,244,[(545,665),(675,794),(805,922)]),
    ('rabbit',298,380,[(558,632),(680,752),(798,871)]),
    ('squirrel',439,521,[(545,656),(675,786),(809,908)]),
    ('raven',567,665,[(539,652),(661,780),(788,905)]),
    ('fox',722,807,[(545,656),(676,783),(800,911)])]:
    boxes(id,'idle',[[l,top,r,bottom] for l,r in spans])
boxes('forest_deer','flee',[[980,151,1130,244],[1150,151,1295,244],[1320,151,1462,244]])
boxes('rabbit','flee',[[947,298,1080,380],[1102,298,1218,380],[1220,298,1348,380],[1350,298,1476,380]])
boxes('squirrel','flee',[[955,439,1078,521],[1095,439,1213,521],[1228,439,1359,521],[1375,439,1499,521]])
boxes('raven','takeoff',[[950,567,1062,665],[1078,567,1196,665],[1220,562,1341,665],[1359,556,1485,665]])
boxes('fox','flee',[[965,722,1131,807],[1149,722,1316,807],[1326,722,1507,807]])

CELL_W,CELL_H,COLS=320,128,8
packed = {ref: [] for ref in refs}
for c in creatures:
    first=next(iter(c['states'].values()));box=first['boxes'][0] if 'boxes' in first else first['box'];c['fitSourceHeight']=box[3]-box[1]
    for state,g in c['states'].items():
        boxes=g.pop('boxes',None)
        if boxes is None:
            left,top,right,bottom = g.pop('box');count=g.pop('count')
            boxes=[[round(left+(right-left)*frame/count),top,round(left+(right-left)*(frame+1)/count),bottom] for frame in range(count)]
        g['frames']=[]
        for box in boxes:
            x0,top,x1,bottom=box;w,h=x1-x0,bottom-top
            if w>CELL_W or h>CELL_H:
                raise ValueError('Crop exceeds cell: '+c['id']+'/'+state)
            index=len(packed[c['reference']]);x=index%COLS*CELL_W;y=index//COLS*CELL_H
            data=dict(x=x,y=y,w=w,h=h,anchorX=w/2,anchorY=h-5,sourceBox=box)
            g['frames'].append(data);packed[c['reference']].append((box,x,y))

for ref,items in packed.items():
    atlas=Image.new('RGB',(COLS*CELL_W,((len(items)+COLS-1)//COLS)*CELL_H),(5,12,13))
    for box,x,y in items:atlas.paste(images[ref].crop(box),(x,y))
    atlas.save(ROOT/'public'/('crater-reference-'+ref.lower()+'.png'),optimize=True)

# Present the final roster in level order without altering packed pixel locations.
order=['forest_rat','goblin_miner','wild_boar','dire_wolf','goblin_guard','cave_guardian','forest_troll','jewelheart_guardian','forest_deer','rabbit','squirrel','raven','fox','timber_glider','geode_mole','river_otter']
levels=dict(zip(order[:8],[1,5,8,12,16,18,22,30]))
creatures.sort(key=lambda c:order.index(c['id']))
for c in creatures:
    if c['id'] in levels:c['level']=levels[c['id']]

data=dict(version=1,purpose='Exact reference crops for inspection; not production sprites',
    pixelPolicy='Original decoded JPEG pixels retained without resizing, masking or redrawing.',
    timingPolicy='Preview timing only; no production durations approved.',
    sizePolicy='draftFitHeight is an adjustable fitting proposal, not an approved scale.',
    backgroundPolicy='Board background, ground strips and scene props remain in crops.',
    references={r:dict(file='crater-reference-'+r.lower()+'.png',originalFilename=refs[r]['original_filename'],sha256=refs[r]['sha256']) for r in refs},creatures=creatures)
(ROOT/'public/crater-reference-frames.json').write_text(json.dumps(data,indent=2)+'\n')
print('Packed',sum(len(v) for v in packed.values()),'exact reference crops for',len(creatures),'creatures.')
