'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {decode}=require('../scripts/build-v19f-review.cjs');
const root=path.resolve(__dirname,'..');
const approved=require('../docs/ore-v32-final-manifest.json');
const depleted=require('../docs/ore-v32-depleted-manifest.json');
const bytes=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('all eight approved live ores remain byte-identical while collapsed variants are smaller native rubble',()=>{
 assert.equal(Object.keys(depleted.assets).length,8);
 for(const [name,d] of Object.entries(depleted.assets)){
  const original=bytes(approved.assets[name].path),broken=bytes(d.path);
  assert.equal(hash(original),approved.assets[name].sha256,'untouched full '+name);
  assert.equal(hash(broken),d.sha256,'locked depleted '+name);
  const img=decode(broken),src=decode(original);
  assert.deepEqual([img.width,img.height],[40,28]);
  assert.deepEqual([src.width,src.height],[40,28]);
  const xs=[],ys=[];
  for(let y=0;y<28;y++)for(let x=0;x<40;x++){
   const p=(40*y+x)*4;
   assert([0,255].includes(img.rgba[p+3]),name+' alpha');
   if(img.rgba[p+3]){xs.push(x);ys.push(y);}
  }
  assert(xs.length>70&&xs.length<360,'small, visible fractured '+name);
  assert(Math.min(...ys)>=13,'collapsed ore must stay low to the ground');
  assert(Math.max(...ys)-Math.min(...ys)+1<=15,'collapsed ore cannot reach original full height');
  assert(Math.max(...xs)-Math.min(...xs)+1<=31,'collapsed ore must be narrower');
 }
});
test('ore renderer uses exclusively V3.2 live+depleted sprites, never old procedural rocks',()=>{
 const src=bytes('public/myrren-environment.js').toString(),urls=[];
 class Img {
  constructor(){this.naturalWidth=40;this.naturalHeight=28;}
  set src(v){urls.push(v);this.onload?.();}
 }
 const window={};vm.runInNewContext(src,{window,Image:Img,document:{}},{timeout:1000});
 const ctx={calls:[],drawImage(...a){this.calls.push(a)}};
 const aliases={copper:'copper',tin:'tin',iron:'iron',coal:'coal',cobalt:'black_iron',obsidianite:'chromium',meteorite:'iridium',aether:'myrrenite'};
 for(const [id,name] of Object.entries(aliases)){
  for(const [back,suffix] of [[0,''],[1500,'_depleted']]){
   ctx.calls=[];
   window.MyrrenEnvironment.rock(ctx,{k:id,back,x:100,y:120},100,120,1000);
   assert(urls.includes('/assets/resources/v32/ore_'+name+suffix+'.png'),id+' '+suffix+' source');
   assert.equal(ctx.calls.length,1,id+' '+suffix+' drawn exactly once');
   assert.deepEqual(Array.from(ctx.calls[0].slice(1)),[80,96,40,28],id+' '+suffix+' geometry');
  }
 }
 const rock=src.slice(src.indexOf('  function rock(ctx,'),src.indexOf('  function fern('));
 assert.match(rock,/resourceSprite\(ctx,n,x,y,now,false,stage\)/,'three-state renderer must pass the visual stage');
 assert.doesNotMatch(rock,/sprite\(|poly\(|fillRect\(/,'old procedural rock artwork must not return');
 assert.doesNotMatch(src,/assets\/resources\/v31\/|img\.src=['"]\/assets\/resources\/ore_/);
});
test('depleted ore size comes from PNG not the old fractional renderer and old files are gone',()=>{
 const game=bytes('public/myrren-game.js').toString();
 const start=game.indexOf('function oreVisualStage('),stop=game.indexOf('function parts(',start);
 assert(start>0&&stop>start);
 const code=game.slice(start,stop),scales=[],calls=[];
 const ctx={save(){},translate(){},scale(v){scales.push(v)},restore(){}};
 for(const back of [0,1200]){
  vm.runInNewContext(code+'\n drawRock({k:"iron",back:'+back+'},0,0,1000);',
   {ctx,NT:{iron:{vein:5,skill:'mining'}},MyrrenEnvironment:{rock(_ctx,n){calls.push(n.back)}},R(){}},{timeout:1000});
 }
 assert.deepEqual(scales,[],'no fractional scale for live or depleted ore');
 assert.deepEqual(calls,[0,1200]);
 assert(game.includes('window.MyrrenBuild=98;'))
 const html=bytes('public/index.html').toString();
 assert(html.includes('/myrren-game.js?v=98'));
 assert(html.includes('/myrren-environment.js?v=19'));
 for(const name of ['copper','tin','iron','coal','black_iron','myrrenite','obsidianite','meteorite'])
  assert(!fs.existsSync(path.join(root,'public/assets/resources/ore_'+name+'.png')),'obsolete '+name+' PNG remains');
 assert(!fs.existsSync(path.join(root,'public/assets/resources/v31')),'old v31 directory must be removed');
});
