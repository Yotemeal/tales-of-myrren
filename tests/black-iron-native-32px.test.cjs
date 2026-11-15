'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const asset=path.join(root,'public/assets/resources/ore_black_iron.png');
const envSource=fs.readFileSync(path.join(root,'public/myrren-environment.js'),'utf8');
const gameSource=fs.readFileSync(path.join(root,'public/myrren-game.js'),'utf8');
test('Black Iron source is a locked 32x24 native RGBA PNG',()=>{
 const png=fs.readFileSync(asset);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.toString('ascii',12,16),'IHDR');
 assert.equal(png.readUInt32BE(16),32);
 assert.equal(png.readUInt32BE(20),24);
 assert.equal(png[24],8);
 assert.equal(png[25],6);
 assert.equal(crypto.createHash('sha256').update(png).digest('hex'),'233134aad27d1da028455959ebd0777f88210852098ee08f6abbfcb95e6f72f8');
});
test('resource renderer uses 32x24 native Black Iron; other ore sizes are unchanged',()=>{
 const calls=[];
 class ImageStub {
   constructor(){this.naturalWidth=0;this.naturalHeight=0}
   set src(value){
     if(value.endsWith('ore_black_iron.png')){this.naturalWidth=32;this.naturalHeight=24}
     if(value.endsWith('ore_iron.png')){this.naturalWidth=167;this.naturalHeight=134}
     if(this.onload)this.onload();
   }
 }
 const window={};
 vm.runInNewContext(envSource,{window,Image:ImageStub,document:{}},{timeout:1000});
 const ctx={drawImage(...a){calls.push(a)}};
 window.MyrrenEnvironment.rock(ctx,{k:'cobalt',back:0,x:12,y:20},100,120,1000);
 assert.equal(calls.length,1);
 // Existing ground anchor preserved: dx=x-w/2, dy=y-h+4
 assert.deepEqual(Array.from(calls[0].slice(1)),[84,100,32,24]);
 calls.length=0;
 window.MyrrenEnvironment.rock(ctx,{k:'iron',back:0,x:12,y:20},100,120,1000);
 assert.deepEqual(Array.from(calls[0].slice(1)),[88,105,24,19]);
});
test('game draws Black Iron at 1x world scale, retaining 0.72 for every other ore',()=>{
 const start=gameSource.indexOf('function drawRock(');
 const end=gameSource.indexOf('function parts(',start);
 assert.ok(start>=0&&end>start);
 const code=gameSource.slice(start,end);
 function run(k){
  const scales=[];
  const ctx={save(){},translate(){},scale(x,y){scales.push([x,y])},restore(){}};
  vm.runInNewContext(code+'\n drawRock({k:'+JSON.stringify(k)+',back:0},0,0,1000);',
   {ctx,MyrrenEnvironment:{rock(){}},R(){}},{timeout:1000});
  return scales;
 }
 assert.deepEqual(run('cobalt'),[[1,1]]);
 assert.deepEqual(run('black_iron'),[[1,1]]);
 assert.deepEqual(run('iron'),[[.72,.72]]);
 assert.deepEqual(run('meteorite'),[[.72,.72]]);
});
test('approved 24x32 hero remains untouched and the fixed camera code is unchanged',()=>{
 const hero=fs.readFileSync(path.join(root,'public/assets/myrren-v19f/myrren_front_game_ready_24x32.png'));
 assert.equal(crypto.createHash('sha256').update(hero).digest('hex'),'748ad641d103dc91228327c91abbc058bf685fad21011f809076ed47028c69a2');
 assert.doesNotMatch(envSource,/cameraScale\s*=/);
});
