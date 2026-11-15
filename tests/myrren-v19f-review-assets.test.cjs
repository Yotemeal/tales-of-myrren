'use strict';
/** Tales of Myrren V19F — pixel locks for candidate assets and approved V19E sides. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createHash}=require('node:crypto');
const {build,decode,HEAD_H,W,H,SOURCE,OUT}=require('../scripts/build-v19f-review.cjs');
const root=path.resolve(__dirname,'../public/assets');
const src=path.join(root,'myrren-v19b'),dst=path.join(root,'myrren-v19f');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'myrren-v19f-qa-'));
const constructed=build(src,temp);
const sha=b=>createHash('sha256').update(b).digest('hex');
const dirs=['front','left','right','back'];
const name={walk:'myrren_walk_4x6_native.png',idle:'myrren_idle_4dir_native.png',master:'myrren_front_game_ready_24x32.png'};
const keys=Object.keys(name);
const files=Object.fromEntries(keys.map(k=>[k,decode(fs.readFileSync(path.join(dst,name[k])))]));
const rgba=(im,x,y)=>Array.from(im.rgba.subarray((y*im.width+x)*4,(y*im.width+x)*4+4));
const frame=(im,row,col)=>{
 const b=Buffer.alloc(W*H*4);
 for(let y=0;y<H;y++)im.rgba.copy(b,y*W*4,((row*H+y)*im.width+col*W)*4,((row*H+y)*im.width+col*W+W)*4);
 return b;
};
const hsh=b=>createHash('sha256').update(b).digest('hex');
const V19E_SIDES={
 left:{idle:'4a1673a19f08bdc265893ce84b74b363d1b7fef8866f01dd04bf3a86e60f80f7',walk:['9a87bdcf670469d7d780dd8fc2a47cf6c7867b85c43bf98051097286ef5d43a3','cd7faa093e32d5478c6a36ee69b1f4022c8bbe8f8267b9a0029eb5700b8cfa34','400a890ca5d6b466f020cb14ab0804e144b794866cdc0391c0415d5d3152747a','813d3040537b74e5968b45b2681b9ecc43d23fff20c62aeeee07b495e77c876e','cb763b9f251a76157e4f58fe9440503b89bd54dc2825fa25802f3a30e008b700','3cbc27d6aa0d43cbf12958b2a559e4b7f74e0358e3cbbd96478e73c53ee8d5b1']},
 right:{idle:'e8b8d3425caba988e92e8716d0f499253fe8fcc1797b192a2fccb950249a0fcd',walk:['72c1c1330f6a98a628ea6f30669646950b253df7fe9bb71357089b3ce35c8bfd','4f77ee76bcaa09368c4d7b35495ab35906ddce208a1334581a6e3d986c7a5b26','e95dc235a819d5bd7b698f792c6400993ea6946e94c3967bac39a93cc496ab19','a7d821dce45e12cd5de057866ea15e531b0fab5f727d1127743ef73872c54e86','6e9c0223fb2089dd8ffa9cb65e119843a6613c4181857364fe1b1c8b003b4500','77f42d9f3a6c945533afae8f3b72a7943722924a6d15cdb9b1c18496c7774748']}
};
const SIZE=[[144,128],[96,32],[24,32]];
test('new candidate PNG files exactly reproduce locked source and expected RGBA hashes',()=>{
 keys.forEach((key,i)=>{
  const im=files[key];assert.deepEqual([im.width,im.height],SIZE[i]);
  assert.equal(sha(im.rgba),OUT[key],`incorrect candidate ${key}`);
  assert(im.rgba.equals(constructed[key].rgba),'output differs from reproducible source');
  assert(fs.existsSync(constructed.paths[key]));
 });
});
test('old V19B originals remain immutable, unmodified and available for rollback',()=>{
 for(const [key,fn] of Object.entries(name))assert.equal(sha(fs.readFileSync(path.join(src,fn))),SOURCE[key]);
});
test('all V19E side idle and 12 walk frames preserved byte-for-byte',()=>{
 for(const [n,row] of [['left',1],['right',2]]){
  assert.equal(hsh(frame(files.idle,0,row)),V19E_SIDES[n].idle);
  for(let i=0;i<6;i++)assert.equal(hsh(frame(files.walk,row,i)),V19E_SIDES[n].walk[i]);
 }
});
test('each front and back idle head matches every walking frame',()=>{
 for(const row of [0,3])for(let col=0;col<6;col++)
  for(let y=0;y<HEAD_H;y++)for(let x=0;x<W;x++)
    assert.deepEqual(rgba(files.walk,col*W+x,row*H+y),rgba(files.idle,row*W+x,y));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)
  assert.deepEqual(rgba(files.idle,x,y),rgba(files.master,x,y));
});
test('front-facing pupils and white eyes use the approved V19E 2x3 structure',()=>{
 const groups=[{w:[[8,13],[9,13],[8,14],[8,15]],p:[[9,14],[9,15]]},
               {w:[[14,13],[15,13],[15,14],[15,15]],p:[[14,14],[14,15]]}];
 for(const eye of groups){
  for(const [x,y] of eye.w)assert.deepEqual(rgba(files.idle,x,y),[254,254,254,255]);
  for(const [x,y] of eye.p)assert.deepEqual(rgba(files.idle,x,y),[25,22,16,255]);
 }
});
test('front and back bodies remain from original 24x32 frames below head row 17',()=>{
 const old=constructed.originals;
 for(const row of [0,3]){
  for(let y=HEAD_H;y<H;y++)for(let x=0;x<W;x++){
   assert.deepEqual(rgba(files.idle,row*W+x,y),rgba(old.idle,row*W+x,y));
   for(let col=0;col<6;col++)assert.deepEqual(rgba(files.walk,col*W+x,row*H+y),rgba(old.walk,col*W+x,row*H+y));
  }
 }
});
test('all four directions share hair shade ratios and native binary alpha',()=>{
 const hair=[[120,78,69,255],[87,52,44,255],[63,41,34,255]];
 const counts=[];
 for(let row=0;row<4;row++){
  const c=hair.map(col=>{let v=0;for(let y=0;y<HEAD_H;y++)for(let x=0;x<W;x++)if(rgba(files.idle,row*W+x,y).every((n,i)=>col[i]===n))v++;return v;});
  const total=c.reduce((a,b)=>a+b,0);counts.push(c.map(n=>n/total));
 }
 for(let shade=0;shade<3;shade++){
  const set=counts.map(c=>c[shade]);assert(Math.max(...set)-Math.min(...set)<.009,'hair shading mismatch');
 }
 for(const im of Object.values(files))for(let k=3;k<im.rgba.length;k+=4)assert([0,255].includes(im.rgba[k]));
});
test('all 24 frames retained original feet and animation variation',()=>{
 for(let row=0;row<4;row++){
  const variants=new Set();
  for(let col=0;col<6;col++)variants.add(hsh(frame(files.walk,row,col)));
  assert(variants.size>=4,`${dirs[row]} walk sequence collapsed`);
 }
});