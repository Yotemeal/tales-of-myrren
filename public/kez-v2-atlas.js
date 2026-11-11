/* Approved Kez V2 sprite-sheet renderer. Native 21x27 frames; the player
 * cannot silently revert to a superseded character when artwork fails to load. */
(function(){
'use strict';
const atlas=new Image();
let ready=false,failed=false;
let punchSheet=null;
if(window.location&&new URLSearchParams(window.location.search).has('bronze-proof')){
  const punch=new Image();
  punch.onload=()=>{
    if(punch.naturalWidth===63&&punch.naturalHeight===108)punchSheet=punch;
  };
  punch.src='/assets/kez-v2/kez_v2_punch_proof.png?v=1';
}
atlas.onerror=()=>{ready=false;failed=true;console.error('Kez V2 sprite atlas failed to load');window.dispatchEvent?.(new Event('myrren-kez-v2-error'))};
const rows={idle:0,front:1,back:2,left:3,right:4,attack:5};
const frameBounds=[];
// Dominant-hand hilt sockets in the original 21×27 source cells.
const weaponSockets=[
  [[14,20],[15,20],[14,20],[13,20]],
  [[15,20],[15,19],[14,20],[13,19]],
  [[6,16],[6,16],[5,15],[4,16]],
  [[13,18],[9,17],[12,18],[12,18]],
  [[8,18],[8,17],[9,17],[8,17]]
];
// Four bespoke idle poses per direction, synthesized from the approved
// stationary pixels. Unlike walking frames, feet and equipment anchors stay
// fixed. A one-pixel shoulder/torso expansion gives subtle breathing.
const idleArt={};
const idleBounds={};
function makeDirectionalIdleArt(){
  for(const direction of ['back','left','right']){
    const row=rows[direction],sheet=document.createElement('canvas');
    sheet.width=84;sheet.height=27;
    const c=sheet.getContext('2d',{willReadFrequently:true});
    const src=document.createElement('canvas');src.width=21;src.height=27;
    const sc=src.getContext('2d',{willReadFrequently:true});
    sc.drawImage(atlas,0,row*27,21,27,0,0,21,27);
    const original=sc.getImageData(0,0,21,27);
    // Measure the union of all idle poses, not just frame zero. Otherwise
    // a one-pixel breath outside the original silhouette gets cropped away.
    let left=21,top=27,right=-1,bottom=-1;
    for(let pose=0;pose<4;pose++){
      const pixels=new Uint8ClampedArray(original.data);
      if(pose===1||pose===3){
        // Move only the outside torso edge by one pixel; do not disturb
        // helmet, hands, weapons, legs, or the baseline.
        for(let y=10;y<=16;y++){
          let first=-1,last=-1;
          for(let x=3;x<=17;x++)if(original.data[(y*21+x)*4+3]>32){
            if(first<0)first=x;last=x;
          }
          if(first<4||last>16||last-first<5)continue;
          const edge=pose===1?last:first;
          const dest=pose===1?last+1:first-1;
          const si=(y*21+edge)*4,di=(y*21+dest)*4;
          for(let k=0;k<4;k++)pixels[di+k]=original.data[si+k];
        }
      }
      for(let y=0;y<27;y++)for(let x=0;x<21;x++){
        if(pixels[(y*21+x)*4+3]<=16)continue;
        left=Math.min(left,x);right=Math.max(right,x);
        top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
      const frame=c.createImageData(21,27);frame.data.set(pixels);
      c.putImageData(frame,pose*21,0);
    }
    idleArt[direction]=sheet;
    idleBounds[direction]=right<0?{left:0,top:0,right:20,bottom:26}:{left,top,right,bottom};
  }
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
  if(ready){failed=false;inspectFrames();makeDirectionalIdleArt();window.dispatchEvent?.(new Event('myrren-kez-v2-ready'))}
  else{failed=true;console.error('Invalid Kez V2 atlas dimensions:',atlas.naturalWidth,atlas.naturalHeight);window.dispatchEvent?.(new Event('myrren-kez-v2-error'))}
};
atlas.src='/assets/kez-v2/kez_v2_atlas.png?v=1';
function pose(o, now){
  if(!ready)return null;
  const age=now-(o.swingAt??-99999),attacking=age>=0&&age<320;
  const direction=o.dv==='u'?'back':o.dv==='s'?(o.f<0?'left':'right'):'front';
  const nativePunch=punchSheet&&attacking&&o.tool==='fist'&&!o.g?.some(Boolean);
  const punchFrame=age<40?0:age<105?1:age<205?2:age<270?1:0;
  // The legacy attack row has a white slash baked into the body frames.
  // Drawing it together with the separately rotated equipped sword produces
  // two independent blades. Keep the directional body pose during sword hits;
  // one forged sword, anchored at the glove, owns the entire strike.
  // Hold a grounded pose while swinging to avoid the hands marching in place.
  const swordHit=attacking&&o.tool==='sword';
  // The authored idle row is front-facing. Play it for stationary front-facing
  // characters as well as portraits; never turn side/back players toward camera.
  // Combat holds the directional pose so a sword swing cannot snap to idle.
  const frontIdle=!nativePunch&&!swordHit&&!o.moving&&direction==='front';
  const useIdle=o.animateIdle||frontIdle;
  const row=useIdle?rows.idle:rows[direction];
  const directionalIdle=!nativePunch&&!swordHit&&!o.moving&&!useIdle;
  const idlePose=Math.floor(now/650)%4;
  const frame=useIdle?Math.floor(now/440)%4:(swordHit||nativePunch)?0:
    directionalIdle?0:o.moving?Math.floor(now/130)%4:0;
  const bounds=directionalIdle&&idleBounds[direction]?idleBounds[direction]:frameBounds[row][frame];
  const sw=bounds.right-bounds.left+1,sh=bounds.bottom-bounds.top+1;
  const shift=Math.round((bounds.left+bounds.right)/2-10.5);
  const dx=Math.round(-sw/2+shift)-bounds.left,dy=1-sh-bounds.top;
  const [handX,handY]=weaponSockets[row][frame];
  return {direction,row,frame,bounds,sw,sh,dx,dy,
    gripX:dx+handX,gripY:dy+handY,nativePunch,punchFrame,
    idleSheet:directionalIdle?idleArt[direction]:null,idlePose};
}
window.MyrrenKezV2Atlas={
 get ready(){return ready},
 get failed(){return failed},
 get punchReady(){return !!punchSheet},
 get dimensions(){return {cellWidth:21,cellHeight:27,frames:4,rows:6,scale:1}},
 pose,
 draw(ctx,x,y,o,now,selected=pose(o,now)){
  if(!selected)return false;
  const {bounds,sw,sh,idleSheet,idlePose,row,frame,dx,dy}=selected;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  if(selected.nativePunch){
    ctx.drawImage(punchSheet,selected.punchFrame*21,(row-1)*27,21,27,
      Math.round(x)+dx,Math.round(y)+dy,21,27);
  }else ctx.drawImage(idleSheet||atlas,(idleSheet?idlePose:frame)*21+bounds.left,
    (idleSheet?0:row*27)+bounds.top,sw,sh,
    Math.round(x)+dx+bounds.left,Math.round(y)+dy+bounds.top,sw,sh);
  ctx.restore();
  return true;
 }
};
})();
