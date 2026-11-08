#!/usr/bin/env python3
"""Prototype only: retarget existing authored armour frames to Kez V2 paperdoll.
Does not alter live game assets. Requires Pillow; run from repository root.
"""
import argparse
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw

METALS=[(2,'bronze'),(3,'iron'),(4,'steel'),(5,'cobalt'),
        (7,'obsidianite'),(6,'aether'),(8,'starsteel')]
SLOTS=('helm','body','legs','boots','gloves','shield')
SOURCE_ROWS=(0,1,4,2,3,5)
PALETTES={
 2:('#56301d','#aa663b','#f1b37c','#d99556'),
 3:('#343342','#9293a5','#e0e1ed','#b6b4ca'),
 4:('#29394f','#b2c8e6','#f6f9ff','#7cabe0'),
 5:('#261c35','#60496f','#aa8bb4','#81598d'),
 7:('#250f39','#8325be','#e36bff','#c346ec'),
 6:('#0a3540','#198f8d','#91e4db','#efc653'),
 8:('#363d51','#d9e2f2','#ffffff','#efb63a')
}
SIZE=(21,27)

def rgb(hexcolor):
 return tuple(bytes.fromhex(hexcolor.lstrip('#')))

def recolor(px,mat):
 r,g,b,a=px
 if a<128:return (0,0,0,0)
 lum=.24*r+.56*g+.20*b
 if lum<35:return (14,13,20,255)
 palette=PALETTES[mat]
 index=0 if lum<75 else 1 if lum<198 else 2
 shade=palette[index]
 contrast=max(r,g,b)-min(r,g,b)>65
 if mat in (6,8) and contrast and lum>140:shade=palette[3]
 if mat==7 and contrast and lum>172:shade=palette[3]
 return (*rgb(shade),255)

def directional_piece(worn,base,ownership,row,col,slot,mat):
 rect=(64*col,64*row,64*(col+1),64*(row+1))
 source=worn.crop(rect).load()
 original=base.crop(rect).load()
 owner=ownership.crop(rect).load()
 part=Image.new('RGBA',(64,64))
 dest=part.load()
 index={'helm':0,'body':1,'legs':2,'boots':3,'gloves':4}[slot]
 for y in range(64):
  for x in range(64):
   o=owner[x,y]
   if o[0]!=index or (index==0 and o[1]!=255):continue
   pixel=source[x,y]
   if pixel[3]<128:continue
   prev=original[x,y]
   if prev[3]>=128 and max(abs(pixel[k]-prev[k]) for k in range(3))<14:continue
   dest[x,y]=recolor(pixel,mat)
 return part.crop((11,4,55,62)).resize(SIZE,Image.Resampling.NEAREST)

def front_piece(approved,tier,slot,frame,row):
 ref=approved.crop((tier*176,0,(tier+1)*176,276))
 bounds=ref.getbbox()
 if bounds is None:raise ValueError('Blank approved armour reference: '+str(tier))
 ref=ref.crop(bounds).resize((17,26),Image.Resampling.LANCZOS)
 ref=ref.quantize(colors=24,method=2).convert('RGBA')
 out=Image.new('RGBA',SIZE)
 dst=out.load();src=ref.load()
 for y in range(26):
  for x in range(17):
   color=src[x,y]
   if color[3]<150:continue
   open_face=tier in (0,1,2,3)
   if slot=='helm':
    keep=y<=13 and not (open_face and 5<=x<=11 and 7<=y<=13)
   elif slot=='body':
    keep=13<=y<=22 and (4<=x<=12 or 14<=y<=18)
   elif slot=='gloves':
    keep=15<=y<=21 and (x<=3 or x>=13)
   elif slot=='legs':
    keep=21<=y<=24 and 4<=x<=12
   elif slot=='boots':
    keep=24<=y<=25
   else:keep=False
   if not keep:continue
   ox=2+x;oy=1+y
   if row==1 and frame in (1,3):
    if slot in ('legs','boots'):ox+=1 if frame==1 else -1
    if slot in ('body','gloves'):oy=max(0,oy-1)
   if 0<=ox<21 and 0<=oy<27:dst[ox,oy]=(*color[:3],255)
 return out

def myrrenite_masks(js):
 text=js[js.index('const MYRRENITE_MASKS='):js.index('MYRRENITE_MASKS.left=')]
 views={}
 for name in ('front','right','back'):
  match=re.search(r'\b'+name+r':\s*\[(.*?)\]',text,re.S)
  if match is None:raise ValueError('Missing Myrrenite '+name+' pixels')
  rows=re.findall(r'"([A-Z.]+)"',match.group(1))
  if len(rows)!=17 or any(len(row)!=15 for row in rows):
   raise ValueError('Myrrenite mask must be 15x17')
  views[name]=rows
 views['left']=[row[::-1] for row in views['right']]
 return views

