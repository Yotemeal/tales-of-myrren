/* The R3 gatherer poses follow the preview's simulation-driven rock throw. */
(()=>{'use strict';
 function create(){
  let atlas=null,creature=null;
  async function load(){
   try{
    const response=await fetch('/crater-reference-frames.json?v=2');
    if(!response.ok)return false;
    const metadata=await response.json();
    const miner=metadata.creatures.find(c=>c.id==='goblin_miner');
    const image=await new Promise((resolve,reject)=>{
     const source=new Image();
     source.onload=()=>resolve(source);
     source.onerror=reject;
     source.src='/'+metadata.references[miner.reference].file+'?v='+metadata.version;
    });
    const canvas=document.createElement('canvas');
    canvas.width=image.naturalWidth;
    canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(image,0,0);
    for(const clip of Object.values(miner.states))for(const frame of clip.frames){
     const pixels=ctx.getImageData(frame.x,frame.y,frame.w,frame.h);
     for(let i=0;i<pixels.data.length;i+=4){
      const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
      if(r<=17&&g<=25&&b<=28&&g>=r&&b>=r)pixels.data[i+3]=0;
     }
     ctx.putImageData(pixels,frame.x,frame.y);
    }
    // The release crop also depicts a flying rock. The simulation draws that separately.
    const release=miner.states.attack.frames[2];
    release.w=88;
    release.anchorX=36;
    // Trim the board divider at the right edge of the recovery crop.
    miner.states.attack.frames[3].w-=5;
    atlas=canvas;
    creature=miner;
    return true;
   }catch{return false}
  }
  function draw(ctx,monster,x,y,now,{moving,hitAge,windup}){
   const animation=window.MyrrenCraterAnimation;
   if(!atlas||!animation||monster.t!=='goblin')return false;
   const {states,draftFitHeight,fitSourceHeight}=creature;
   const releaseAge=now-(monster.rockReleasedAt??-Infinity);
   let frame;
   if(monster.state==='dead')frame=animation.frameAt(states.death,now-monster.dieAt,170).frame;
   else if(monster.rockCast)frame=states.attack.frames[now-monster.rockCast.at<windup/2?0:1];
   else if(monster.state==='chase'&&releaseAge>=0&&releaseAge<220)frame=states.attack.frames[releaseAge<110?2:3];
   else if(hitAge>=0&&hitAge<260)frame=states.hit.frames[0];
   else frame=animation.frameAt(moving?states.move:states.idle,now,moving?120:240).frame;
   animation.drawFrame(ctx,atlas,frame,x,y,draftFitHeight/fitSourceHeight,monster.face<0);
   return true;
  }
  return {load,draw,get ready(){return !!atlas}};
 }
 window.MyrrenCraterMiner={create};
})();
