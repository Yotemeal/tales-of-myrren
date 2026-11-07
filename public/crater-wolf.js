/* The approved R6 forest variant, fitted to the existing Dire Wolf encounter. */
(()=>{'use strict';
 function create(){
  let atlas=null,creature=null;
  async function load(){
   try{
    const response=await fetch('/crater-reference-frames.json?v=2');
    if(!response.ok)return false;
    const metadata=await response.json();
    const wolf=metadata.creatures.find(c=>c.id==='dire_wolf');
    const image=await new Promise((resolve,reject)=>{
     const source=new Image();
     source.onload=()=>resolve(source);
     source.onerror=reject;
     source.src='/'+metadata.references[wolf.reference].file+'?v='+metadata.version;
    });
    const canvas=document.createElement('canvas');
    canvas.width=image.naturalWidth;
    canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0);
    for(const clip of Object.values(wolf.states))for(const frame of clip.frames){
     const pixels=ctx.getImageData(frame.x,frame.y,frame.w,frame.h);
     for(let i=0;i<pixels.data.length;i+=4){
      const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
      if(r<=20&&g<=28&&b<=33&&g>=r&&b>=r)pixels.data[i+3]=0;
     }
     ctx.putImageData(pixels,frame.x,frame.y);
    }
    atlas=canvas;
    creature=wolf;
    return true;
   }catch{return false}
  }
  function draw(ctx,monster,x,y,now,{moving,hitAge}){
   const animation=window.MyrrenCraterAnimation;
   if(!atlas||!animation||monster.t!=='wolf')return false;
   const {states,draftFitHeight,fitSourceHeight}=creature;
   const releaseAge=now-monster.lunge;
   let frame;
   if(monster.state==='dead')frame=states.death.frames[0];
   else if(monster.wolfAttack&&!monster.wolfAttack.released)frame=states.attack.frames[0];
   else if(monster.state==='chase'&&releaseAge>=0&&releaseAge<260)frame=states.attack.frames[releaseAge<90?1:2];
   else if(hitAge>=0&&hitAge<260)frame=states.hit.frames[0];
   else frame=animation.frameAt(moving?states.move:states.idle,now,moving?130:290).frame;
   animation.drawFrame(ctx,atlas,frame,x,y,draftFitHeight/fitSourceHeight,monster.face<0);
   return true;
  }
  return {load,draw};
 }
 window.MyrrenCraterWolf={create};
})();
