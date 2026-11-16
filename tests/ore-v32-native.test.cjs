'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {decode}=require('../scripts/build-v19f-review.cjs');
const root=path.resolve(__dirname,'..');
const info=require('../docs/ore-v32-final-manifest.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const from=p=>fs.readFileSync(path.join(root,p));
test('all eight V3.2 native PNGs have exact approved checksums and 40x28 RGBA geometry',()=>{
 assert.equal(Object.keys(info.assets).length,8);
 for(const [name,asset] of Object.entries(info.assets)){
  const b=from(asset.path),im=decode(b);
  assert.equal(hash(b),asset.sha256,name+' exact approved bytes');
  assert.deepEqual([im.width,im.height],[40,28],name+' dimensions');
  assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10],name+' PNG header');
  assert.equal(b[24],8);assert.equal(b[25],6);
  for(let p=3;p<im.rgba.length;p+=4)assert([0,255].includes(im.rgba[p]),name+' binary alpha');
 }
 assert.equal(hash(from('public/assets/myrren-v19f/myrren_front_game_ready_24x32.png')),info.hero_sha256);
});
test('seven originals retain their exact pixels; only Iron gets the 37-pixel shadow blend',()=>{
 for(const [name,asset] of Object.entries(info.assets)){
  const previous=from('public/assets/resources/v31/ore_'+name+'.png'),current=from(asset.path);
  if(name!=='iron'){assert(previous.equals(current),name+' must remain byte-identical');continue;}
  const a=decode(previous).rgba,b=decode(current).rgba;
  let changed=0;
  for(let y=0;y<28;y++)for(let x=0;x<40;x++){
   const p=(y*40+x)*4;
   assert.equal(a[p+3],b[p+3],'Iron silhouette/alpha changed at '+x+','+y);
   if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]){
    changed++;
    assert(y>=23&&y<=27&&x>=3&&x<20,'Iron edit exceeded approved lower-left shadow');
   }
  }
  assert.equal(changed,37,'unexpected number of Iron polish pixels');
 }
});
test('renderer maps all stable legacy ore IDs onto final V3.2 assets at 1x world size',()=>{
 const src=from('public/myrren-environment.js').toString('utf8'),seen=[];
 class Img{constructor(){this.naturalWidth=40;this.naturalHeight=28}
  set src(s){seen.push(s);this.onload?.();}}
 const window={};vm.runInNewContext(src,{window,Image:Img,document:{}},{timeout:1000});
 const ctx={drawImage(...args){this.calls.push(args)},calls:[]};
 const keys={copper:'copper',tin:'tin',iron:'iron',coal:'coal',cobalt:'black_iron',obsidianite:'chromium',meteorite:'iridium',aether:'myrrenite'};
 for(const [key,file] of Object.entries(keys)){
  ctx.calls=[];window.MyrrenEnvironment.rock(ctx,{k:key,back:0,x:100,y:120},100,120,1000);
  assert.ok(seen.includes('/assets/resources/v32/ore_'+file+'.png'),key+' mapped source');
  assert.equal(ctx.calls.length,1,key+' draw');
  assert.deepEqual(Array.from(ctx.calls[0].slice(1)),[80,96,40,28],key+' native anchor');
 }
 assert.match(src,/img.src=isTree\?'\/assets\/resources\/'\+key/,'tree asset mapping must remain untouched');
 const html=from('public/index.html').toString();
 assert.ok(html.includes('/myrren-environment.js?v=15'),'environment file is cache-busted');
 assert.ok(html.includes('/myrren-game.js?v=95'),'gameplay build remains unchanged');
 const game=from('public/myrren-game.js').toString();
 assert.ok(game.includes('const GAMEPLAY_SCALE=2;'));
 assert.ok(game.includes('const oreDrawScale=now<n.back?0.72:1;'));
});
