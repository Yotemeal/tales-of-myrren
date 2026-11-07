/* Approved-frame playback only; simulation and rewards never run here. */
(()=>{'use strict';
 function frameAt(clip,elapsedMs,frameMs){
  if(!clip?.frames?.length||!Number.isFinite(elapsedMs)||!Number.isFinite(frameMs)||frameMs<=0)throw Error('Invalid animation timeline');
  const n=clip.frames.length,step=Math.floor(Math.max(0,elapsedMs)/frameMs),index=clip.loop?step%n:Math.min(step,n-1);
  return {index,frame:clip.frames[index],finished:!clip.loop&&step>=n};
 }
 function drawFrame(ctx,image,frame,x,y,scale=1,mirror=false){
  if(!frame||![frame.x,frame.y,frame.w,frame.h,frame.anchorX,frame.anchorY,x,y,scale].every(Number.isFinite)||frame.w<=0||frame.h<=0||scale<=0)throw Error('Invalid animation frame');
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x,y);if(mirror)ctx.scale(-1,1);
  ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,-frame.anchorX*scale,-frame.anchorY*scale,frame.w*scale,frame.h*scale);ctx.restore();
 }
 window.MyrrenCraterAnimation={frameAt,drawFrame};
})();
