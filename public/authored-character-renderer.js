/* Authored equipment atlas renderer, opt-in only.
 * Unlike Kez V2's procedural overlays, each slot/direction/frame is drawn from
 * artist-authored transparent PNG cells. Never scales down approved source art.
 * The caller supplies the same world-space foot anchor and original gear IDs.
 */
(()=>{'use strict';
const ORDER=[2,3,4,5,7,6,8];
const SLOTS=['head','body','legs','boots','shield','gloves'];
const DIRECTIONS=['front','back','left','right'];
const POSES=['idle','walk','attack'];
const WIDTH=32,HEIGHT=48,FRAMES=4;
const ROWS=DIRECTIONS.length*POSES.length;
const SLOT_LAYERS={under:['shield'],over:['boots','legs','body','gloves','head','shield']};
const allMats=new Set(ORDER);
const validImage=image=>image&&image.naturalWidth===WIDTH*FRAMES&&image.naturalHeight===HEIGHT*ROWS;
const facing=o=>o.dv==='u'?'back':o.dv==='s'?(o.f<0?'left':'right'):'front';
const motion=(o,now)=>{
 const age=now-(o.swingAt??-99999);
 return age>=0&&age<320?'attack':o.moving?'walk':'idle';
};
const frameFor=(pose,o,now)=>{
 if(pose==='idle')return 0;
 if(pose==='attack')return Math.min(3,Math.floor(Math.max(0,now-(o.swingAt??now))/80));
 return Math.floor(now/130)%FRAMES;
};
function create(assetRoot){
 if(typeof assetRoot!=='string'||!/^\/assets\/[a-z0-9/_-]+\/$/.test(assetRoot))
  throw Error('Authored sprite root must be a local assets directory');
 const images=new Map(),errors=new Set();
 const keys=['base',...ORDER.flatMap(mat=>SLOTS.map(slot=>mat+'-'+slot))];
 for(const key of keys){
  const img=new Image();
  images.set(key,img);
  img.onerror=()=>errors.add(key);
  img.onload=()=>{if(!validImage(img))errors.add(key);else errors.delete(key)};
  img.src=assetRoot+key+'.png';
 }
 function readyFor(o){
  if(errors.has('base')||!validImage(images.get('base')))return false;
  const gear=Array.isArray(o.g)?o.g:[];
  return gear.every((mat,i)=>!mat||(i<SLOTS.length&&allMats.has(mat)&&!errors.has(mat+'-'+SLOTS[i])&&validImage(images.get(mat+'-'+SLOTS[i]))));
 }
 function paint(ctx,image,x,y,row,frame,worldW,worldH){
  ctx.drawImage(image,frame*WIDTH,row*HEIGHT,WIDTH,HEIGHT,
    Math.round(x-worldW/2),Math.round(y-worldH),worldW,worldH);
 }
 function draw(ctx,x,y,o,now,opts={}){
  if(!readyFor(o))return false;
  const gear=Array.isArray(o.g)?o.g:[];
  const dir=facing(o),pose=motion(o,now);
  const row=DIRECTIONS.indexOf(dir)*POSES.length+POSES.indexOf(pose);
  const frame=frameFor(pose,o,now);
  // Native 32x48 art stays native. Display size may be set independently
  // by the scene renderer without affecting collision, physics or saves.
  const w=opts.width??24,h=opts.height??36;
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0)
   throw Error('Invalid authored character display dimensions');
  const base=images.get('base');
  const shield=gear[4]&&images.get(gear[4]+'-shield');
  ctx.save();ctx.imageSmoothingEnabled=false;
  // Back shields sit on the back of the character and must be visible.
  // Side shields remain behind the near arm; the front shield covers the chest.
  if(dir==='left'||dir==='right')if(shield)paint(ctx,shield,x,y,row,frame,w,h);
  paint(ctx,base,x,y,row,frame,w,h);
  for(const slot of ['boots','legs','body','gloves','head']){
   const index=SLOTS.indexOf(slot),mat=gear[index];
   if(mat)paint(ctx,images.get(mat+'-'+slot),x,y,row,frame,w,h);
  }
  if(dir==='front'||dir==='back')if(shield)paint(ctx,shield,x,y,row,frame,w,h);
  ctx.restore();
  return true;
 }
 return Object.freeze({draw,readyFor,get errors(){return [...errors]},dimensions:{width:WIDTH,height:HEIGHT,frames:FRAMES,rows:ROWS},directions:DIRECTIONS,poses:POSES});
}
window.MyrrenAuthoredCharacter=Object.freeze({create,order:ORDER,slots:SLOTS,directions:DIRECTIONS,poses:POSES});
})();
