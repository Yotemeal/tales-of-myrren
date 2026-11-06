/* Native V31 face consistency and a restrained, feet-planted idle cadence. */
(() => {
  'use strict';
  function buildFaceAtlas(image) {
    const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;
    const c=atlas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,0,0);
    // The standing front frame has a different white eye. Use the approved
    // walking face, aligned to each pose's head centre. Preserve hair, jaw,
    // neck, torso, legs, and all side/back artwork outside this small patch.
    const walkCenters=[15,16,15,15];
    for(let frame=0;frame<4;frame++){
      c.clearRect(frame*32+10,18,12,5);
      c.drawImage(image,9,4*40+18,12,5,frame*32+10,18,12,5);
      const x=frame*32+walkCenters[frame]-6;
      c.clearRect(x,4*40+18,12,5);
      c.drawImage(image,9,4*40+18,12,5,x,4*40+18,12,5);
    }
    return atlas;
  }
  function idleLift(now,resting=true) {
    if(!resting||!Number.isFinite(now))return 0;
    const phase=((now%3600)+3600)%3600;
    return phase>=1500&&phase<2900?1:0;
  }
  // The approved atlas remains the source for every pose, including equipment.
  // Discrete native-pixel offsets avoid stretching the face or opening neck seams.
  function pose(now,o) {
    const age=now-(o.swingAt??-99999),swing=age>=0&&age<320;
    const dir=o.dv==='u'?3:o.dv==='s'?(o.f<0?1:2):0;
    const stage=swing?(age<90?1:age<200?2:3):0;
    const death=o.deathAt!=null?Math.max(0,now-o.deathAt):-1;
    const hurt=o.hurtAt!=null&&now-o.hurtAt>=0&&now-o.hurtAt<180;
    if(death>=0)return {row:dir,frame:0,stage:0,death,lean:0,lift:0,hurt:false};
    const row=dir+(o.moving||swing?4:0);
    const frame=swing?[0,3,1,0][stage]:o.moving?Math.floor(now/90)%4:o.animatedGear?Math.floor(now/280)%4:0;
    const facing=dir===1?-1:dir===2?1:dir===0?(o.f||1):0;
    const lean=swing?facing*([0,-1,2,1][stage]):hurt?-facing:0;
    return {row,frame,stage,death,lean,lift:hurt?-1:idleLift(now,!o.moving&&!swing&&!o.waving),hurt};
  }
  const fallen=new WeakMap();
  function fallenFrame(sprite,row,flat) {
    let cache=fallen.get(sprite);if(!cache){cache=new Map();fallen.set(sprite,cache)}
    const key=row+':'+flat;if(cache.has(key))return cache.get(key);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.translate(32,32);
    c.rotate((row===1?-1:1)*(flat?Math.PI/2:Math.PI/4));
    c.drawImage(sprite,0,row*40,32,40,-16,-20,32,40);
    const data=c.getImageData(0,0,64,64).data;let left=64,right=0,top=64,bottom=0;
    for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(data[(y*64+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
    const frame={canvas,left,top,w:right-left+1,h:bottom-top+1};cache.set(key,frame);return frame;
  }
  function drawPose(c,sprite,x,y,p) {
    const sx=p.frame*32,sy=p.row*40,dx=Math.round(x-16),dy=Math.round(y-40);
    if(p.death>=0){
      // Kneel, fall, then rest on the ground. Keep the face at native size.
      if(p.death<180){
        c.drawImage(sprite,sx,sy+32,32,8,dx,Math.round(y-2),32,2);
        c.drawImage(sprite,sx,sy,32,32,dx,Math.round(y-34),32,32);
      }else {
        const f=fallenFrame(sprite,p.row,p.death>=360);
        c.drawImage(f.canvas,f.left,f.top,f.w,f.h,Math.round(x-f.w/2),Math.round(y-f.h),f.w,f.h);
      }
      return;
    }
    if(p.lean||p.lift){
      c.drawImage(sprite,sx,sy+31,32,9,dx,dy+31,32,9);
      c.drawImage(sprite,sx,sy,32,32,dx+p.lean,dy-p.lift,32,32);
    }else c.drawImage(sprite,sx,sy,32,40,dx,dy,32,40);
  }
  window.V31Character={buildFaceAtlas,idleLift,pose,drawPose};
})();
