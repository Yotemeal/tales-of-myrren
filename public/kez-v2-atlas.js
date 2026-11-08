/* Approved Kez V2 sprite-sheet renderer. Native 21x27 frames; the player
 * cannot silently revert to a superseded character when artwork fails to load. */
(function(){
'use strict';
const atlas=new Image();
let ready=false;
atlas.onerror=()=>{ready=false;console.error('Kez V2 sprite atlas failed to load')};
const rows={idle:0,front:1,back:2,left:3,right:4,attack:5};
const frameBounds=[];
function inspectFrames(){
  // The source sheet has different transparent padding for each direction.
  // Measure the visible pixels once, then anchor every pose at the same feet.
  const off=document.createElement('canvas');
  off.width=atlas.naturalWidth;off.height=atlas.naturalHeight;
  const c=off.getContext('2d',{willReadFrequently:true});
  c.drawImage(atlas,0,0);
  const pixels=c.getImageData(0,0,off.width,off.height).data;
  for(let row=0;row<6;row++){
    frameBounds[row]=[];
    for(let frame=0;frame<4;frame++){
      let left=21,top=27,right=-1,bottom=-1;
      for(let py=0;py<27;py++)for(let px=0;px<21;px++){
        const alpha=pixels[(((row*27+py)*off.width)+(frame*21+px))*4+3];
        if(alpha>16){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py)}
      }
      frameBounds[row][frame]=right<0?{left:0,top:0,right:20,bottom:26}:{left,top,right,bottom};
    }
  }
}
atlas.onload=()=>{
  ready=atlas.naturalWidth===84&&atlas.naturalHeight===162;
  if(ready){inspectFrames();window.dispatchEvent?.(new Event('myrren-kez-v2-ready'))}
  else console.error('Invalid Kez V2 atlas dimensions:',atlas.naturalWidth,atlas.naturalHeight);
};
atlas.src='/assets/kez-v2/kez_v2_atlas.png?v=1';
window.MyrrenKezV2Atlas={
 get ready(){return ready},
 get dimensions(){return {cellWidth:21,cellHeight:27,frames:4,rows:6,scale:1}},
 draw(ctx,x,y,o,now){
  if(!ready)return false;
  const age=now-(o.swingAt??-99999),attacking=age>=0&&age<320;
  const direction=o.dv==='u'?'back':o.dv==='s'?(o.f<0?'left':'right'):'front';
  // Attack frames were drawn facing right. Do not use them when facing
  // up/down, or the character abruptly changes direction mid-swing.
  // Only sword attacks use the dedicated sword-swing sprite row.
  // Bare-handed attacks keep the normal body pose; the game draws the punch separately.
  const useAttack=attacking&&o.tool==='sword'&&o.dv==='s';
  const row=useAttack?rows.attack:o.animateIdle?rows.idle:rows[direction];
  const frame=useAttack?Math.min(3,Math.floor(age/80)):o.animateIdle?Math.floor(now/440)%4:o.moving?Math.floor(now/130)%4:0;
  const bounds=frameBounds[row][frame];
  const scale=1,sw=bounds.right-bounds.left+1,sh=bounds.bottom-bounds.top+1;
  const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
  const flip=useAttack&&o.f<0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(x),Math.round(y));
  if(flip)ctx.scale(-1,1);
  // Centre on the body's shared centreline; bottom of every visible
  // frame touches the same ground pixel, eliminating directional jumps.
  const center=10.5;
  const offset=Math.round(((bounds.left+bounds.right)/2-center)*scale);
  ctx.drawImage(atlas,frame*21+bounds.left,row*27+bounds.top,sw,sh,
    Math.round(-dw/2+offset),1-dh,dw,dh);
  ctx.restore();
  return true;
 }
};
})();