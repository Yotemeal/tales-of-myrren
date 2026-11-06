const assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
(async()=>{
 const {A,W,H,S}=await require('./wardrobe-harness.cjs')(),hero=H.create(W.base,{rawFrames:true});
 const times=[0,60,110,160,220,280],directions=[['d',1],['s',-1],['s',1],['u',1]];
 for(const [mat,atlas] of Object.entries(A.sources)){
  const pixels=atlas.getContext('2d').getImageData(0,0,384,256).data;
  for(let frame=0;frame<24;frame++){
   const [x,y]=A.sockets[frame][0],i=((Math.floor(frame/6)*64+y)*384+frame%6*64+x)*4;
   assert.equal(pixels[i+3],255,`material ${mat}, frame ${frame}: sword wrist outside the fist`);
  }
 }
 for(const mat of S.order)for(let dir=0;dir<4;dir++)for(const time of times)for(const shield of [0,mat]){
  const [dv,f]=directions[dir],o={dv,f,g:[mat,mat,mat,mat,shield,mat],weaponMat:mat,swingAt:0,nativeScale:true};
  const armed=createCanvas(160,140);
  hero.drawEquipped(armed.getContext('2d'),80,110,o,time);
  const a=armed.getContext('2d').getImageData(0,0,160,140).data;
  // Compare against the otherwise identical shield-equipped render with its blade disabled.
  const saved=S.draw;S.draw=()=>true;
  const without=createCanvas(160,140);hero.drawEquipped(without.getContext('2d'),80,110,o,time);S.draw=saved;
  const n=without.getContext('2d').getImageData(0,0,160,140).data;
  let changed=0;for(let i=0;i<a.length;i+=4)if(a[i+3]&&(a[i]!==n[i]||a[i+1]!==n[i+1]||a[i+2]!==n[i+2]||a[i+3]!==n[i+3]))changed++;
  assert(changed>=8,`material ${mat}, direction ${dir}, time ${time}: blade hidden (${changed} pixels)`);
 }
 console.log('PASS: all 192 wrists sit on opaque fists; blades remain visible in 336 armed poses with and without shields.');
})().catch(e=>{console.error(e);process.exitCode=1});
