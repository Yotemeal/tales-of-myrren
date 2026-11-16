'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {decode}=require('../scripts/build-v19f-review.cjs');
const manifest=require('../docs/approved-trees-ab-manifest.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const atlasBytes=fs.readFileSync(manifest.atlas_path);

test('approved atlas preserves all 24 native tree/stump RGBA images byte-for-byte',()=>{
  assert.equal(sha(atlasBytes),manifest.atlas_sha256);
  const img=decode(atlasBytes);
  assert.deepEqual([img.width,img.height],manifest.atlas_size);
  assert.equal(Object.keys(manifest.sprites).length,24);
  for(const [key,{rect,rgba_sha256}] of Object.entries(manifest.sprites)){
    const [x,y,w,h]=rect;
    const pixels=Buffer.alloc(w*h*4);
    for(let yy=0;yy<h;yy++){
      const src=((y+yy)*img.width+x)*4;
      img.rgba.copy(pixels,yy*w*4,src,src+w*4);
    }
    assert.equal(sha(pixels),rgba_sha256,`unchanged native pixels for ${key}`);
    for(let i=3;i<pixels.length;i+=4)assert([0,255].includes(pixels[i]),`${key}: binary transparency`);
  }
});

function renderer(){
  const urls=[];
  class Img{
    constructor(){this.naturalWidth=0;this.naturalHeight=0;}
    set src(v){
      urls.push(v);
      if(v.includes('myrren_trees_ab_600x276.png')){this.naturalWidth=600;this.naturalHeight=276;}
      else{this.naturalWidth=40;this.naturalHeight=28;}
      this.onload?.();
    }
  }
  const window={};
  vm.runInNewContext(fs.readFileSync('public/myrren-environment.js','utf8'),{window,Image:Img,document:{}},{timeout:1000});
  return {env:window.MyrrenEnvironment,urls};
}

test('approved atlas is used by actual environment renderer at native size and stump anchor',()=>{
  const {env,urls}=renderer();
  assert(urls.includes('/assets/resources/v34/myrren_trees_ab_600x276.png?v=1'));
  const names=['pine','birch','oak','willow','maple','ironbark'];
  const ctx={calls:[],drawImage(...args){this.calls.push(args)}};
  for(const species of names)for(const variant of ['a','b']){
    const n={k:'tree',previewTree:species,previewVariant:variant,x:520,y:620,back:0};
    const name='tree_'+species+'_'+variant;
    const full=manifest.sprites[name].rect;
    env.tree(ctx,n,100,120,1000);
    assert.equal(ctx.calls.length,1,`${name} rendered once`);
    const args=ctx.calls.pop();
    assert.deepEqual(Array.from(args.slice(1)),[
      ...full,Math.round(100-full[2]/2),Math.round(120-full[3]+4),full[2],full[3]
    ],`${name} exact source crop and native destination`);
    n.back=5000;
    const stump=manifest.sprites[name+'_stump'].rect;
    env.tree(ctx,n,100,120,1000);
    assert.equal(ctx.calls.length,1,`${name} stump rendered once`);
    const after=ctx.calls.pop();
    assert.deepEqual(Array.from(after.slice(1)),[
      ...stump,Math.round(100-stump[2]/2),Math.round(120-stump[3]+4),stump[2],stump[3]
    ],`${name} stump exact crop and anchored at original trunk base`);
    assert.deepEqual(Object.values(env.approvedTreeSize(n,1000)),[stump[2],stump[3]]);
    n.back=0;
    env.tree(ctx,n,100,120,8000);
    assert.deepEqual(Array.from(ctx.calls.pop().slice(1)),Array.from(args.slice(1)),
      `${name} respawns unchanged with no wind animation`);
  }
});

test('all six species have deterministic A/B appearance with no change to world or economy',async()=>{
  const {env}=renderer();
  assert.equal(env.approvedTreeSpecies({k:'oak',x:100,y:100}),'oak');
  assert.equal(env.approvedTreeSpecies({k:'maple',x:100,y:100}),'maple');
  assert.equal(env.approvedTreeSpecies({k:'elder',x:100,y:100}),'willow');
  assert.equal(env.approvedTreeSpecies({k:'myrren',x:100,y:100}),'ironbark');
  const starters=new Set();let variantB=0;
  for(let x=0;x<200;x++){
    const n={k:'tree',x,y:123};
    starters.add(env.approvedTreeSpecies(n));
    variantB+=env.approvedTreeVariant(n);
    assert.equal(env.approvedTreeVariant(n),env.approvedTreeVariant({...n}));
  }
  assert.deepEqual([...starters].sort(),['birch','pine']);
  assert(variantB>35&&variantB<85,`variant B frequency should be near 30%, got ${variantB}/200`);
  const {game}=await require('./game-runtime.cjs')();
  const originalCounts={tree:90,oak:26,maple:22,elder:12,myrren:6};
  for(const [kind,count] of Object.entries(originalCounts)){
    const ns=game.nodes.filter(n=>n.k===kind);
    assert.equal(ns.length,count,`preserve ${kind} node count`);
    for(const n of ns)assert(env.approvedTreeSize(n)?.height>=88);
  }
  assert.equal(game.NT.tree.item,'logs');
  assert.equal(game.NT.elder.item,'elder');
  assert.equal(game.NT.myrren.item,'myrren');
  assert.equal(game.NT.elder.xp,520);
  assert.equal(game.NT.myrren.xp,1900);
  assert.equal(game.NT.elder.name,'Willow tree');
  assert.equal(game.NT.myrren.name,'Ironbark tree');
  assert.equal(game.ITEMS.elder.name,'Willow logs');
  assert.equal(game.ITEMS.myrren.name,'Ironbark logs');
  const variants=new Set();
  for(const n of game.nodes.filter(n=>['tree','oak','maple','elder','myrren'].includes(n.k))){
    variants.add(env.approvedTreeSpecies(n)+env.approvedTreeVariant(n));
  }
  assert.equal(variants.size,12,'all 12 tree species/variants appear in normal world spawns');
});
