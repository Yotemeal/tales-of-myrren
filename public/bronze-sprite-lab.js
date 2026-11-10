/* Bronze native-asset lab. No save, item, combat, multiplayer or world code. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),W=21,H=27;
 const directions=[{name:'Front',dv:'d',f:1,row:1},{name:'Back',dv:'u',f:1,row:2},
   {name:'Left',dv:'s',f:-1,row:3},{name:'Right',dv:'s',f:1,row:4}];
 const gear=window.MyrrenNativeGearLayers;
 if(!gear)throw new Error('Native gear layer contract must load before sprite lab');
 const slots=gear.slots;
 const bronze=new Image(),bodySource=new Image();
 let ready=false,bodyReady=false,geometry=[],frame=0,playing=false,lastTick=0;
 const status=$('status');
 function detectGeometry(){
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true});
  geometry=[];
  for(let row=0;row<6;row++){
   geometry[row]=[];
   for(let frame=0;frame<4;frame++){
    x.clearRect(0,0,W,H);
    x.drawImage(bodySource,frame*W,row*H,W,H,0,0,W,H);
    const img=x.getImageData(0,0,W,H).data;
    let left=W,top=H,right=-1,bottom=-1;
    for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++)
      if(img[(iy*W+ix)*4+3]>16){left=Math.min(left,ix);top=Math.min(top,iy);right=Math.max(right,ix);bottom=Math.max(bottom,iy)}
    if(right<0){geometry[row][frame]=null;continue}
    geometry[row][frame]=gear.placement({left,right,top,bottom});
   }
  }
 }
 const load=()=>{
  if(ready&&bodyReady&&window.MyrrenKezV2Atlas?.ready){
   detectGeometry();draw();status.textContent='Bronze transparent atlas and current Kez V2 character loaded. Preview only.';
  }
 };
 bronze.onload=()=>{ready=bronze.naturalWidth===84&&bronze.naturalHeight===972;
   if(!ready)status.textContent='Invalid Bronze atlas dimensions.';load()};
 bronze.onerror=()=>status.textContent='Could not load Bronze PNG.';
 bodySource.onload=()=>{bodyReady=bodySource.naturalWidth===84&&bodySource.naturalHeight===162;
   if(!bodyReady)status.textContent='Unexpected Kez V2 atlas dimensions.';load()};
 bodySource.onerror=()=>status.textContent='Could not load current Kez V2 PNG.';
 bronze.src='/assets/armour/bronze_layers_21x27.png';
 bodySource.src='/assets/kez-v2/kez_v2_atlas.png?v=1';
 window.addEventListener('myrren-kez-v2-ready',load);

 function person(ctx,worldX,worldY,dir,withBronze,now,moving){
  const k=window.MyrrenKezV2Atlas,old=window.MyrrenKezV2Equipment;
  const state={dv:dir.dv,f:dir.f,moving,now,g:Array(6).fill(2),tool:'fist',swingAt:-999999};
  const pose=gear.pose(state,now);
  const fit=geometry[pose.row]?.[pose.frame];
  if(!fit){status.textContent='Missing base character frame geometry: '+pose.direction;return}
  const visible=Object.fromEntries(slots.map(slot=>[slot,$(slot).checked]));
  ctx.save();ctx.translate(Math.round(worldX),Math.round(worldY));
  if(withBronze&&$('mode').value==='procedural'){
   old?.draw(ctx,0,0,state,'under');k.draw(ctx,0,0,state,now);old?.draw(ctx,0,0,state,'over');
  }else if(!withBronze){
   k.draw(ctx,0,0,state,now);
  }else{
   gear.draw(ctx,bronze,{pose,anchor:fit,pass:'under',visible});
   k.draw(ctx,0,0,state,now);
   gear.draw(ctx,bronze,{pose,anchor:fit,pass:'over',visible});
  }
  ctx.restore();
 }
 function paint(canvas,mode){
  const c=canvas.getContext('2d');if(!c)return;
  c.imageSmoothingEnabled=false;
  c.fillStyle='#2b3d36';c.fillRect(0,0,canvas.width,canvas.height);
  const zoom=Number($('zoom').value),moving=$('motion').value==='walk';
  const now=frame*(moving?130:440);
  for(let i=0;i<4;i++){
   const dir=directions[i],x=20+i*216,y=40,footX=x+105,footY=184;
   c.fillStyle='#334b3d';c.fillRect(x,y,210,canvas.height-58);
   c.save();c.translate(footX,footY);c.scale(zoom,zoom);c.imageSmoothingEnabled=false;
   person(c,0,0,dir,mode==='equipped',now,moving);c.restore();
   c.fillStyle='#e9d6ac';c.font='600 13px system-ui';c.textAlign='center';
   c.fillText(dir.name,footX,24);c.fillText(mode==='equipped'?'Bronze armour':'Base character',footX,canvas.height-17);
  }
 }
 function draw(){
  if(!ready||!bodyReady||!window.MyrrenKezV2Atlas?.ready)return;
  frame=Number($('frame').value);
  paint($('equipped'),'equipped');paint($('base'),'bare');
 }
 $('frame').addEventListener('change',()=>{frame=Number($('frame').value);draw()});
 for(const id of ['motion','zoom','mode',...slots])
  $(id).addEventListener('change',draw);
 $('step').addEventListener('click',()=>{
  playing=false;$('play').textContent='Play';
  frame=(frame+1)%4;$('frame').value=frame;draw();
 });
 $('play').addEventListener('click',()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play'});
 function animate(ts){
  if(playing&&ts-lastTick>=($('motion').value==='walk'?135:440)){
   lastTick=ts;frame=(frame+1)%4;$('frame').value=frame;draw();
  }
  requestAnimationFrame(animate);
 }
 requestAnimationFrame(animate);
})();