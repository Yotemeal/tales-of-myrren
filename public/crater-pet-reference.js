/* Development-only pet artwork adapter. Uses the approved R5 source crops. */
(()=>{'use strict';
 function create(){
  let ready=false,error='',metadata=null,atlas=null;const icons=new Map();
  function makeTransparent(source){
   const canvas=document.createElement('canvas');
   canvas.width=source.naturalWidth||source.width;
   canvas.height=source.naturalHeight||source.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   ctx.drawImage(source,0,0);
   for(const creature of metadata.creatures.filter(c=>c.category==='Pets')){
    for(const [state,clip] of Object.entries(creature.states)){
     for(const frame of clip.frames){
      const pixels=ctx.getImageData(frame.x,frame.y,frame.w,frame.h);
      for(let y=0;y<frame.h;y++){
       const sourceRow=frame.sourceBox[1]+y;
       const divider=(creature.id==='river_otter'&&(state==='walk'||state==='swim')&&sourceRow>=683)
        ||(creature.id==='timber_glider'&&state==='climb'&&frame===clip.frames[0]&&sourceRow===251);
       for(let x=0;x<frame.w;x++){
        const i=(y*frame.w+x)*4;
        const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
        // The R5 board is dark cyan. Retain the warm outlines and blue water effects.
        const matte=r<=24&&g<=34&&b<=36&&g-r>=3&&Math.abs(b-g)<=7;
        if(divider||matte)pixels.data[i+3]=0;
       }
      }
      ctx.putImageData(pixels,frame.x,frame.y);
     }
    }
   }
   return canvas;
  }
  async function load(){
   if(typeof fetch!=='function'||typeof Image!=='function')return false;
   try{const response=await fetch('/crater-reference-frames.json?v=2');if(!response.ok)throw Error('Pet reference metadata unavailable');metadata=await response.json();
    const source=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Pet reference artwork unavailable'));image.src='/'+metadata.references.R5.file+'?v='+metadata.version});
    atlas=makeTransparent(source);
    ready=true;window.dispatchEvent?.(new Event('myrren-pet-reference-ready'));return true;
   }catch(e){error=e.message;return false}
  }
  function pose(p,now){
   const id=window.MyrrenSkillingPets.definitions[p.sk]?.id,c=metadata.creatures.find(c=>c.id===id);if(!c)return null;
   let key=p.previewState||'idle',indices=null,loop=true;
   if(key==='takeoff'){key='glide';indices=[0];loop=false}
   else if(key==='land'){key='glide';indices=[3];loop=false}
   else if(key==='glide'){indices=[1,2]}
   else if(p.sk==='mining'&&key==='idle'){key='surface';indices=[3];loop=false}
   else if(key==='dive'){key='dive-catch';indices=[0,1]}
   else if(key==='catch'){key='dive-catch';indices=[2,3];loop=false}
   else if(key==='water-idle'){key='swim';indices=[0];loop=false}
   if(!c.states[key])key=Object.keys(c.states)[0];const source=c.states[key];
   const clip={frames:indices?indices.map(i=>source.frames[Math.min(i,source.frames.length-1)]):source.frames,loop:indices?loop:source.loop};
   const result=window.MyrrenCraterAnimation.frameAt(clip,Math.max(0,now-(p.stateAt||0)),160);
   return{creature:c,frame:result.frame};
  }
  function draw(ctx,p,x,y,now){
   if(!ready||!window.MyrrenCraterAnimation)return false;const result=pose(p,now);if(!result)return false;
   const scale=result.creature.draftFitHeight/result.creature.fitSourceHeight;
   // Dirt trails are transient ground effects; they never expose a moving mole.
   if(p.sk==='mining')for(const t of p.trail||[]){ctx.save();ctx.globalAlpha=Math.max(0,1-(now-t.t)/1300);ctx.fillStyle='#745139';ctx.fillRect(Math.round(x+t.x-p.x-2),Math.round(y+t.y-p.y-1),4,2);ctx.restore()}
   window.MyrrenCraterAnimation.drawFrame(ctx,atlas,result.frame,Math.round(x),Math.round(y),scale,p.face<0);return true;
  }
  function icon(skill){
   if(!ready)return '';if(icons.has(skill))return icons.get(skill);
   const p={sk:skill,previewState:skill==='mining'?'idle':'idle',stateAt:0},result=pose(p,1000);if(!result)return '';
   const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d'),f=result.frame,scale=Math.min(30/f.w,30/f.h);ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,f.x,f.y,f.w,f.h,(32-f.w*scale)/2,(32-f.h*scale)/2,f.w*scale,f.h*scale);
   const html='<img width="32" height="32" alt="" style="image-rendering:pixelated" src="'+c.toDataURL()+'">';icons.set(skill,html);return html;
  }
  return{load,draw,icon,get ready(){return ready},get error(){return error}};
 }
 window.MyrrenPetReference={create};
})();
