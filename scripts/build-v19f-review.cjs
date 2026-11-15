#!/usr/bin/env node
'use strict';
/**
 * Tales of Myrren — user-approved V19E head style, V19F four-direction review.
 * Outputs candidate PNGs ONLY; never overwrites production assets.
 * Packed 4x(24x17) RGBA head masters preserve exact approved side faces.
 * Source body pixels remain the existing V19B animation, including gait.
 * No third-party dependencies.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {createHash}=require('node:crypto');
const W=24,H=32,HEAD_H=17;
const sha=b=>createHash('sha256').update(b).digest('hex');
const SOURCE={
 walk:'a0d9b80587e5d06584fda7bc97388a4a642f7e2a3031d20461085f8da4b38be7',
 idle:'73127b54a3810fcd4087e733a2cbd3fc82bdfa1da210c0c733b650d24645fcd1',
 master:'bd28aadb6eead9b32172df4e96962cb247b87e760cc0220b490b006bc6b67895'
};
const OUT={
 walk:'d128924818364558e3fd5654cf3d0b34210e6aaaf240344c7d57a417c1125011',
 idle:'ea501d6c3c8e14da151535b158e8c0bbbf790af0d5d212c16ac7fa7ad1a05252',
 master:'71d77ec6fb0eab628331c93cfaf1e0f25fb374381a264a39619ee818b5d2a4b5'
};
const HEADS_SHA='550e582ffc5682a6e1ee87a33e6fe9dd905461e9072535fca7dc4d1b7611f9ac';
const PACKED_HEADS='eNrlWC1LREEU3Z9gEgSToCAY7YpgMCgYxGIRRJtiM9lMRqPJ4m8w+RMMVg0msYp9V87CeRwv987c2ScoKlz27fjm3I+ZOefODgY/+zczPTUqWR/s7Y210criXGe7y0tfDPgHO1ujPrGfba2HxhzeXp5Hk9QDMQOHsVt8ji/Mz47fx2cGX7G8+pTyqcXNmC22xfJ8MQfPj6215yfy4fn5bnz1Ea3DydF+iGXHLTYNe7q21z2Mh4u9FD5it/F7+5yYtI/bi64G+Hy8Ou3+562B+lB8jQWY1rxxbw10jXHGUXv4vNxf/YIxHA7Hxu+Y+3p93I2/39+OvxOb9QGe1gg+4NPGCAyOq2GM+Don4iTiIxbWO4P/dHM+/o45mIvYoz2EnDBP8Wt2d7jZ4WOurcvgF+tLH1ycJdQx0gDlw74xl/Bb8yC/tnByNg9918Pv60ProXqVyaVWK1trL06PP1v00cOp6ZX2Kln9Jb4XYzTGuRE3UGPs3iG/e7noM+ZkcrD6Qu6NehavTpk1xrvkePXBWKN+sdZj0QcwycF4Vh/kZw8/yw+KrzqIcYvfyhXIUTme8VPPtf6TcBDjV2zi6z7mc6av/Yv3l5IGZDghg13r91s1jPriYXv8puuc8cP3vXtQ1I8zlxJ+FLdyQeauF60H8S0nRnwcaUWN36L8SxqgvX8Jn7W3c7M6luFmu7ZenLhbeLpQir+0Zyy+5etMD2H11/YnNGJTe4jf0v9YjddYFR/volZctywn2PqTp6nHik8daumbvXOgOmCtBV/PsWqUxq66hvr8V32xnORx2iT3F+0Va/iwUs9ZqkfEc15fla1XdDfK3mFaftdrsVoeNS3PWsQVk8adxVcfNf2K1qOGrfgRTslH1O/iHEV6Uts33p4lb3m9WqnHsePRb3w2B82rxYe1Ui9nOTny4WFm7ht674p8WFxPm0vnWO+/Oj+K1Yvdct0nVFHIvg==';
const PNG=Buffer.from('89504e470d0a1a0a','hex');
function decode(raw){
 assert(raw.subarray(0,8).equals(PNG),'invalid PNG');
 let pos=8,w=0,h=0,depth=0,ctype=0;const idats=[];
 while(pos+12<=raw.length){
  const n=raw.readUInt32BE(pos),tag=raw.toString('ascii',pos+4,pos+8);
  assert(pos+12+n<=raw.length,'PNG chunk truncated');
  const bytes=raw.subarray(pos+8,pos+8+n);
  if(tag==='IHDR'){w=bytes.readUInt32BE(0);h=bytes.readUInt32BE(4);depth=bytes[8];ctype=bytes[9];assert.equal(bytes[12],0,'no PNG interlace');}
  else if(tag==='IDAT')idats.push(bytes);
  pos+=n+12;if(tag==='IEND')break;
 }
 assert.equal(depth,8);assert.equal(ctype,6,'RGBA required');
 const stride=w*4,uncompressed=zlib.inflateSync(Buffer.concat(idats)),rgba=Buffer.alloc(h*stride);
 assert.equal(uncompressed.length,h*(stride+1));
 const paeth=(a,b,c)=>{const p=a+b-c,d=[Math.abs(p-a),Math.abs(p-b),Math.abs(p-c)];return d[0]<=d[1]&&d[0]<=d[2]?a:d[1]<=d[2]?b:c};
 for(let y=0;y<h;y++)for(let x=0;x<stride;x++){
  const f=uncompressed[y*(stride+1)];assert(f>=0&&f<=4,'PNG filter');
  const left=x>=4?rgba[y*stride+x-4]:0;
  const up=y>0?rgba[(y-1)*stride+x]:0;
  const diag=x>=4&&y>0?rgba[(y-1)*stride+x-4]:0;
  const correction=f===0?0:f===1?left:f===2?up:f===3?Math.floor((left+up)/2):paeth(left,up,diag);
  rgba[y*stride+x]=(uncompressed[y*(stride+1)+1+x]+correction)&255;
 }
 return {width:w,height:h,rgba};
}
const CRC_TABLE=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(name,contents){const tag=Buffer.from(name),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(contents.length);sum.writeUInt32BE(crc(Buffer.concat([tag,contents])));return Buffer.concat([n,tag,contents,sum]);}
function encode(im){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(im.width,0);ihdr.writeUInt32BE(im.height,4);ihdr[8]=8;ihdr[9]=6;
 const stride=im.width*4,scan=Buffer.alloc(im.height*(stride+1));
 for(let y=0;y<im.height;y++)im.rgba.copy(scan,y*(stride+1)+1,y*stride,(y+1)*stride);
 return Buffer.concat([PNG,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function build(assetDir,outDir){
 const filenames={walk:'myrren_walk_4x6_native.png',idle:'myrren_idle_4dir_native.png',master:'myrren_front_game_ready_24x32.png'};
 const originals={};
 for(const [key,name] of Object.entries(filenames)){
  const raw=fs.readFileSync(path.join(assetDir,name));
  assert.equal(sha(raw),SOURCE[key],`original ${key} asset changed`);
  originals[key]=decode(raw);
 }
 const heads=zlib.inflateSync(Buffer.from(PACKED_HEADS,'base64'));
 assert.equal(heads.length,4*W*HEAD_H*4);assert.equal(sha(heads),HEADS_SHA,'head source corrupt');
 const result={};for(const [key,value] of Object.entries(originals))result[key]={...value,rgba:Buffer.from(value.rgba)};
 for(let row=0;row<4;row++)for(let y=0;y<HEAD_H;y++){
  const data=heads.subarray(((row*HEAD_H+y)*W)*4,((row*HEAD_H+y+1)*W)*4);
  // Full head rows are identical in idle and each walking frame. Crucially,
  // every other pixel, including legs, arms and foot anchors, stays intact.
  data.copy(result.idle.rgba,(y*result.idle.width+row*W)*4);
  for(let frame=0;frame<6;frame++)data.copy(result.walk.rgba,((row*H+y)*result.walk.width+frame*W)*4);
  if(row===0)data.copy(result.master.rgba,y*W*4);
 }
 const untouched=Object.fromEntries(Object.entries(result).map(([key,im])=>[key,{...im,rgba:Buffer.from(im.rgba)}]));
 // Native 1x review cleanup. Restrict changes to non-standard grey edge colours
 // and one obvious white pixel at (17,3) outside the front hairline.
 const grayEdges=new Set(['81,73,66,255','100,85,78,255','38,37,28,255']);
 const outline=[25,22,16,255],clear=[0,0,0,0],edits={walk:0,idle:0,master:0};
 for(const [key,im] of Object.entries(result)){
  const rows=im.height/H,cols=im.width/W;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)
   for(let y=0;y<HEAD_H;y++)for(let x=0;x<W;x++){
    const xx=col*W+x,yy=row*H+y,off=(yy*im.width+xx)*4;
    const current=Array.from(im.rgba.subarray(off,off+4));
    const front=(key==='walk'?row===0:key==='idle'?col===0:true);
    let after=null;
    if(front&&x===17&&y===3){
      assert.deepEqual(current,[232,224,220,255],'front white stray changed unexpectedly');
      after=clear;
    }else if(grayEdges.has(current.join(',')))after=outline;
    if(after){for(let n=0;n<4;n++)im.rgba[off+n]=after[n];edits[key]++;}
   }
 }
 assert.deepEqual(edits,{walk:246,idle:41,master:21},'unexpected hairline pixel scope');
 for(const [key,im] of Object.entries(result))assert.equal(sha(im.rgba),OUT[key],`V19F ${key} raw RGBA mismatch`);
 const targets={walk:'myrren_walk_4x6_V19F_CANDIDATE.png',idle:'myrren_idle_4dir_V19F_CANDIDATE.png',master:'myrren_front_master_V19F_CANDIDATE.png'};
 fs.mkdirSync(outDir,{recursive:true});
 const paths={};for(const [key,name] of Object.entries(targets)){paths[key]=path.join(outDir,name);fs.writeFileSync(paths[key],encode(result[key]));}
 return {originals,untouched,...result,paths};
}
if(require.main===module){
 const root=path.resolve(__dirname,'../public/assets/myrren-v19b');
 const out=path.resolve(process.argv[2]||'/tmp/myrren-v19f-review');
 console.log('V19F review candidate generated, live game unchanged:',build(root,out).paths);
}
module.exports={build,decode,HEAD_H,W,H,SOURCE,OUT,HEADS_SHA};