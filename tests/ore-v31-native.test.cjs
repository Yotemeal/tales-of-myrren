'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.join(__dirname,'..'),m=require('../docs/ore-v31-integrated-manifest.json');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
test('all eight original V3.1 ore PNGs are dimensionally exact and checksum-locked',()=>{
 assert.equal(Object.keys(m.assets).length,8);
 const hashes=new Set();
 for(const [name,item] of Object.entries(m.assets)){
  const bytes=fs.readFileSync(path.join(root,item.path));
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],name);
  assert.equal(bytes.toString('ascii',12,16),'IHDR');
  assert.equal(bytes.readUInt32BE(16),40,name+' width');
  assert.equal(bytes.readUInt32BE(20),28,name+' height');
  assert.equal(bytes[24],8,name+' bit depth');assert.equal(bytes[25],6,name+' RGBA');
  assert.equal(hash(path.join(root,item.path)),item.sha256,name+' SHA');
  hashes.add(item.sha256);
 }
 assert.equal(hashes.size,8);
 assert.equal(hash(path.join(root,'public/assets/myrren-v19f/myrren_front_game_ready_24x32.png')),m.hero_sha256);
});
test('legacy V3.1 pixel locks and current V3.2 runtime aliases; preserves tree URLs and pixel sizes',()=>{
 const src=fs.readFileSync(path.join(root,'public/myrren-environment.js'),'utf8'),sources=[];
 class Img{
  constructor(){this.naturalWidth=40;this.naturalHeight=28;}
  set src(v){sources.push(v);this.onload?.();}
 }
 const w={};vm.runInNewContext(src,{window:w,Image:Img,document:{}},{timeout:1000});
 const ctx={drawImage(...args){this.calls.push(args)},calls:[]};
 const mapping={copper:'copper',tin:'tin',iron:'iron',coal:'coal',cobalt:'black_iron',obsidianite:'chromium',meteorite:'iridium',aether:'myrrenite'};
 for(const [k,name] of Object.entries(mapping)){
  ctx.calls=[];
  w.MyrrenEnvironment.rock(ctx,{k,back:0,x:100,y:120},100,120,1000);
  assert.ok(sources.includes('/assets/resources/v32/ore_'+name+'.png'),k+' source');
  assert.equal(ctx.calls.length,1,k+' draw calls');
  assert.deepEqual(Array.from(ctx.calls[0].slice(1)),[80,96,40,28],k+' anchor and size');
 }
 assert.match(src,/img.src=isTree\?'\/assets\/resources\/'\+key/);
 assert.match(src,/const w=isTree\?144:40/);
});
test('the running game paints live ores at native 1x and keeps depleted fallback at original scale',()=>{
 const game=fs.readFileSync(path.join(root,'public/myrren-game.js'),'utf8');
 const start=game.indexOf('function drawRock('),stop=game.indexOf('function parts(',start);
 assert.ok(start>0&&stop>start);
 const code=game.slice(start,stop);
 function draw(back){
  const scale=[],ctx={save(){},translate(){},scale(x,y){scale.push([x,y])},restore(){}};
  vm.runInNewContext(code+'\ndrawRock({k:"cobalt",back:'+back+'},0,0,1000);',
    {ctx,MyrrenEnvironment:{rock(){}},R(){}},{timeout:1000});
  return scale;
 }
 assert.deepEqual(draw(0),[[1,1]]);
 assert.deepEqual(draw(1200),[[.72,.72]]);
 const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 assert.ok(html.includes('/myrren-game.js?v=95'));
 assert.ok(html.includes('/myrren-environment.js?v=15'));
 assert.ok(game.includes('window.MyrrenBuild=95;'));
});
