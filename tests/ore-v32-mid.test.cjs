'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {decode}=require('../scripts/build-v19f-review.cjs');
const root=path.resolve(__dirname,'..');
const m=require('../docs/ore-v33-three-stage-manifest.json');
const full=require('../docs/ore-v32-final-manifest.json');
const broken=require('../docs/ore-v32-depleted-manifest.json');
const bytes=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const mapping={copper:['copper',6],tin:['tin',6],iron:['iron',5],coal:['coal',5],cobalt:['black_iron',4],obsidianite:['chromium',3],meteorite:['iridium',2],aether:['myrrenite',3]};
test('all eight middle PNGs are exact native 40x28 alpha pixels; approved full+depleted art remains locked',()=>{
 assert.equal(Object.keys(m.assets).length,8);
 for(const [id,[name]] of Object.entries(mapping)){
  const mid=bytes(m.assets[name].path),fullImg=bytes(full.assets[name].path),brokenImg=bytes(broken.assets[name].path);
  assert.equal(hash(mid),m.assets[name].sha256,name+' middle image SHA');
  assert.equal(hash(fullImg),m.full_sha256[name],name+' full image must remain unchanged');
  assert.equal(hash(brokenImg),m.depleted_sha256[name],name+' depleted image must remain unchanged');
  const img=decode(mid),before=decode(fullImg);
  assert.deepEqual([img.width,img.height],[40,28]);
  const count=img.rgba.filter((v,i)=>i%4===3&&v===255).length;
  const oldCount=before.rgba.filter((v,i)=>i%4===3&&v===255).length;
  assert(count>150&&count<oldCount*.84,name+' should be a visibly smaller middle formation');
  const ys=[];
  for(let y=0;y<28;y++)for(let x=0;x<40;x++){
   const alpha=img.rgba[(y*40+x)*4+3];

   if(alpha===255)ys.push(y);
  }
  const fullCrest=before.rgba.findIndex((value,i)=>i%4===3&&value===255);
  assert(Math.min(...ys)>Math.floor(fullCrest/(40*4)),name+' middle crest must be lower than full');
 }
 assert.equal(hash(bytes('public/assets/myrren-v19f/myrren_front_game_ready_24x32.png')),m.hero_sha256);
});
test('existing successful-gather charges switch full to mid to depleted, then full again on respawn',()=>{
 const game=bytes('public/myrren-game.js').toString();
 const a=game.indexOf('function oreVisualStage('),b=game.indexOf('function drawRock(',a);
 assert(a>=0&&b>a);
 const NT=Object.fromEntries(Object.entries(mapping).map(([id,[name,vein]])=>[id,{skill:'mining',vein}]));
 const stage=vm.runInNewContext(game.slice(a,b)+'\noreVisualStage',{NT},{timeout:1000});
 for(const [id,[name,vein]] of Object.entries(mapping)){
  const n={k:id,back:0},half=Math.floor(vein/2);
  assert.equal(stage(n,1000),'full',id+' before first hit');
  n.oreLeft=vein;assert.equal(stage(n,1000),'full',id+' completely full');
  n.oreLeft=half+1;assert.equal(stage(n,1000),'full',id+' above middle threshold');
  n.oreLeft=half;assert.equal(stage(n,1000),'mid',id+' at middle threshold');
  n.oreLeft=1;assert.equal(stage(n,1000),'mid',id+' last available ore');
  n.oreLeft=0;n.back=1200;assert.equal(stage(n,1000),'depleted',id+' cooling down');
  assert.equal(stage(n,1300),'full',id+' regrown with stale zero count');
 }
});
test('game drawRock passes its state to the sprite renderer without scaling or changing mining',()=>{
 const game=bytes('public/myrren-game.js').toString();
 const a=game.indexOf('function oreVisualStage('),b=game.indexOf('function parts(',a);
 assert(a>=0&&b>a);
 const ctx={save(){},translate(){},restore(){},scale(){throw Error('no runtime ore resizing')}};
 const calls=[],env={rock(c,n,x,y,now,stage){calls.push(stage)}};
 for(const [oreLeft,back,result] of [[6,0,'full'],[3,0,'mid'],[0,1600,'depleted'],[0,0,'full']]){
  const n={k:'copper',oreLeft,back},R=()=>{};
  vm.runInNewContext(game.slice(a,b)+'\ndrawRock(n,0,0,1000);',{NT:{copper:{vein:6}},ctx,MyrrenEnvironment:env,n,R},{timeout:1000});
  assert.equal(calls.pop(),result);
 }
 assert(game.includes("const veinExhausted=nt.skill==='mining'&&consumeOreVein(n,nt,now)"),'mining yield remains intact');
});
test('environment paints the three correct sprite URLs with the same anchor and no retired fallback',()=>{
 const source=bytes('public/myrren-environment.js').toString(),urls=[];
 class Img{constructor(){this.naturalWidth=40;this.naturalHeight=28}set src(s){urls.push(s);this.onload?.();}}
 const window={};vm.runInNewContext(source,{window,Image:Img,document:{}},{timeout:1000});
 const ctx={calls:[],fillRect(){},drawImage(...a){this.calls.push(a)}};
 for(const [key,[name]] of Object.entries(mapping)){
  for(const [back,stage,suffix] of [[0,'full',''],[0,'mid','_mid'],[1400,'depleted','_depleted']]){
   ctx.calls=[];
   window.MyrrenEnvironment.rock(ctx,{k:key,back},100,120,1000,stage);
   assert(urls.includes('/assets/resources/v32/ore_'+name+suffix+'.png?v=5'),key+' '+stage);
   assert.equal(ctx.calls.length,1,key+' '+stage+' draw');
   assert.deepEqual(Array.from(ctx.calls[0].slice(1)),[80,96,40,28],key+' '+stage+' anchored');
  }
 }
 const rock=source.slice(source.indexOf('  function rock('),source.indexOf('  function fern('));
 assert.doesNotMatch(rock,/sprite\(|poly\(|fillRect\(/,'old procedural rock remains removed');
 const html=bytes('public/index.html').toString();
 assert(html.includes('/myrren-game.js?v=99'));assert(html.includes('/myrren-environment.js?v=26'));
 assert(bytes('public/myrren-game.js').toString().includes('window.MyrrenBuild=99;'));
});
