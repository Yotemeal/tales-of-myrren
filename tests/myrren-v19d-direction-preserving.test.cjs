'use strict';
/** Native 24×32 side-head review checks. No production sprite replacement. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createHash}=require('node:crypto');
const {generate,readPng,HEAD_ROWS,CELL_W,CELL_H,OUTPUT_HASHES}=require('../scripts/build-v19d-direction-heads.cjs');
const root=path.resolve(__dirname,'../public/assets/myrren-v19b');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'myrren-v19d-'));
const {walk,idle,sourceWalk,sourceIdle,paths}=generate(root,tmp);
const hash=buf=>createHash('sha256').update(buf).digest('hex');
const px=(im,x,y)=>Array.from(im.rgba.subarray((y*im.width+x)*4,(y*im.width+x)*4+4));
function same(a,ax,ay,b,bx,by,w,h){
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)
   assert.deepEqual(px(a,ax+x,ay+y),px(b,bx+x,by+y),'pixel mismatch at '+x+','+y);
}
function connected(im,ox,oy){
 const solid=new Set();
 for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)
   if(px(im,ox+x,oy+y)[3])solid.add(y*CELL_W+x);
 const queue=[solid.values().next().value],seen=new Set(queue);
 while(queue.length){
   const pos=queue.pop(),x=pos%CELL_W,y=Math.floor(pos/CELL_W);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const xx=x+dx,yy=y+dy,j=yy*CELL_W+xx;
     if(xx>=0&&xx<CELL_W&&yy>=0&&yy<CELL_H&&solid.has(j)&&!seen.has(j)){
       seen.add(j);queue.push(j);
     }
   }
 }
 assert.equal(seen.size,solid.size,'disconnected native silhouette');
}
test('reproducible RGBA pixels and lossless real PNG exports',()=>{
 assert.equal(hash(walk.rgba),OUTPUT_HASHES.walk);
 assert.equal(hash(idle.rgba),OUTPUT_HASHES.idle);
 assert.deepEqual([walk.width,walk.height],[144,128]);
 assert.deepEqual([idle.width,idle.height],[96,32]);
 assert(readPng(fs.readFileSync(paths.walk)).rgba.equals(walk.rgba));
 assert(readPng(fs.readFileSync(paths.idle)).rgba.equals(idle.rgba));
});
test('approved front/back stay untouched; V5 side bodies and leg movement unchanged',()=>{
 for(const row of [0,3]){
   same(walk,0,row*CELL_H,sourceWalk,0,row*CELL_H,144,32);
   same(idle,row*24,0,sourceIdle,row*24,0,24,32);
 }
 for(const row of [1,2]){
   same(walk,0,row*32+HEAD_ROWS,sourceWalk,0,row*32+HEAD_ROWS,144,32-HEAD_ROWS);
   same(idle,row*24,HEAD_ROWS,sourceIdle,row*24,HEAD_ROWS,24,32-HEAD_ROWS);
 }
});
const HAIR=[[63,41,34,255],[87,52,44,255],[115,69,48,255],[120,78,69,255]];
const hair=c=>HAIR.some(a=>a.every((v,i)=>v===c[i]));
test('left and right retain their own original skin, eye, pupil, outline and silhouette',()=>{
 for(const row of [1,2])for(let y=0;y<HEAD_ROWS;y++)for(let x=0;x<CELL_W;x++){
   const original=px(sourceWalk,x,row*CELL_H+y),candidate=px(walk,x,row*CELL_H+y);
   if(!hair(original))assert.deepEqual(candidate,original,'changed face or eye pixel');
   assert.equal(candidate[3],original[3],'silhouette changed');
 }
 const whites=(im,row)=>{
   const locations=[];
   for(let y=10;y<17;y++)for(let x=0;x<CELL_W;x++){
     if(px(im,x,row*CELL_H+y).join(',')==='254,254,254,255')locations.push([x,y]);
   }
   return locations;
 };
 for(const row of [1,2]){
   assert.deepEqual(whites(walk,row),whites(sourceWalk,row));
   assert.equal(whites(walk,row).length,3);
 }
 assert.notDeepEqual(whites(walk,1),whites(walk,2),'L and R were not to be mirrored');
});
test('idle and all six walking heads use matching pixels for each side',()=>{
 for(const row of [1,2])for(let f=0;f<6;f++)
   same(walk,f*CELL_W,row*CELL_H,idle,row*CELL_W,0,CELL_W,HEAD_ROWS);
});
test('hair shades are consistent across L/R with no original warm-brown mismatch',()=>{
 for(const row of [1,2])for(let y=0;y<HEAD_ROWS;y++)for(let x=0;x<CELL_W;x++){
   const c=px(walk,x,row*CELL_H+y);
   if(hair(c))assert.notDeepEqual(c,[115,69,48,255]);
 }
});
test('every native frame has binary alpha and one connected silhouette',()=>{
 for(const im of [walk,idle])for(let i=3;i<im.rgba.length;i+=4)
   assert(im.rgba[i]===0||im.rgba[i]===255);
 for(let row=0;row<4;row++)for(let frame=0;frame<6;frame++)
   connected(walk,frame*24,row*32);
 for(let row=0;row<4;row++)connected(idle,row*24,0);
});
