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
  function head(row,col,cut,rear=false,left=false){
   const refRow=rear?9:left?6:5,refCut=rear?42:44;
   // Anchor at the existing jaw/neck, including the original running bob.
   const y=cut-2;let min=64,max=-1;
   for(let x=16;x<48;x++)if(original[((row*64+y)*384+col*64+x)*4+3]){min=Math.min(min,x);max=Math.max(max,x)}
   const refY=refCut-2;let rmin=64,rmax=-1;
   for(let x=16;x<48;x++)if(original[((refRow*64+refY)*384+x)*4+3]){rmin=Math.min(rmin,x);rmax=Math.max(rmax,x)}
   const offset=Math.round((min+max-rmin-rmax)/2);
   c.save();c.beginPath();c.rect(col*64,row*64,64,64);c.clip();
   c.clearRect(col*64,row*64,64,cut);
   c.drawImage(source,0,refRow*64,64,refCut,col*64+offset,row*64+cut-refCut,64,refCut);
   c.restore();
  }
  for(let row=0;row<5;row++)for(let col=0;col<6;col++){
   const rear=row===4||row===0&&(col===3||col===5),left=row===2||row===0&&col===1;
   head(row,col,cuts[row][col],rear,left);
  }
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

 function create(atlas){
  if((atlas.naturalWidth||atlas.width)!==384||(atlas.naturalHeight||atlas.height)!==640)throw Error('Invalid approved character atlas');
  atlas=matchPunchHair(atlas);
  function pose(o,now){
   const dir=o.dv==='u'?3:o.dv==='s'?(o.f<0?1:2):0;
   const death=o.deathAt!=null?now-o.deathAt:-1;
   const age=now-(o.swingAt??-99999),swing=age>=0&&age<320;
   const hit=o.hurtAt!=null?now-o.hurtAt:-1;
   if(death>=0)return {row:o.f<0?8:7,col:death<130?0:death<250?1:death<390?2:death<550?3:death<720?4:5,dir,dead:true,lift:0};
   if(swing)return {row:dir===3?9:o.f<0?6:5,col:age<50?0:age<90?1:age<140?2:age<200?3:age<260?4:5,dir,dead:false,lift:0,swing:true};
   if(hit>=0&&hit<180)return {row:0,col:dir===3?5:4,dir,dead:false,lift:0,hurt:true};
   if(o.moving)return {row:dir+1,col:Math.floor(now/75)%6,dir,dead:false,lift:0};
   return {row:0,col:dir,dir,dead:false,lift:!o.waving&&now%3600>=1500&&now%3600<2900?1:0};
  }
  const hands=[[3,-10],[3,-8],[13,-13],[4,-10],[3,-9],[3,-10]];
  function draw(ctx,x,y,o,now){
   const p=pose(o,now),sx=p.col*CELL,sy=p.row*CELL,dx=Math.round(x-AX),dy=Math.round(y-AY);
   ctx.save();ctx.imageSmoothingEnabled=false;
   if(p.hurt)ctx.globalAlpha*=.72;
   if(p.lift){
    ctx.drawImage(atlas,sx,sy+54,CELL,10,dx,dy+54,CELL,10);
    ctx.drawImage(atlas,sx,sy,CELL,55,dx,dy-1,CELL,55);
   }else ctx.drawImage(atlas,sx,sy,CELL,CELL,dx,dy,CELL,CELL);
   ctx.restore();
   const rearHands=[[6,-9],[9,-14],[13,-27],[9,-18],[6,-10],[6,-10]];
   const f=p.dir===3?1:o.f<0?-1:1,h=p.swing?(p.dir===3?rearHands[p.col]:hands[p.col]):[p.dir===1||p.dir===2?3:8,-11-p.lift];
   return {...p,handX:x+f*h[0],handY:y+h[1]};
  }
  return {pose,draw};
 }
 const supports=gear=>!gear||!gear.some(t=>t>0);
 window.MyrrenHero={create,supports,matchPunchHair};
})();
