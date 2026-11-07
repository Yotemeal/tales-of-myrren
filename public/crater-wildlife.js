/* Passive wildlife artwork for the isolated Crater preview, using the R4 board. */
(()=>{'use strict';
 const species={bunny:'rabbit',bird:'raven',deer:'forest_deer',fox:'fox',squirrel:'squirrel'};
 function create(){
  let atlas=null;
  const creatures=new Map();
  async function load(){
   try{
    const response=await fetch('/crater-reference-frames.json?v=2');
    if(!response.ok)return false;
    const metadata=await response.json();
    const source=await new Promise((resolve,reject)=>{
     const image=new Image();
     image.onload=()=>resolve(image);
     image.onerror=reject;
     image.src='/'+metadata.references.R4.file+'?v='+metadata.version;
    });
    const canvas=document.createElement('canvas');
    canvas.width=source.naturalWidth;
    canvas.height=source.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(source,0,0);
    for(const creature of metadata.creatures.filter(c=>c.category==='Wildlife')){
     for(const clip of Object.values(creature.states))for(const frame of clip.frames){
      const pixels=ctx.getImageData(frame.x,frame.y,frame.w,frame.h);
      for(let i=0;i<pixels.data.length;i+=4){
       const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
       // Clear the cool R4 board matte while keeping warm silhouettes.
       if(r<=17&&g<=25&&b<=28&&g>=r&&b>=r)pixels.data[i+3]=0;
      }
      ctx.putImageData(pixels,frame.x,frame.y);
     }
     creatures.set(creature.id,creature);
    }
    atlas=canvas;
    return true;
   }catch{return false}
  }
  function draw(ctx,animal,x,y,now){
   const creature=creatures.get(species[animal.t]),animation=window.MyrrenCraterAnimation;
   if(!atlas||!creature||!animation)return false;
   const moving=animal.mode!=='idle',flying=animal.t==='bird'&&(animal.mode==='fly'||animal.z>0);
   const state=animal.t==='bird'?(flying?'takeoff':'idle'):(moving?'flee':'idle');
   const clip=creature.states[state];
   const elapsed=flying?now-(animal.flightAt??now):now;
   // The first two raven poses are takeoff. Repeat only the airborne poses.
   const flight=elapsed>=220&&flying;
   const timeline=flight?{frames:clip.frames.slice(2),loop:true}:clip;
   const {frame}=animation.frameAt(timeline,flight?elapsed-220:elapsed,state==='idle'?300:110);
   animation.drawFrame(ctx,atlas,frame,x,y-(animal.z||0),creature.draftFitHeight/creature.fitSourceHeight,animal.face<0);
   return true;
  }
  return {load,draw};
 }
 window.MyrrenCraterWildlife={create};
})();
