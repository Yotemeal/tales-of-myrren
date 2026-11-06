/* Approved base-character artwork. Rendering only: no save, stats, movement or hit logic.
 * The armour renderer remains independent until its own artwork pass.
 */
(()=>{
 'use strict';
 const CELL=64,AX=32,AY=60;
 function create(atlas){
  if((atlas.naturalWidth||atlas.width)!==384||(atlas.naturalHeight||atlas.height)!==640)throw Error('Invalid approved character atlas');
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
 window.MyrrenHero={create,supports};
})();
