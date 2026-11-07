/* Approved Forest Rat, Wild Boar, Dire Wolf and Forest Troll poses for the Crater combat preview. */
(()=>{'use strict';
 function create(){
  const ids={rat:'forest_rat',boar:'wild_boar',wolf:'dire_wolf',troll:'forest_troll'};
  const artwork=new Map();
  async function load(){
   try{
    const response=await fetch('/crater-reference-frames.json?v=3');
    if(!response.ok)return false;
    const metadata=await response.json();
    const atlases=new Map();
    function loadAtlas(ref){
     if(!atlases.has(ref))atlases.set(ref,new Promise((resolve,reject)=>{
      const source=new Image();
      source.onload=()=>{
       try{
        const canvas=document.createElement('canvas');
        canvas.width=source.naturalWidth;
        canvas.height=source.naturalHeight;
        canvas.getContext('2d',{willReadFrequently:true}).drawImage(source,0,0);
        resolve(canvas);
       }catch(error){reject(error)}
      };
      source.onerror=reject;
      source.src='/'+metadata.references[ref].file+'?v='+metadata.version;
     }));
     return atlases.get(ref);
    }
    const results=await Promise.allSettled(Object.entries(ids).map(async ([type,id])=>{
     const creature=metadata.creatures.find(c=>c.id===id);
     const atlas=await loadAtlas(creature.reference);
     const ctx=atlas.getContext('2d',{willReadFrequently:true});
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
   const wolf=monster.t==='wolf';
   const {states,draftFitHeight,fitSourceHeight}=creature;
   const releaseAge=now-monster.lunge;
   let frame;
   if(monster.state==='dead')frame=states.death.frames[0];
   else if(monster.dashAttack&&!monster.dashAttack.released)frame=states.attack.frames[0];
   else if(monster.state==='chase'&&releaseAge>=0&&releaseAge<recover)frame=states.attack.frames[wolf&&releaseAge>=90?2:1];
   else if(hitAge>=0&&hitAge<260)frame=states.hit.frames[0];
   else frame=animation.frameAt(moving?states.move:states.idle,now,moving?130:290).frame;
   animation.drawFrame(ctx,atlas,frame,x,y,draftFitHeight/fitSourceHeight,monster.face<0);
   return true;
  }
  return {load,draw};
 }
 window.MyrrenCraterDash={create};
})();