def visor(rows):
 shades={'K':rgb(PALETTES[6][0]),'T':rgb(PALETTES[6][1]),
         'L':rgb(PALETTES[6][2]),'D':rgb(PALETTES[6][0]),
         'G':rgb(PALETTES[6][3]),'H':(255,243,182),'V':(6,15,24)}
 out=Image.new('RGBA',SIZE)
 px=out.load()
 for y,line in enumerate(rows):
  for x,v in enumerate(line):
   if v!='.':px[x+3,y]=(*shades[v],255)
 return out

def shield_piece(sheet,tier,row):
 view=2 if row in (3,4,5) else 1 if row==2 else 0
 original=sheet.crop((tier*32,view*32,(tier+1)*32,(view+1)*32))
 small=original.resize((3,9) if view==2 else (7,9),Image.Resampling.NEAREST)
 out=Image.new('RGBA',SIZE)
 x=2 if row!=2 else 14
 if row==3:x=17
 if row in (4,5):x=1
 out.alpha_composite(small,(x,15))
 return out

def build(public,destination):
 destination.mkdir(parents=True,exist_ok=True)
 owned=Image.open(public/'wardrobe-ownership-v5.png').convert('RGBA')
 base=Image.open(public/'wardrobe-base-v5.png').convert('RGBA')
 shield=Image.open(public/'shields-approved-v1.png').convert('RGBA')
 approved=Image.open(public/'assets/kez-v2/smithing_armour_front_atlas.png').convert('RGBA')
 hero=Image.open(public/'assets/kez-v2/kez_v2_atlas.png').convert('RGBA')
 masks=myrrenite_masks((public/'kez-v2-equipment.js').read_text())
 if any(i.size!=(384,640) for i in (owned,base)):raise ValueError('Wardrobe source size mismatch')
 if shield.size!=(224,96) or approved.size!=(1232,276) or hero.size!=(84,162):
  raise ValueError('Approved art has unexpected dimensions')
 atlas=Image.new('RGBA',(7*84,6*162))
 for tier,(mat,name) in enumerate(METALS):
  worn=Image.open(public/('wardrobe-'+name+'-v5.png')).convert('RGBA')
  if worn.size!=(384,640):raise ValueError(name+' source size mismatch')
  for slotindex,slot in enumerate(SLOTS):
   for row in range(6):
    for col in range(4):
     if slot=='shield':sprite=shield_piece(shield,tier,row)
     elif mat==6 and slot=='helm':
      facing={0:'front',1:'front',2:'back',3:'left',4:'right',5:'right'}[row]
      sprite=visor(masks[facing])
     elif row in (0,1):sprite=front_piece(approved,tier,slot,col,row)
     else:sprite=directional_piece(worn,base,owned,SOURCE_ROWS[row],col,slot,mat)
     atlas.alpha_composite(sprite,(tier*84+col*21,slotindex*162+row*27))
 atlas.save(destination/'kez-v2-paperdoll-native-v1.png',optimize=True)
 preview=Image.new('RGBA',(7*142,4*162),(34,41,49,255))
 pen=ImageDraw.Draw(preview)
 for ri,row in enumerate((1,4,3,2)):
  for tier,(mat,name) in enumerate(METALS):
   sprite=hero.crop((0,row*27,21,(row+1)*27)).copy()
   shieldlayer=atlas.crop((tier*84,5*162+row*27,tier*84+21,5*162+(row+1)*27))
   if row in (3,4):sprite=Image.alpha_composite(shieldlayer,sprite)
   for slot in (3,2,1,4,0):
    piece=atlas.crop((tier*84,slot*162+row*27,tier*84+21,slot*162+(row+1)*27))
    sprite=Image.alpha_composite(sprite,piece)
   if row not in (3,4):sprite=Image.alpha_composite(sprite,shieldlayer)
   preview.alpha_composite(sprite.resize((105,135),Image.Resampling.NEAREST),
                           (tier*142+22,ri*162+20))
   pen.text((tier*142+5,ri*162+4),name,fill='#faf0dc')
 preview.save(destination/'kez-v2-paperdoll-review.png',optimize=True)
 manifest={'schema':'myrren.kez-v2.paperdoll-prototype.v1',
  'status':'experimental-not-approved','atlas':[588,972],'cell':[21,27],
  'rows':['idle','front','back','left','right','attack'],'slots':list(SLOTS),
  'materials':[{'id':mat,'key':name} for mat,name in METALS],
  'sourceMapping':list(SOURCE_ROWS),
  'warning':'Proof of concept. Existing older directional art has been recoloured; side/back and mixed gear still need hand-authoring and visual approval.'}
 (destination/'kez-v2-paperdoll-native-v1.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print('Generated experimental 588x972 sprite sheet and review images.')

if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--public',type=Path,default=Path('public'))
 parser.add_argument('--out',type=Path,default=Path('/tmp/kez-v2-paperdoll'))
 args=parser.parse_args()
 build(args.public,args.out)
