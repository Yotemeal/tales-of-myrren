'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const publicDir=path.join(__dirname,'../public');
const manifest=require('../public/assets/armour/bronze_layers_21x27.json');

(async()=>{
 const window={location:{search:'?bronze-proof'},dispatchEvent(){}};
 class Image {
  set src(url){
   const png=fs.readFileSync(path.join(publicDir,new URL(url,"http://localhost").pathname));
   assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
   this.naturalWidth=png.readUInt32BE(16);
   this.naturalHeight=png.readUInt32BE(20);
   this.onload();
  }
 }
 vm.runInNewContext(fs.readFileSync(path.join(publicDir,'kez-v2-equipment.js'),'utf8'),{
  window,Image,URL,URLSearchParams,Event,console,
  fetch:async()=>({ok:true,json:async()=>manifest})
 });
 await new Promise(setImmediate);
 const api=window.MyrrenKezV2Equipment;
 assert(api.hasAtlas(2));
 const slots=['helmet','body','legs','boots','shield','gloves'];
 const cells=[],legacy=[];
 const ctx={save(){},restore(){},drawImage(image,...args){cells.push(args)},
  fillRect(...args){legacy.push(args)}};
 for(const [direction,row] of [['front',0],['back',2],['left',3],['right',4]]){
  for(let i=0;i<slots.length;i++){
   const state={g:slots.map((_,j)=>i===j?2:0)};
   const pose={direction,row,frame:3,dx:-11,dy:-24};
   cells.length=0;
   api.draw(ctx,50.3,80.7,state,'under',pose);
   assert.equal(cells.length,slots[i]==='shield'&&row>=3?1:0);
   api.draw(ctx,50.3,80.7,state,'over',pose);
   assert.deepEqual(cells,[[63,(manifest.slotOrder.indexOf(slots[i])*6+row)*27,
     21,27,39,57,21,27]]);
  }
 }
 assert.equal(legacy.length,0,'Bronze PNG replaces legacy drawing for covered slots');
 cells.length=0;
 api.draw(ctx,50,80,{g:[2,3,0,0,0,0]},'over',{direction:'front',row:1,frame:0,dx:-11,dy:-24});
 assert.equal(cells.length,1);
 assert(legacy.length>0,'uncovered tiers retain existing overlays');
 console.log('PASS: Bronze PNG slots, source frames, feet anchor, shield pass and mixed material fallback');
})().catch(error=>{console.error(error);process.exitCode=1});
