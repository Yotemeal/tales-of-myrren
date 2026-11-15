'use strict';
/** Review-only native side-idle pixel consistency QA; no production replacement. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {createHash}=require('node:crypto');
const dir=path.resolve(__dirname,'../public/assets/myrren-v19b');
const sha=f=>createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex');
function png(name){
  const b=fs.readFileSync(path.join(dir,name));
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let off=8,w=0,h=0,depth=0,type=0;const parts=[];
  while(off<b.length){
    const n=b.readUInt32BE(off),tag=b.toString('ascii',off+4,off+8),d=b.subarray(off+8,off+8+n);
    if(tag==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];assert.equal(d[12],0)}
    if(tag==='IDAT')parts.push(d);
    off+=12+n;if(tag==='IEND')break;
  }
  assert.equal(depth,8);assert.equal(type,6,'RGBA8 PNG');
  const decoded=Buffer.alloc(w*h*4),raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*4;
  assert.equal(raw.length,h*(stride+1));
  const paeth=(a,b,c)=>{const p=a+b-c;const d=[Math.abs(p-a),Math.abs(p-b),Math.abs(p-c)];return d[0]<=d[1]&&d[0]<=d[2]?a:d[1]<=d[2]?b:c};
  for(let y=0;y<h;y++)for(let x=0;x<stride;x++){
    const filter=raw[y*(stride+1)],rawPixel=raw[y*(stride+1)+1+x];
    const left=x>=4?decoded[y*stride+x-4]:0;
    const above=y>0?decoded[(y-1)*stride+x]:0;
    const diag=y>0&&x>=4?decoded[(y-1)*stride+x-4]:0;
    const correction=[0,left,above,Math.floor((left+above)/2),paeth(left,above,diag)][filter];
    assert.notEqual(correction,undefined,'invalid PNG filter');
    decoded[y*stride+x]=(rawPixel+correction)&255;
  }
  return {w,h,data:decoded};
}
const base=png('myrren_idle_4dir_native.png');
const candidate=png('myrren_idle_4dir_consistency_CANDIDATE.png');
const walking=png('myrren_walk_4x6_native.png');
function eqPixel(a,ax,ay,b,bx,by){
  const idx=(image,x,y)=>(y*image.w+x)*4;
  const i=idx(a,ax,ay),j=idx(b,bx,by);
  assert.deepEqual(a.data.subarray(i,i+4),b.data.subarray(j,j+4),`Mismatch at ${ax},${ay}`);
}
test('candidate dimensions and accepted walk/idle bytes remain locked',()=>{
  assert.deepEqual([base.w,base.h],[96,32]);assert.deepEqual([candidate.w,candidate.h],[96,32]);
  assert.deepEqual([walking.w,walking.h],[144,128]);
  assert.equal(sha('myrren_walk_4x6_native.png'),'a0d9b80587e5d06584fda7bc97388a4a642f7e2a3031d20461085f8da4b38be7');
  assert.equal(sha('myrren_idle_4dir_native.png'),'73127b54a3810fcd4087e733a2cbd3fc82bdfa1da210c0c733b650d24645fcd1');
  assert.equal(sha('myrren_idle_4dir_consistency_CANDIDATE.png'),'1b3635e8727ec6d1b834579261be9bc95292a77c0c9258c412d3e6cca2504729');
});
test('side idle hair and eyes match approved moving-side heads pixel-for-pixel',()=>{
  for(const row of [1,2])for(let y=0;y<20;y++)for(let x=0;x<24;x++)
    eqPixel(candidate,row*24+x,y,walking,x,row*32+y);
});
test('front/back idle and the side bodies remain byte-identical',()=>{
  for(const row of [0,3])for(let y=0;y<32;y++)for(let x=0;x<24;x++)
    eqPixel(candidate,row*24+x,y,base,row*24+x,y);
  for(const row of [1,2])for(let y=20;y<32;y++)for(let x=0;x<24;x++)
    eqPixel(candidate,row*24+x,y,base,row*24+x,y);
});
test('binary alpha and contiguous side silhouettes',()=>{
  for(let k=3;k<candidate.data.length;k+=4)assert([0,255].includes(candidate.data[k]));
  for(const row of [1,2]){
    const solid=new Set();
    for(let x=0;x<24;x++)for(let y=0;y<32;y++)
      if(candidate.data[(y*candidate.w+row*24+x)*4+3])solid.add(y*24+x);
    const q=[...solid].slice(0,1),seen=new Set(q);
    while(q.length){const i=q.pop(),x=i%24,y=Math.floor(i/24);
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
        const xx=x+dx,yy=y+dy,j=yy*24+xx;
        if(xx>=0&&xx<24&&yy>=0&&yy<32&&solid.has(j)&&!seen.has(j)){seen.add(j);q.push(j)}
      }
    }
    assert.equal(seen.size,solid.size,'disconnected native side sprite pixels');
  }
});
