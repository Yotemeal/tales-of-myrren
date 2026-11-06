const assert=require('node:assert/strict'),fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const window={};new Function('window',fs.readFileSync('public/crater-animation.js','utf8'))(window);const A=window.MyrrenCraterAnimation;
(async()=>{
 const metadata=JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'));let clips=0;
 for(const creature of metadata.creatures)for(const clip of Object.values(creature.states)){
  const n=clip.frames.length;assert.equal(A.frameAt(clip,-20,160).index,0);assert.equal(A.frameAt(clip,0,160).index,0);assert.equal(A.frameAt(clip,160*(n-1),160).index,n-1);
  assert.equal(A.frameAt(clip,160*n,160).index,clip.loop?0:n-1);assert.equal(A.frameAt(clip,160*n,160).finished,!clip.loop);clips++;
 }
 assert.throws(()=>A.frameAt({frames:[]},0,160));assert.throws(()=>A.frameAt({frames:[{}]},0,0));assert.throws(()=>A.frameAt({frames:[{}]},Infinity,160));
 for(const [ref,source] of Object.entries(metadata.references)){
  const image=await loadImage('public/'+source.file),creature=metadata.creatures.find(c=>c.reference===ref),f=Object.values(creature.states)[0].frames[0];
  const expected=createCanvas(f.w,f.h),actual=createCanvas(f.w,f.h);expected.getContext('2d').drawImage(image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);A.drawFrame(actual.getContext('2d'),image,f,f.anchorX,f.anchorY,1);
  assert.deepEqual(actual.getContext('2d').getImageData(0,0,f.w,f.h).data,expected.getContext('2d').getImageData(0,0,f.w,f.h).data,'renderer preserves source pixels: '+ref);
 }
 console.log('PASS: '+clips+' supplied animation clips; loops versus held one-shots; explicit timing; pixel-preserving renderer across all six sources.');
})().catch(e=>{console.error(e);process.exitCode=1});
