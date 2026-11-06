/* Approved base-character artwork. Rendering only: no save, stats, movement or hit logic.
 * The armour renderer remains independent until its own artwork pass.
 */
(()=>{
 'use strict';
 const CELL=64,AX=32,AY=60;
 // Reuse the approved punch head pixels rather than generating a second haircut.
 // Body poses, hit frames and the source asset remain intact.
 const prepared=new WeakMap();
 function matchPunchHair(source){
  if(prepared.has(source))return prepared.get(source);
  const atlas=document.createElement('canvas');atlas.width=384;atlas.height=640;
  const c=atlas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(source,0,0);
  const original=c.getImageData(0,0,384,640).data;
  const cuts=[
   [43,44,44,43,46,46],
   [43,44,44,43,44,43],
   [44,44,44,44,44,44],
   [44,44,44,44,44,44],
   [42,43,44,43,42,43]
  ];
  function head(row,col,cut,rear=false,left=false,fixedOffset=null){
   const refRow=rear?9:left?6:5,refCut=rear?42:44;
   // Anchor at the existing jaw/neck, including the original running bob.
   const y=cut-2;let min=64,max=-1;
   for(let x=16;x<48;x++)if(original[((row*64+y)*384+col*64+x)*4+3]){min=Math.min(min,x);max=Math.max(max,x)}
   const refY=refCut-2;let rmin=64,rmax=-1;
   for(let x=16;x<48;x++)if(original[((refRow*64+refY)*384+x)*4+3]){rmin=Math.min(rmin,x);rmax=Math.max(rmax,x)}
   const offset=fixedOffset??Math.round((min+max-rmin-rmax)/2);
   c.save();c.beginPath();c.rect(col*64,row*64,64,64);c.clip();
   c.clearRect(col*64,row*64,64,cut);
   c.drawImage(source,0,refRow*64,64,refCut,col*64+offset,row*64+cut-refCut,64,refCut);
   c.restore();
  }
  for(let row=0;row<5;row++)for(let col=0;col<6;col++){
   const rear=row===4||row===0&&(col===3||col===5),left=row===2||row===0&&col===1;
   head(row,col,cuts[row][col],rear,left);
  }
  // Rear attachment points belong to each body's neck, not the hair outline.
  head(0,3,43,true,false,0);
  head(0,5,46,true,false,1);
  // The attack's chin continues two rows below the hair/face cap. Copy only
  // those jaw pixels, excluding the shoulder beside them. Fixed anatomical
  // landmarks keep the old running chin from appearing as a second mouth.
  function completeHead(row,col,refRow,offset,jawY,jawMasks){
   const ox=col*64,oy=row*64,left=refRow===6,dy=jawY-45,cut=row===0?46:44;
   c.save();c.beginPath();c.rect(ox,oy,64,64);c.clip();
   c.clearRect(ox,oy,64,64);c.drawImage(source,ox,oy,64,64,ox,oy,64,64);
   c.clearRect(ox,oy,64,cut);
   jawMasks.forEach(([x0,x1],i)=>c.clearRect(ox+x0,oy+cut+i,x1-x0+1,1));
   c.drawImage(source,0,refRow*64,64,44,ox+offset,oy+dy,64,44);
   const chin=left?[[27,34],[28,33]]:[[29,36],[30,35]];
   chin.forEach(([x0,x1],i)=>c.drawImage(source,x0,refRow*64+44+i,x1-x0+1,1,ox+offset+x0,oy+dy+44+i,x1-x0+1,1));
   c.restore();
  }
  const sideJawMasks=[
   [[25,34],[25,33]],
   [[25,36],[26,34],[28,33]],
   [[26,36],[27,33]],
   [[25,36],[25,33],[27,31]],
   [[25,35],[26,33]],
   [[26,34],[27,32]]
  ];
  const sideX=[-2,-1,-1,-2,-1,-1],sideJawY=[45,46,45,46,45,45];
  for(let col=0;col<6;col++){
   completeHead(2,col,6,sideX[col],sideJawY[col],sideJawMasks[col]);
   completeHead(3,col,5,-sideX[col],sideJawY[col],sideJawMasks[col].map(([x0,x1])=>[63-x1,63-x0]));
  }
  // Removing the old jaw also cleared a few neck pixels behind the new chin.
  // Restore only those interior pixels, using each pose's own shoulder shade.
  // Mirroring the coordinates keeps both side-running loops sealed identically.
  const neckJoins=[
   [[33,44],[34,44],[32,45],[33,45]],
   [[34,45],[33,46]],
   [[34,44],[35,44],[36,44],[33,45]],
   [[36,44],[33,45]],
   [[34,44],[35,44],[33,45]],
   [[34,44]]
  ];
  for(let col=0;col<6;col++)for(const row of [2,3]){
   const mirror=row===3,neckX=mirror?29:34,i=((row*64+47)*384+col*64+neckX)*4;
   c.fillStyle='rgb('+original[i]+','+original[i+1]+','+original[i+2]+')';
   for(const [x,y] of neckJoins[col])c.fillRect(col*64+(mirror?63-x:x),row*64+y,1,1);
  }
  completeHead(0,4,5,0,49,[[25,38],[27,38],[28,36],[30,35]]);
  for(let row=7;row<=8;row++)for(let col=0;col<2;col++)head(row,col,col===0?43:46,false,row===8);
  // Hair naturally lies differently during the kneel/fall. Keep those silhouettes
  // and the hands/body in front, while using the punch's exact hair colours.
  const isHair=(r,g,b)=>r<145&&g<115&&b<150&&r-g<40;
  const palette=[],seen=new Set();
  for(let y=22;y<42;y++)for(let x=16;x<48;x++){
   const i=((5*64+y)*384+x)*4,r=original[i],g=original[i+1],b=original[i+2],key=(r<<16)|(g<<8)|b;
   if(original[i+3]&&isHair(r,g,b)&&!seen.has(key)){seen.add(key);palette.push([r,g,b])}
  }
  const fallBoxes=[[20,33,44,54],[18,40,35,60],[14,42,33,60],[14,45,33,60]];
  const result=c.getImageData(0,0,384,640),data=result.data;
  for(let row=7;row<=8;row++)for(let col=2;col<6;col++){
   let [x0,y0,x1,y1]=fallBoxes[col-2];if(row===8)[x0,x1]=[64-x1,64-x0];
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const i=((row*64+y)*384+col*64+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    if(!data[i+3]||!isHair(r,g,b))continue;
    let best=palette[0],distance=Infinity;
    for(const color of palette){const d=(r-color[0])**2+(g-color[1])**2+(b-color[2])**2;if(d<distance){distance=d;best=color}}
    data[i]=best[0];data[i+1]=best[1];data[i+2]=best[2];
   }
  }
  c.putImageData(result,0,0);prepared.set(source,atlas);return atlas;
 }

 function create(atlas,options={}){
  if((atlas.naturalWidth||atlas.width)!==384||(atlas.naturalHeight||atlas.height)!==640)throw Error('Invalid approved character atlas');
  atlas=options.rawFrames?atlas:matchPunchHair(atlas);
  function pose(o,now){
   const dir=o.dv==='u'?3:o.dv==='s'?(o.f<0?1:2):0;
   const death=o.deathAt!=null?now-o.deathAt:-1;
   const age=now-(o.swingAt??-99999),swing=age>=0&&age<320;
   const hit=o.hurtAt!=null?now-o.hurtAt:-1;
   if(death>=0)return {row:o.f<0?8:7,col:death<130?0:death<250?1:death<390?2:death<550?3:death<720?4:5,dir,dead:true,lift:0};
   if(swing&&o.weaponMat&&window.MyrrenSwordActions?.ready)return {row:dir,col:age<50?0:age<90?1:age<140?2:age<200?3:age<260?4:5,dir,dead:false,lift:0,swing:true,swordAction:true};
   if(swing)return {row:dir===3?9:o.f<0?6:5,col:age<50?0:age<90?1:age<140?2:age<200?3:age<260?4:5,dir,dead:false,lift:0,swing:true};
   if(hit>=0&&hit<180)return {row:0,col:dir===3?5:4,dir,dead:false,lift:0,hurt:true};
   if(o.moving)return {row:dir+1,col:Math.floor(now/75)%6,dir,dead:false,lift:0};
   return {row:0,col:dir,dir,dead:false,lift:!o.waving&&now%3600>=1500&&now%3600<2900?1:0};
  }
  const hands=[[3,-10],[3,-8],[13,-13],[4,-10],[3,-9],[3,-10]];
  function draw(ctx,x,y,o,now){
   const p=pose(o,now),painted=p.swordAction?window.MyrrenSwordActions.compose(o.g,o.armourDye):window.MyrrenArmour?.ready?window.MyrrenArmour.compose(atlas,o.g,o.armourDye):atlas;
   const scale=window.MyrrenWardrobe?.ready&&!o.nativeScale?40/52:1;
   const sx=p.col*CELL,sy=p.row*CELL,dx=scale===1?Math.round(x-AX):-AX,dy=scale===1?Math.round(y-AY):-AY;
   ctx.save();ctx.imageSmoothingEnabled=false;if(scale!==1){ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale)}
   if(p.hurt)ctx.globalAlpha*=.72;
   if(p.lift){
    ctx.drawImage(painted,sx,sy+54,CELL,10,dx,dy+54,CELL,10);
    ctx.drawImage(painted,sx,sy,CELL,55,dx,dy-1,CELL,55);
   }else if(p.hurt&&p.dir===1){
    ctx.translate(dx+CELL,dy);ctx.scale(-1,1);ctx.drawImage(painted,sx,sy,CELL,CELL,0,0,CELL,CELL);
   }else ctx.drawImage(painted,sx,sy,CELL,CELL,dx,dy,CELL,CELL);
   ctx.restore();
   const rearHands=[[6,-9],[9,-14],[13,-27],[9,-18],[6,-10],[6,-10]];
   const f=p.dir===3?1:o.f<0?-1:1,h=p.swing?(p.dir===3?rearHands[p.col]:hands[p.col]):[p.dir===1||p.dir===2?3:8,-11-p.lift];
   const socket=p.swordAction?window.MyrrenSwordActions.attachments(p,o).sword:null,worn=socket?{x:socket[0]-32,y:socket[1]-60,nameY:-57}:window.MyrrenWardrobe?.hand(p,o);
   return worn?{...p,handX:x+worn.x*scale,handY:y+worn.y*scale,nameY:y+worn.nameY*scale}:{...p,handX:x+f*h[0],handY:y+h[1]};
  }
  function drawGrip(ctx,x,y,o,now){
   const p=pose(o,now),socket=p.swordAction?window.MyrrenSwordActions.attachments(p,o).sword:null,worn=socket?{x:socket[0]-32,y:socket[1]-60}:window.MyrrenWardrobe?.hand(p,o);if(!worn||p.dead)return;
   const scale=window.MyrrenWardrobe?.ready&&!o.nativeScale?40/52:1,hx=x+worn.x*scale,hy=y+worn.y*scale;
   ctx.save();ctx.beginPath();ctx.rect(Math.floor(hx-3*scale),Math.floor(hy-3*scale),Math.ceil(6*scale),Math.ceil(6*scale));ctx.clip();draw(ctx,x,y,o,now);ctx.restore();
  }
  let armedCanvas=null,bodyCanvas=null,shieldCanvas=null;
  const makeLayer=()=>{const c=document.createElement('canvas');c.width=c.height=128;return c};
  function drawEquipped(ctx,x,y,o,now){
   if(!o.weaponMat||!window.MyrrenSwords?.ready||!window.MyrrenSwordActions?.ready)return draw(ctx,x,y,o,now);
   const p=pose(o,now);if(p.dead)return draw(ctx,x,y,o,now);
   if(!armedCanvas){armedCanvas=makeLayer();bodyCanvas=makeLayer();shieldCanvas=makeLayer()}
   const a=armedCanvas.getContext('2d'),b=bodyCanvas.getContext('2d'),s=shieldCanvas.getContext('2d');for(const q of[a,b,s]){q.clearRect(0,0,128,128);q.imageSmoothingEnabled=false}
   const g=(o.g||[0,0,0,0,0,0]).slice(),shieldMat=g[4];g[4]=0;
   const bodyOptions={...o,g,nativeScale:true};draw(b,64,100,bodyOptions,now);
   const sockets=window.MyrrenSwordActions.attachments(p,o),swordPoint=[64+sockets.sword[0]-32,100+sockets.sword[1]-60],shieldPoint=[64+sockets.shield[0]-32,100+sockets.shield[1]-60],age=now-(o.swingAt??-99999),angle=o.weaponAngle??window.MyrrenSwords.angle(age),flip=p.dir===1||p.dir===3?-1:1,farSword=p.dir===1||p.dir===3;
   const paintSword=()=>window.MyrrenSwords.draw(a,o.weaponMat,swordPoint[0],swordPoint[1],flip,angle,52/40);
   if(farSword)paintSword();a.drawImage(bodyCanvas,0,0);
   if(shieldMat){const sprite=window.MyrrenWardrobe.shieldSprite(shieldMat,p.dir===3?2:p.dir===0?0:1);if(sprite){s.drawImage(sprite,Math.round(shieldPoint[0]-16-(p.dir===0||p.dir===1?3:0)),Math.round(shieldPoint[1]-13));if(p.dir===2||p.dir===3){const body=b.getImageData(0,0,128,128).data,edge=s.getImageData(0,0,128,128);for(let yy=0;yy<128;yy++){let left=128,right=-1;for(let xx=0;xx<128;xx++)if(body[(yy*128+xx)*4+3]){left=Math.min(left,xx);right=Math.max(right,xx)}for(let xx=0;xx<128;xx++){const i=(yy*128+xx)*4,allowed=p.dir===3?xx>right&&xx<=right+2:xx<left&&xx>=left-2;if(right<0||yy<100+sockets.cut-60+2||yy<shieldPoint[1]-8||yy>shieldPoint[1]+6||!allowed)edge.data[i+3]=0}}s.putImageData(edge,0,0)}a.drawImage(shieldCanvas,0,0)}}
   if(!farSword){paintSword();a.save();a.beginPath();a.rect(Math.floor(swordPoint[0]-3),Math.floor(swordPoint[1]-3),6,6);a.clip();a.drawImage(bodyCanvas,0,0);a.restore()}
   const scale=o.nativeScale?1:40/52;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(armedCanvas,Math.round(x-64*scale),Math.round(y-100*scale),128*scale,128*scale);ctx.restore();
   return {...p,handX:x+(swordPoint[0]-64)*scale,handY:y+(swordPoint[1]-100)*scale,nameY:y-57*scale,swordPoint:sockets.sword.slice(),shieldPoint:sockets.shield.slice()};
  }
  return {pose,draw,drawGrip,drawEquipped};
 }
 const supports=gear=>!gear||!gear.some(t=>t>0)||!!window.MyrrenArmour?.ready&&gear.every(t=>Number.isInteger(t)&&t>=0&&t<=8);
 window.MyrrenHero={create,supports,matchPunchHair};
})();
