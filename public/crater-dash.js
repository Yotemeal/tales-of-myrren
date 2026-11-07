/* Approved Wild Boar and Dire Wolf poses for the Crater combat preview. */
(()=>{'use strict';
 function create(){
  const ids={boar:'wild_boar',wolf:'dire_wolf'};
  const artwork=new Map();
  async function load(){
   try{
    const response=await fetch('/crater-reference-frames.json?v=2');
    if(!response.ok)return false;
    const metadata=await response.json();
    const results=await Promise.allSettled(Object.entries(ids).map(async ([type,id])=>{
     const creature=metadata.creatures.find(c=>c.id===id);
     const image=await new Promise((resolve,reject)=>{
      const source=new Image();
      source.onload=()=>resolve(source);
      source.onerror=reject;
      source.src='/'+metadata.references[creature.reference].file+'?v='+metadata.version;
     });
     const atlas=document.createElement('canvas');
     atlas.width=image.naturalWidth;
     atlas.height=image.naturalHeight;
     const ctx=atlas.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(image,0,0);
     for(const clip of Object.values(creature.states))for(const frame of clip.frames){
      const pixels=ctx.getImageData(frame.x,frame.y,frame.w,frame.h);
      for(let i=0;i<pixels.data.length;i+=4){
       const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
       if(r<=20&&g<=28&&b<=33&&g>=r&&b>=r)pixels.data[i+3]=0;
      }
      ctx.putImageData(pixels,frame.x,frame.y);
     }
     artwork.set(type,{atlas,creature});
    }));
    return results.some(result=>result.status==='fulfilled');
   }catch{return false}
  }
  function draw(ctx,monster,x,y,now,{moving,hitAge,recover=260}){
   const animation=window.MyrrenCraterAnimation;
   const asset=artwork.get(monster.t);
   if(!asset||!animation)return false;
   const {atlas,creature}=asset;
   const boar=monster.t==='boar';
   const {states,draftFitHeight,fitSourceHeight}=creature;
   const releaseAge=now-monster.lunge;
   let frame;
   if(monster.state==='dead')frame=states.death.frames[0];
   else if(monster.dashAttack&&!monster.dashAttack.released)frame=states.attack.frames[0];
   else if(monster.state==='chase'&&releaseAge>=0&&releaseAge<recover)frame=states.attack.frames[boar||releaseAge<90?1:2];
   else if(hitAge>=0&&hitAge<260)frame=states.hit.frames[0];
   else frame=animation.frameAt(moving?states.move:states.idle,now,moving?130:290).frame;
   animation.drawFrame(ctx,atlas,frame,x,y,draftFitHeight/fitSourceHeight,monster.face<0);
   return true;
  }
  return {load,draw};
 }
 window.MyrrenCraterDash={create};
})();
