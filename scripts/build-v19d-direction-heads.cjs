#!/usr/bin/env node
'use strict';
/**
 * V19D review-only: retain each original left/right face and eye, correct hair tones.
 * Requires only Node built-ins. Does not replace shipped PNGs.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { inflateSync, deflateSync } = require('node:zlib');
const { createHash } = require('node:crypto');
const SIG=Buffer.from('89504e470d0a1a0a','hex');
const SHA=data=>createHash('sha256').update(data).digest('hex');
const SOURCE_HASHES=Object.freeze({
  walk:'a0d9b80587e5d06584fda7bc97388a4a642f7e2a3031d20461085f8da4b38be7',
  idle:'73127b54a3810fcd4087e733a2cbd3fc82bdfa1da210c0c733b650d24645fcd1'
});
const OUTPUT_HASHES=Object.freeze({
  walk:'3f18c6af5d8a1a2c2bdb6f324d28228262de9c305677ed579aef1bb076aaa1ed',
  idle:'1706dcae7c0666c71cb02342b6af43a99806343e35ab860f1f9bbdc03bd7be91'
});
const HEAD_ROWS=17,CELL_W=24,CELL_H=32;
const INPUT={walk:'myrren_walk_4x6_native.png',idle:'myrren_idle_4dir_native.png'};
const OUTPUT={
  walk:'myrren_walk_4x6_direction_preserving_CANDIDATE.png',
  idle:'myrren_idle_4dir_direction_preserving_CANDIDATE.png'
};
const crcTable=Uint32Array.from({length:256},(_,i)=>{
  let c=i;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):c>>>1;return c>>>0;
});
function crc32(data){
  let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
function readPng(bytes){
  assert(bytes.subarray(0,8).equals(SIG),'PNG signature');
  let off=8,width=0,height=0,depth=0,color=0;
  const chunks=[];
  while(off<bytes.length){
    assert(off+12<=bytes.length,'PNG header');
    const n=bytes.readUInt32BE(off),tag=bytes.toString('ascii',off+4,off+8);
    assert(off+12+n<=bytes.length,'PNG length');
    const data=bytes.subarray(off+8,off+8+n);
    if(tag==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      depth=data[8];color=data[9];assert.equal(data[12],0,'noninterlaced');
    }else if(tag==='IDAT')chunks.push(data);
    off+=12+n;if(tag==='IEND')break;
  }
  assert.equal(depth,8);assert.equal(color,6,'RGBA8 only');
  const stride=width*4,raw=inflateSync(Buffer.concat(chunks));
  const rgba=Buffer.alloc(width*height*4);
  assert.equal(raw.length,height*(stride+1));
  const paeth=(a,b,c)=>{
    const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
    return da<=db&&da<=dc?a:db<=dc?b:c;
  };
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];assert(filter>=0&&filter<=4,'PNG filter');
    for(let x=0;x<stride;x++){
      const value=raw[y*(stride+1)+1+x];
      const left=x>=4?rgba[y*stride+x-4]:0;
      const above=y>0?rgba[(y-1)*stride+x]:0;
      const diag=x>=4&&y>0?rgba[(y-1)*stride+x-4]:0;
      const correction=filter===0?0:filter===1?left:filter===2?above:
        filter===3?Math.floor((left+above)/2):paeth(left,above,diag);
      rgba[y*stride+x]=(value+correction)&255;
    }
  }
  return {width,height,rgba};
}
function chunk(tag,data){
  const type=Buffer.from(tag,'ascii'),size=Buffer.alloc(4),crc=Buffer.alloc(4);
  size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
  return Buffer.concat([size,type,data,crc]);
}
function writePng({width,height,rgba}){
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);
  ihdr[8]=8;ihdr[9]=6;
  const stride=width*4,raw=Buffer.alloc(height*(stride+1));
  for(let y=0;y<height;y++)rgba.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);
  return Buffer.concat([SIG,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function pixel(im,x,y){
  const pos=(y*im.width+x)*4;
  return im.rgba.subarray(pos,pos+4);
}
function setPixel(im,x,y,color){
  const pos=(y*im.width+x)*4;
  for(let k=0;k<4;k++)im.rgba[pos+k]=color[k];
}
function generate(assetDir,outDir){
  const oldWalk=fs.readFileSync(path.join(assetDir,INPUT.walk));
  const oldIdle=fs.readFileSync(path.join(assetDir,INPUT.idle));
  assert.equal(SHA(oldWalk),SOURCE_HASHES.walk,'original walking art modified');
  assert.equal(SHA(oldIdle),SOURCE_HASHES.idle,'original idle art modified');
  const sourceWalk=readPng(oldWalk),sourceIdle=readPng(oldIdle);
  assert.deepEqual([sourceWalk.width,sourceWalk.height],[144,128]);
  assert.deepEqual([sourceIdle.width,sourceIdle.height],[96,32]);
  const walk={...sourceWalk,rgba:Buffer.from(sourceWalk.rgba)};
  const idle={...sourceIdle,rgba:Buffer.from(sourceIdle.rgba)};
  // Keep the original left AND right frame-0 eye, face and silhouette.
  // Only original hair RGB pixels may be recoloured in the first 17 rows.
  // Right-facing uses its own hair shade distribution. For the darker left
  // hair, reuse the right side's tonal shade at the corresponding spatial
  // position (hair-to-hair only), never any eye, skin, outline or geometry.
  const hair=[[63,41,34],[87,52,44],[115,69,48],[120,78,69]];
  const isHair=p=>p[3]===255&&hair.some(shade=>shade.every((ch,i)=>ch===p[i]));
  const normalize=p=>p[0]===115&&p[1]===69&&p[2]===48
    ?Buffer.from([120,78,69,255]):Buffer.from(p);
  for(const row of [1,2])for(let y=0;y<HEAD_ROWS;y++)for(let x=0;x<CELL_W;x++){
    const original=Buffer.from(pixel(sourceWalk,x,row*CELL_H+y));
    let chosen=original;
    if(isHair(original)){
      chosen=normalize(original);
      if(row===1){
        const reference=Buffer.from(pixel(sourceWalk,CELL_W-1-x,2*CELL_H+y));
        if(isHair(reference))chosen=normalize(reference);
      }
    }
    setPixel(idle,row*CELL_W+x,y,chosen);
    for(let f=0;f<6;f++)setPixel(walk,f*CELL_W+x,row*CELL_H+y,chosen);
  }
  assert.equal(SHA(walk.rgba),OUTPUT_HASHES.walk,'walk candidate raw pixel lock');
  assert.equal(SHA(idle.rgba),OUTPUT_HASHES.idle,'idle candidate raw pixel lock');
  fs.mkdirSync(outDir,{recursive:true});
  const paths={walk:path.join(outDir,OUTPUT.walk),idle:path.join(outDir,OUTPUT.idle)};
  fs.writeFileSync(paths.walk,writePng(walk));
  fs.writeFileSync(paths.idle,writePng(idle));
  return {paths,walk,idle,sourceWalk,sourceIdle};
}
if(require.main===module){
  const dir=path.resolve(__dirname,'../public/assets/myrren-v19b');
  const out=path.resolve(process.argv[2]||'/tmp/v19d-direction-preserving-review');
  const result=generate(dir,out);
  process.stdout.write('V19D direction-preserving review candidate generated: '+JSON.stringify(result.paths)+'\n');
}
module.exports={generate,readPng,HEAD_ROWS,CELL_W,CELL_H,OUTPUT_HASHES,SOURCE_HASHES};
