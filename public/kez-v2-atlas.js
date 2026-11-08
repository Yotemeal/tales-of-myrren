// Approved Kez sprite-sheet renderer. The PNG must be deployed at this URL.
// If absent, the game retains its existing character rather than drawing a placeholder.
(function(){
'use strict';
const atlas=new Image();
let ready=false;
atlas.onload=()=>{ready=atlas.naturalWidth===84&&atlas.naturalHeight===162};
atlas.onerror=()=>{ready=false};
atlas.src='/assets/kez-v2/kez_v2_atlas.png?v=1';
const rows={idle:0,front:1,back:2,left:3,right:4,attack:5};
window.MyrrenKezV2Atlas={
 get ready(){return ready},
 draw(ctx,x,y,o,now){
  if(!ready)return false;
  const age=now-(o.swingAt??-99999),attacking=age>=0&&age<320;
  const direction=o.dv==='u'?'back':o.dv==='s'?(o.f<0?'left':'right'):'front';
  const row=attacking?rows.attack:o.moving?rows[direction]:rows.idle;
  const frame=attacking?Math.min(3,Math.floor(age/80)):o.moving?Math.floor(now/130)%4:Math.floor(now/480)%4;
  const w=21,h=27;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(atlas,frame*w,row*h,w,h,Math.round(x)-8,Math.round(y)-23,16,23);
  ctx.restore();
  return true;
 }
};
})();