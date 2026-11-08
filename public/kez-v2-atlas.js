// Approved Kez sprite-sheet renderer. The PNG must be deployed at this URL.
// If absent, the game retains its existing character rather than drawing a placeholder.
(function(){
'use strict';
const atlas=new Image();
let ready=false;
atlas.onerror=()=>{ready=false};
const rows={idle:0,front:1,back:2,left:3,right:4,attack:5};
const frameBounds=[];
const backFrameCache=[];
function repairedBackFrame(frame,bounds,dw,dh){
  const key=frame+':'+dw+':'+dh;
  if(backFrameCache[frame]?.key===key)return backFrameCache[frame].canvas;
  const out=document.createElement('canvas');out.width=dw;out.height=dh;
  const c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;
  c.drawImage(atlas,frame*21+bounds.left,rows.back*27+bounds.top,
    bounds.right-bounds.left+1,bounds.bottom-bounds.top+1,0,0,dw,dh);
  // At 80% nearest-neighbour scaling a single-pixel collar can vanish.
  // Restore only fully enclosed transparent pixels near the back neck;
  // never paint outside the silhouette or across an open edge.
  const data=c.getImageData(0,0,dw,dh),p=data.data;
  const at=(x,y)=>(y*dw+x)*4;
  const source=new Uint8ClampedArray(p);
  const neckTop=Math.max(2,Math.floor(dh*.35));
  const neckBottom=Math.min(dh-2,Math.ceil(dh*.68));
  for(let y=neckTop;y<neckBottom;y++)for(let x=Math.floor(dw*.34);x<Math.ceil(dw*.66);x++){
    const i=at(x,y),above=at(x,y-1),below=at(x,y+1);
    if(source[i+3]>16||source[above+3]<200||source[below+3]<200)continue;
    // Require continuous silhouette on both sides of the seam.
    const left=at(x-1,y),right=at(x+1,y);
    if(source[left+3]<100&&source[right+3]<100)continue;
    const from=source[below+3]>=source[above+3]?below:above;
    p[i]=source[from];p[i+1]=source[from+1];p[i+2]=source[from+2];p[i+3]=255;
  }
  c.putImageData(data,0,0);
  backFrameCache[frame]={key,canvas:out};return out;
}

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
  if(ready)inspectFrames();
};
atlas.src='/assets/kez-v2/kez_v2_atlas.png?v=1';
window.MyrrenKezV2Atlas={
 get ready(){return ready},
 draw(ctx,x,y,o,now){
  if(!ready)return false;
  const age=now-(o.swingAt??-99999),attacking=age>=0&&age<320;
  const direction=o.dv==='u'?'back':o.dv==='s'?(o.f<0?'left':'right'):'front';
  // Attack frames were drawn facing right. Do not use them when facing
  // up/down, or the character abruptly changes direction mid-swing.
  const useAttack=attacking&&o.dv==='s';
  const row=useAttack?rows.attack:(o.animateIdle||!o.moving)?rows.idle:rows[direction];
  const frame=useAttack?Math.min(3,Math.floor(age/80)):o.moving?Math.floor(now/130)%4:Math.floor(now/440)%4;
  const bounds=frameBounds[row][frame];
  const scale=0.8,sw=bounds.right-bounds.left+1,sh=bounds.bottom-bounds.top+1;
  const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
  const flip=useAttack&&o.f<0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(x),Math.round(y));
  if(flip)ctx.scale(-1,1);
  // Centre on the body's shared centreline; bottom of every visible
  // frame touches the same ground pixel, eliminating directional jumps.
  const center=10.5;
  const offset=Math.round(((bounds.left+bounds.right)/2-center)*scale);
  if(row===rows.back&&o.moving){
    const repaired=repairedBackFrame(frame,bounds,dw,dh);
    ctx.drawImage(repaired,Math.round(-dw/2+offset),1-dh);
  }else ctx.drawImage(atlas,frame*21+bounds.left,row*27+bounds.top,sw,sh,
    Math.round(-dw/2+offset),1-dh,dw,dh);
  ctx.restore();
  return true;
 }
};
})();