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
  fetch:async url=>({ok:true,json:async()=>url.endsWith('equipment-atlases.json')
   ? ['/bronze.json','/replacement.json','/partial.json']
   : url==='/bronze.json'?manifest:url==='/partial.json'?{...manifest,materialId:5,slotOrder:['helmet'],slotBlockRows:84,collapse:null}:{...manifest,materialId:3,image:manifest.image+'&fixture=1',originX:1,collapse:{...manifest.collapse,originX:11}}})
 });
 await new Promise(setImmediate);
 const api=window.MyrrenKezV2Equipment;
 assert(api.hasAtlas(2));
 assert(api.hasAtlas(3));
 assert(api.hasAtlas(5));
 assert(api.supportsAttack([5,2,0,0,0,0],'sword'));
 assert(!api.supportsAttack([2,5,0,0,0,0],'sword'));
 assert(!api.supportsAttack([2,5,0,0,0,0],'punch'));
 assert(api.supportsCollapse([2,3,0,0,0,0]));
 assert(!api.supportsCollapse([4,0,0,0,0,0]));
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
   assert.deepEqual(cells,[[63,(manifest.slotOrder.indexOf(slots[i])*manifest.slotBlockRows+row)*27,
     21,27,39,57,21,27]]);
  }
 }
 cells.length=0;
 api.draw(ctx,50,80,{g:[0,0,0,0,0,2]},'over',
  {direction:'right',row:4,frame:0,nativePunch:true,punchFrame:2,dx:-11,dy:-24});
 assert.deepEqual(cells,[[42,(5*manifest.slotBlockRows+9)*27,21,27,39,56,21,27]]);
 assert.equal(legacy.length,0,'Bronze PNG replaces legacy drawing for covered slots');
 cells.length=0;
 api.draw(ctx,50,80,{g:[2,3,0,0,0,0]},'over',{direction:'front',row:1,frame:0,dx:-11,dy:-24});
 assert.equal(cells.length,2);
 assert.equal(cells[0][4],38,'replacement manifest supplies its own body origin');
 assert.equal(legacy.length,0);
 api.draw(ctx,50,80,{g:[2,4,0,0,0,0]},'over',{direction:'front',row:1,frame:0,dx:-11,dy:-24});
 assert(legacy.length>0,'uncovered tiers retain existing overlays');
 cells.length=0;
 api.drawCollapse(ctx,50,80,{g:[2,3,0,0,2,0]},{row:4},1,'under');
 assert.deepEqual(cells,[[36,224,36,32,40,64,36,32]]);
 api.drawCollapse(ctx,50,80,{g:[2,3,0,0,2,0]},{row:4},1,'over');
 assert.deepEqual(cells.slice(1),[[36,480,36,32,39,64,36,32],[36,352,36,32,40,64,36,32]]);
 console.log('PASS: Registered replacement and Bronze PNG slots, source frames, feet anchor, shield pass and mixed material fallback');
})().catch(error=>{console.error(error);process.exitCode=1});
