'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=require('../docs/APPROVED_TREES_V1_MANIFEST.json');
const {decode}=require('../scripts/build-v19f-review.cjs');
const names=['pine','birch','oak','willow','maple','ironbark'];
const read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const env=read('public/myrren-environment.js').toString();
const game=read('public/myrren-game.js').toString();

test('24 approved native PNGs remain byte-identical to the source reference and within clean transparent bounds',()=>{
 assert.deepEqual(Object.keys(manifest.assets).sort(),names.slice().sort());
 for(const name of names)for(const variant of ['a','b'])for(const kind of ['tree','stump']){
  const record=manifest.assets[name][variant][kind];
  const bytes=read('public/assets/resources/trees-v1/'+record.path);
  assert.equal(sha(bytes),record.sha256,name+variant+kind+' approval hash');
  const image=decode(bytes);
  assert.deepEqual([image.width,image.height],record.size,name+variant+kind+' native dimensions');
  let nontransparent=0;
  for(let i=3;i<image.rgba.length;i+=4){
   assert(image.rgba[i]===0||image.rgba[i]===255,name+variant+' has no blurred alpha');
   if(image.rgba[i])nontransparent++;
  }
  assert(nontransparent>100,'sprite is visible '+name+variant+kind);
 }
});

test('game environment renders six A/B species and matching stumps at native scale, same foot anchor',()=>{
 const urls=[];
 class Image {
  set src(src){this._src=src;urls.push(src);
   const file=path.join(root,'public',src.split('?')[0]);
   const png=read(path.relative(root,file));
   this.naturalWidth=png.readUInt32BE(16);this.naturalHeight=png.readUInt32BE(20);
   this.onload?.();
  }
  get src(){return this._src}
 }
 const window={};new Function('window','document','Image',env)(window,{createElement(){throw Error('old procedural artwork used')}},Image);
 const renderer=window.MyrrenEnvironment;
 const ctx={images:[],drawImage(...p){this.images.push(p)},fillRect(){throw Error('unexpected tree wind/leaf effect')}};
 const mapping={tree:'pine',birch:'birch',oak:'oak',maple:'maple',elder:'willow',myrren:'ironbark'};
 for(const [k,name] of Object.entries(mapping)){
  let variants=new Set();
  for(let offset=0;offset<60;offset++){
   const n={k,x:200+offset*13,y:230+offset*7,back:0};
   const bounds=renderer.treeBounds(n);
   assert(bounds && bounds.w>50 && bounds.h>70,'correct canopy hit bounds');
   ctx.images=[];renderer.tree(ctx,n,100,110,1000);
   assert.equal(ctx.images.length,1,'draws once as an unscaled PNG');
   const full=ctx.images[0],img=full[0],v=img.src.match(/_([ab])\.png$/)[1];variants.add(v);
   assert(img.src.includes('/tree_'+name+'_'),k+' species identity');
   assert.deepEqual(full.slice(1),[Math.round(100-img.naturalWidth/2),Math.round(110-img.naturalHeight+4)],'tree anchored');
   assert.deepEqual([img.naturalWidth,img.naturalHeight],[bounds.w,bounds.h]);
   n.back=2500;ctx.images=[];renderer.tree(ctx,n,100,110,1000);
   assert.equal(ctx.images.length,1,'stump draws once');
   const broken=ctx.images[0],simg=broken[0];
   assert(simg.src.endsWith('_'+v+'_stump.png'),k+' stump uses the SAME variant');
   assert.deepEqual(broken.slice(1),[Math.round(100-simg.naturalWidth/2),Math.round(110-simg.naturalHeight+4)],'stump root anchor');
   assert(simg.naturalWidth<img.naturalWidth&&simg.naturalHeight<img.naturalHeight);
   ctx.images=[];renderer.tree(ctx,n,100,110,2600);
   assert.equal(ctx.images[0][0].src,img.src,'regrowth restores same full tree');
  }
  assert.deepEqual(Array.from(variants).sort(),['a','b'],k+' both variants occur');
 }
 assert.equal(new Set(urls.filter(u=>u.includes('/trees-v1/'))).size,24,'each approved tree and stump fetched only once');
});

test('world unchanged except 30% starter Pine nodes converted to Birch in place; economy and old saves intact',async()=>{
 const createGame=require('./game-runtime.cjs');
 const {game:g}=await createGame();
 const treeKeys=['tree','birch','oak','maple','elder','myrren'];
 assert.deepEqual(Object.keys(g.NT).filter(k=>treeKeys.includes(k)).sort(),treeKeys.slice().sort());
 const p=g.NT.tree,b=g.NT.birch;
 for(const prop of ['req','xp','item','base','dep','rt'])assert.deepEqual(b[prop],p[prop],'Birch duplicate starter economy '+prop);
 assert.equal(g.NT.elder.item,'elder','legacy Willow timber ID retained');
 assert.equal(g.NT.myrren.item,'myrren','legacy Ironbark timber ID retained');
 assert.equal(g.ITEMS.elder.name,'Willow logs');
 assert.equal(g.ITEMS.myrren.name,'Ironbark logs');
 const starters=g.nodes.filter(n=>n.k==='tree'||n.k==='birch');
 assert.equal(starters.length,90,'no new resources and no rerolled positions');
 const birch=starters.filter(n=>n.k==='birch');
 assert(birch.length>=14&&birch.length<=45,'Birch proportion should be around 30%');
 assert.equal(g.nodes.filter(n=>n.k==='oak').length,26);
 assert.equal(g.nodes.filter(n=>n.k==='maple').length,22);
 assert.equal(g.nodes.filter(n=>n.k==='elder').length,12);
 assert.equal(g.nodes.filter(n=>n.k==='myrren').length,6);
 assert(!game.includes('tree-review'), 'review-only game stage does not leak to production');
 assert(!env.includes('__treeQa'), 'review-only renderer does not leak to production');
 assert(game.includes("const rimKinds=['pine','birch','oak','willow','maple','ironbark'];"));
 assert(game.includes("const showcaseTrees=['pine','birch','oak','willow','maple','ironbark'];"));
 assert(game.includes('/myrren-game.js?v=98')===false,'script URLs stay in HTML, not game');
 const html=read('public/index.html').toString();
 assert(html.includes('/myrren-game.js?v=98')&&html.includes('/myrren-environment.js?v=18'));
 assert(game.includes('window.MyrrenBuild=98;'));
});
