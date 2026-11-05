const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let canvasLib;try{canvasLib=require('@napi-rs/canvas')}catch{canvasLib=require((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules')+'/@napi-rs/canvas')}
const {createCanvas,loadImage}=canvasLib;
(async()=>{
const sb={document:{createElement:()=>createCanvas(128,320)}};vm.createContext(sb);vm.runInContext(fs.readFileSync('public/v31-feet.js','utf8')+fs.readFileSync('public/v31-equipment.js','utf8')+'\nthis.E=V31Equipment;',sb);
const source=sb.buildV31FeetAtlas(await loadImage('public/hero_32x40_v31.png')),gear=sb.E.make(source),pixels=a=>a.getContext('2d').getImageData(0,0,128,320).data;
const headShapes=new Set(),shieldShapes=new Set();let combinations=0;
for(let h=0;h<=6;h++)for(let s=0;s<=6;s++){
 const a=gear.get(4,4,null,4,h,s),p=pixels(a);assert.equal(a.width,128);assert.equal(a.height,320);combinations++;
 for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++)for(let x=0;x<32;x++)assert.equal(p[(((row*40+39)*128+frame*32+x)*4)+3],0,'transparent foot padding/adjacent frame bleed');
}
for(let t=1;t<=6;t++){
 const h=gear.get(4,4,null,4,t,0),hp=pixels(h),plain=pixels(gear.get(4,4,null,4));
 for(let y=0;y<320;y++)if(y%40>=25)for(let x=0;x<128;x++)for(let k=0;k<4;k++){const i=(y*128+x)*4+k;assert.equal(hp[i],plain[i],'helmet changes approved torso/legs/feet')}
 const head=[];for(let y=0;y<25;y++)for(let x=0;x<32;x++)head.push(hp[(y*128+x)*4+3]);headShapes.add(crypto.createHash('sha256').update(Buffer.from(head)).digest('hex'));
 const shield=pixels(gear.get(0,0,null,0,0,t)),shape=[];for(let y=20;y<39;y++)for(let x=0;x<16;x++)shape.push(shield[(y*128+x)*4+3]);shieldShapes.add(crypto.createHash('sha256').update(Buffer.from(shape)).digest('hex'));
 for(let frame=1;frame<4;frame++)for(let y=0;y<40;y++)for(let x=0;x<32;x++)assert.equal(shield[(y*128+x)*4+3],shield[(y*128+frame*32+x)*4+3],'one shield shape per material; glints may animate, geometry is fixed at rest');
 for(let action=0;action<4;action++){const a=gear.get(t,t,null,t,t,t,action);assert.equal(a.height,320);assert(gear.icon('helm',t).includes('data:image/png;base64,'));assert(gear.icon('shield',t).includes('data:image/png;base64,'));}
 const dye={M:'#b02a2a',H:'#ee7a64',D:'#5a1414'};if(t>=4)assert.notDeepEqual(Buffer.from(pixels(gear.get(t,t,dye,t,t,t))),Buffer.from(pixels(gear.get(t,t,null,t,t,t))),'master dyes still apply');
}
assert.equal(headShapes.size,6,'six unique helmet silhouettes');assert.equal(shieldShapes.size,6,'six unique shield silhouettes');assert.equal(gear.get(0,0,null,0,0,0),source,'unequip restores the exact source');assert.equal(gear.get(-1,99,null,0,-1,99),source);
new Function(fs.readFileSync('public/v31-equipment-preview.js','utf8'));const game=fs.readFileSync('public/index.html','utf8');new Function(game.slice(game.indexOf('<script>')+8,game.lastIndexOf('</script>')));
console.log('PASS: 49 mixed helmet/shield combinations × 32 poses; six fixed shield silhouettes and six helmet silhouettes; preserved torso/legs/feet; combat poses, dyes, native icons and exact unequip restoration.');
})().catch(e=>{console.error(e);process.exitCode=1});
