/* Reference inspection only: never loads the game, saves or combat simulation. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),images=new Map();
 let data,current,hero,playing=true,index=0,clock=0,last=0;
 const state=()=>current.states[$('state').value];
 function reset(){index=0;clock=0;$('frame').value='0'}
 function detail(label,value){const term=document.createElement('dt'),definition=document.createElement('dd');term.textContent=label;definition.textContent=value;$('details').append(term,definition)}
 function updateDetails(){
  $('details').replaceChildren();const st=state(),ref=data.references[current.reference];
  if(current.level)detail('Level',String(current.level));detail('Source',current.reference+' · '+ref.originalFilename);detail('Frames',String(st.frames.length));detail('Playback',st.loop?'Reference loop':'One-shot; hold final pose');detail('Pixels','Unmodified source crop');
  $('missing').textContent='Not supplied: '+current.missing.join('; ')+'.';
  $('sizeLabel').textContent=(current.draftFitHeight*Number($('size').value)).toFixed(1)+' proposed world pixels high';
  $('durationLabel').textContent=$('duration').value+' ms per frame — preview only';
  $('frame').max=String(st.frames.length-1);
 }
 function selectCreature(){
  current=data.creatures.find(c=>c.id===$('creature').value);$('state').replaceChildren();
  for(const key of Object.keys(current.states)){const option=document.createElement('option');option.value=key;option.textContent=key.replaceAll('-',' ');$('state').append(option)}
  $('size').value='1';reset();updateDetails();
 }
 function selectCategory(){
  $('creature').replaceChildren();for(const c of data.creatures.filter(c=>c.category===$('category').value)){const option=document.createElement('option');option.value=c.id;option.textContent=c.name;$('creature').append(option)}selectCreature();
 }
 function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Cannot load '+url));image.src=url})}
 function draw(now){
  requestAnimationFrame(draw);if(!current)return;
  const dt=last?Math.min(250,now-last):0;last=now;const st=state(),duration=Number($('duration').value);
  if(playing){clock+=dt;while(clock>=duration){clock-=duration;if(index<st.frames.length-1)index++;else if(st.loop)index=0;else{clock=0;break}}}
  $('frame').value=String(index);$('frameLabel').textContent=(index+1)+' / '+st.frames.length;
  ctx.fillStyle='#10211d';ctx.fillRect(0,0,960,432);ctx.fillStyle='#172c25';ctx.fillRect(0,352,960,80);
  ctx.strokeStyle='#49614c';ctx.beginPath();ctx.moveTo(40,352.5);ctx.lineTo(920,352.5);ctx.stroke();ctx.font='16px system-ui';ctx.fillStyle='#bac6b0';ctx.textAlign='center';ctx.fillText('Current game player',250,395);ctx.fillText(current.name,650,395);
  if(!hero&&window.MyrrenWardrobe?.ready&&window.MyrrenHero)hero=window.MyrrenHero.create(window.MyrrenWardrobe.base,{rawFrames:true});
  const moving=['move','walk','flee','takeoff','burrow','glide','swim'].includes($('state').value);
  if(hero){const mat=Number($('armour').value);ctx.save();ctx.translate(250,352);ctx.scale(3,3);hero.draw(ctx,0,0,{dv:'s',f:1,g:[mat,mat,mat,mat,0,mat],moving,nativeScale:false},now);ctx.restore()}
  else{ctx.fillStyle='#bac6b0';ctx.fillText('Loading current player…',250,280)}
  const f=st.frames[index],image=images.get(current.reference),scale=3*Number($('size').value)*current.draftFitHeight/current.fitSourceHeight;
  window.MyrrenCraterAnimation.drawFrame(ctx,image,f,650,352,scale,$('mirror').checked);
  ctx.strokeStyle='#79d4cf';ctx.beginPath();ctx.moveTo(644,352);ctx.lineTo(656,352);ctx.moveTo(650,346);ctx.lineTo(650,358);ctx.stroke();
  ctx.fillStyle='#d8c58e';ctx.textAlign='left';ctx.font='14px system-ui';ctx.fillText(current.reference+' · '+$('state').value+' · '+(st.loop?'loop':'one-shot'),24,30);
  if($('mirror').checked)ctx.fillText('Mirrored source study — no new directional artwork',24,54);
 }
 async function init(){
  try{const response=await fetch('/crater-reference-frames.json?v=3');if(!response.ok)throw Error('Cannot load reference metadata');data=await response.json();await Promise.all(Object.entries(data.references).map(async([ref,r])=>images.set(ref,await loadImage('/'+r.file+'?v='+data.version))));
   selectCategory();$('category').addEventListener('change',selectCategory);$('creature').addEventListener('change',selectCreature);$('state').addEventListener('change',()=>{reset();updateDetails()});
   $('frame').addEventListener('input',()=>{playing=false;index=Number($('frame').value);$('play').textContent='Play'});
   $('play').addEventListener('click',()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play'});$('replay').addEventListener('click',()=>{reset();playing=true;$('play').textContent='Pause'});
   for(const id of ['size','duration'])$(id).addEventListener('input',updateDetails);
   $('status').textContent=data.creatures.length+' creatures · '+data.creatures.reduce((n,c)=>n+Object.values(c.states).reduce((s,a)=>s+a.frames.length,0),0)+' source crops · fitting study only; no gameplay or saves loaded.';
   requestAnimationFrame(draw);
  }catch(error){$('error').textContent=error.message;$('status').textContent='Preview could not finish loading.'}
 }
 init();
})();
