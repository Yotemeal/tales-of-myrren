'use strict';
/** Exact RGBA pixel locks for accepted V19B; Node built-ins only. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {createHash}=require('node:crypto');
const expected=require('./fixtures/myrren-v19b-native-rgba-sha256.json');
const sha=b=>createHash('sha256').update(b).digest('hex');

function decode(file){
  const buf=fs.readFileSync(file);
  assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let off=8,width=0,height=0,depth=0,color=0;
  const chunks=[];
  while(off<buf.length){
    assert(off+12<=buf.length);
    const n=buf.readUInt32BE(off),tag=buf.toString('ascii',off+4,off+8);
    const part=buf.subarray(off+8,off+8+n);
    if(tag==='IHDR'){width=part.readUInt32BE(0);height=part.readUInt32BE(4);depth=part[8];color=part[9];assert.equal(part[12],0,'noninterlaced');}
    else if(tag==='IDAT')chunks.push(part);
    off+=12+n;
    if(tag==='IEND')break;
  }
  assert.equal(depth,8);assert.equal(color,6,'RGBA PNG expected');
  const pixels=Buffer.alloc(width*height*4);
  const raw=zlib.inflateSync(Buffer.concat(chunks));
  const stride=width*4;
  assert.equal(raw.length,height*(stride+1));
  const paeth=(a,b,c)=>{
    const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
    return da<=db&&da<=dc?a:db<=dc?b:c;
  };
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];
    assert(filter>=0&&filter<=4);
    for(let x=0;x<stride;x++){
      const value=raw[y*(stride+1)+1+x];
      const left=x>=4?pixels[y*stride+x-4]:0;
      const above=y>0?pixels[(y-1)*stride+x]:0;
      const diagonal=y>0&&x>=4?pixels[(y-1)*stride+x-4]:0;
      const correction=filter===0?0:filter===1?left:filter===2?above:filter===3?Math.floor((left+above)/2):paeth(left,above,diagonal);
      pixels[y*stride+x]=(value+correction)&255;
    }
  }
  return {width,height,pixels};
}
function frame(im,row,col){
  const out=Buffer.alloc(24*32*4);
  for(let y=0;y<32;y++){
    const off=((row*32+y)*im.width+col*24)*4;
    im.pixels.copy(out,y*96,off,off+96);
  }
  return out;
}
function components8(raw){
  const marked=new Uint8Array(24*32),queue=[];
  let components=0;
  const solid=i=>raw[4*i+3]===255;
  for(let i=0;i<768;i++){
    if(marked[i]||!solid(i))continue;
    components++;marked[i]=1;queue.push(i);
    while(queue.length){
      const p=queue.pop(),x=p%24,y=Math.floor(p/24);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;
        if(xx<0||xx>=24||yy<0||yy>=32)continue;
        const j=yy*24+xx;
        if(!marked[j]&&solid(j)){marked[j]=1;queue.push(j);}
      }
    }
  }
  return components;
}
const im=decode(path.resolve(__dirname,'../public/assets/myrren-v19b/myrren_walk_4x6_native.png'));
const dirs=['front','left','right','back'];
test('V19B exact per-frame raw pixel hashes (including V5 sides)',()=>{
  assert.equal(im.width,144);assert.equal(im.height,128);assert.equal(Object.keys(expected).length,24);
  for(let r=0;r<4;r++)for(let c=0;c<6;c++){
    const name=dirs[r]+'_'+c;
    assert.equal(sha(frame(im,r,c)),expected[name],name+' differs from accepted native sprite');
  }
});
test('All 24 frames are crisp and have one connected silhouette',()=>{
  for(let r=0;r<4;r++)for(let c=0;c<6;c++){
    const pixels=frame(im,r,c);
    for(let i=3;i<pixels.length;i+=4)assert(pixels[i]===0||pixels[i]===255,'no interpolated alpha');
    assert.equal(components8(pixels),1,'no disconnected hand/boot islands');
  }
});
test('Front/back head and cloak remain static during steps',()=>{
  for(const r of [0,3]){
    const fixed=frame(im,r,0).subarray(0,23*96);
    for(let c=1;c<6;c++)assert.deepEqual(frame(im,r,c).subarray(0,23*96),fixed);
  }
});
