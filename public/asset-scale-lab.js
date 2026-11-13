/* Isolated actual-assets world-scale lab. No game runtime, no save/load writes. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const W=340,H=260,PANEL_ZOOM=2;
 const canvas=$('comparison'),ctx=canvas.getContext('2d');
 let spec=null,now=1000;
 const assets=new Map();
 const loaded={};const summary=$('status');
 const drawImage=(ctx,image,x,y,w)=>{
  if(!image||!image.complete||!image.naturalWidth)return false;
  const h=Math.round(image.naturalHeight*w/image.naturalWidth);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,Math.round(x-w/2),Math.round(y-h+4),Math.round(w),h);
  return true;
 };
 function ensureAsset(kind){
  if(assets.has(kind))return assets.get(kind);
  const image=new Image();
  image.onload=()=>{loaded[kind]='ready';render()};
  image.onerror=()=>{loaded[kind]='missing';render()};
  image.src='/assets/resources/'+kind+'.png';
  assets.set(kind,image);return image;
 }
 function label(c,message,x,y){
  c.fillStyle='#e8e3cd';c.font='600 7px system-ui,sans-serif';
  c.textAlign='left';c.fillText(message,x,y);
 }
 function ground(c,mode){
  c.fillStyle='#425a46';c.fillRect(0,0,W,H);
  for(let ty=0;ty<H;ty+=16)for(let tx=0;tx<W;tx+=16){
   const hash=((tx*19+ty*23)>>>4)%7;
   c.fillStyle=hash<3?'#435b46':hash<5?'#465f49':'#405740';
   c.fillRect(tx,ty,16,16);
   if(hash===1){c.fillStyle='#637858';c.fillRect(tx+3,ty+12,2,2);c.fillRect(tx+8,ty+7,1,1);}
  }
  if(mode==='lakeside'){
   c.fillStyle='#29545c';c.fillRect(243,52,97,H-52);
   c.fillStyle='#3d7272';c.fillRect(242,52,3,H-52);
   for(let y=60;y<H;y+=24){c.fillStyle='#7b9b92';c.fillRect(274,y,11,1);c.fillRect(300,y+7,7,1);}
  }
 }
 function path(c,mode,isTarget){
  if(mode==='lakeside')return;
  const width=isTarget?spec.paths.proposedMainVisualWidth:spec.paths.currentTotalWidthApprox;
  c.strokeStyle='#786d55';c.lineWidth=width;
  c.beginPath();c.moveTo(100,236);c.lineTo(180,206);c.lineTo(300,206);c.stroke();
  c.strokeStyle='#9c8b66';c.lineWidth=1;
  c.beginPath();c.moveTo(110,239);c.lineTo(180,206);c.lineTo(300,206);c.stroke();
 }
 function tree(c,name,x,y,isTarget){
  const t=spec.resources.trees;
  const img=ensureAsset('tree_'+name);
  const width=isTarget?Math.round(t.species[name].previewWidth*Number($('treeFactor').value)/100):t.currentDisplay[0];
  drawImage(c,img,x,y,width);
 }
 function ore(c,name,x,y,isTarget){
  const img=ensureAsset('ore_'+name),o=spec.resources.ores;
  const w=isTarget?Math.round(o.previewWidths[name]*Number($('oreFactor').value)/100):o.currentEffectiveDisplayWidth;
  drawImage(c,img,x,y,w);
 }
 function hero(c,x,y) {
  const base=window.MyrrenKezV2Atlas;
  if(!base?.ready)return;
  base.draw(c,x,y,{dv:'d',f:1,moving:false,tool:'fist',
    swingAt:-99999,animateIdle:false},0);
 }
 function building(c,x,y){
  if(!window.MyrrenEnvironment)return;
  // Uses the actual currently deployed MyrrenEnvironment.building renderer.
  window.MyrrenEnvironment.building(c,{id:'axe',w:56,x,y},x,y,0);
 }
 function panel(c,mode,isTarget,scene) {
  c.save();c.translate(mode*W*PANEL_ZOOM,0);c.scale(PANEL_ZOOM,PANEL_ZOOM);
  c.imageSmoothingEnabled=false;
  ground(c,scene);
  path(c,scene,isTarget);
  if(scene==='camp'){
    tree(c,'bramblewood',48,209,isTarget);
    tree(c,'alder',116,193,isTarget);
    tree(c,'elderthorn',15,245,isTarget);
    building(c,274,218);
    hero(c,168,227);
    ore(c,'copper',197,232,isTarget);
    ore(c,'black_iron',229,233,isTarget);
  }else if(scene==='forest'){
    tree(c,'bramblewood',34,201,isTarget);
    tree(c,'alder',102,179,isTarget);
    tree(c,'ironbark',185,176,isTarget);
    tree(c,'elderthorn',258,212,isTarget);
    hero(c,140,239);
    ore(c,'tin',191,244,isTarget);
    ore(c,'myrrenite',215,239,isTarget);
  }else{
    tree(c,'bramblewood',39,164,isTarget);
    tree(c,'alder',110,165,isTarget);
    building(c,72,249);
    hero(c,202,216);
    ore(c,'iron',157,235,isTarget);
    if(window.MyrrenEnvironment){
      window.MyrrenEnvironment.fishing(c,{x:270,y:176,k:'spot1',back:0},270,176,now);
    }
  }
  c.fillStyle='rgba(21,24,25,.85)';c.fillRect(0,0,W,20);
  label(c,isTarget?'PROPOSED RELATIVE SCALE':'CURRENT GAME SCALE',7,13);
  c.restore();
 }
 function render(){
  if(!ctx||!spec)return;
  const scene=$('scene').value;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  panel(ctx,0,false,scene);
  panel(ctx,1,true,scene);
  const ready=Object.values(loaded).filter(x=>x==='ready').length;
  const missing=Object.entries(loaded).filter(([,v])=>v==='missing').map(([n])=>n);
  summary.textContent=ready+' actual game resource images loaded'+
    (missing.length?' · missing: '+missing.join(', '):'')+
    ' · each panel drawn at 2 screen pixels per 1 game pixel. The right panel ONLY previews scale.';
 }
 for(const id of ['scene','treeFactor','oreFactor'])$(id).addEventListener('input',render);
 $('reset').addEventListener('click',()=>{
   $('scene').value='camp';$('treeFactor').value=100;$('oreFactor').value=100;render();
 });
 fetch('/art-scale-targets.json').then(r=>{if(!r.ok)throw Error('Scale specification missing');return r.json()})
 .then(data=>{
    spec=data;
    for(const name of Object.keys(spec.resources.trees.species))ensureAsset('tree_'+name);
    for(const name of Object.keys(spec.resources.ores.originalSourceDimensions))ensureAsset('ore_'+name);
    render();
 }).catch(e=>{summary.textContent=e.message});
 window.addEventListener('myrren-kez-v2-ready',render);
})();
