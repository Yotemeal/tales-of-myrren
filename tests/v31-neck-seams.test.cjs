const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let canvasLib;try{canvasLib=require('@napi-rs/canvas')}catch{canvasLib=require((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules')+'/@napi-rs/canvas')}
const {createCanvas,loadImage}=canvasLib;
(async()=>{
 const sb={document:{createElement:()=>createCanvas(128,320)}};vm.createContext(sb);
 vm.runInContext(fs.readFileSync('public/v31-feet.js','utf8')+fs.readFileSync(process.env.V31_EQUIPMENT_MODULE||'public/v31-equipment.js','utf8')+'\nthis.E=V31Equipment',sb);
 const source=sb.buildV31FeetAtlas(await loadImage('public/hero_32x40_v31.png')),gear=sb.E.make(source),base=source.getContext('2d').getImageData(0,0,128,320).data;
 let poses=0,outlinePixels=0;
 for(let tier=1;tier<=6;tier++){
  const p=gear.get(0,0,null,0,tier,0).getContext('2d').getImageData(0,0,128,320).data;
  for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++){
   const idx=(x,y)=>((row*40+y)*128+frame*32+x)*4,alpha=(x,y)=>x>=0&&x<32&&y>=0&&y<40&&p[idx(x,y)+3]>0;
   let neck=0;
   for(let x=0;x<32;x++)if(base[idx(x,24)+3]){assert(alpha(x,24),`T${tier} row${row} frame${frame}: erased neck/under-jaw pixel ${x},24`);outlinePixels++;neck++}
   assert(neck>0,'test fixture must have a neck contour');
   // The helmet, face and neck must connect to the original shoulders. This
   // catches profile holes even when a stray pixel keeps row 24 non-empty.
   const visited=new Set(),queue=[];
   for(let x=0;x<32;x++)if(alpha(x,26)){visited.add(26*32+x);queue.push([x,26])}
   for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const xx=x+dx,yy=y+dy,key=yy*32+xx;
     if(xx<0||xx>=32||yy<0||yy>26||visited.has(key)||!alpha(xx,yy))continue;
     visited.add(key);queue.push([xx,yy]);
    }
   }
   for(let y=0;y<=24;y++)for(let x=0;x<32;x++)if(alpha(x,y))assert(visited.has(y*32+x),`T${tier} row${row} frame${frame}: detached profile/neck pixel ${x},${y}`);
   for(let y=25;y<40;y++)for(let x=0;x<32;x++)for(let k=0;k<4;k++)assert.equal(p[idx(x,y)+k],base[idx(x,y)+k],'approved body/feet changed');
   poses++;
  }
 }
 console.log(`PASS: ${poses} helmet poses, ${outlinePixels} original neck-outline pixels retained; connected face/profile/neck contours and unchanged body/feet.`);
})().catch(e=>{console.error(e);process.exitCode=1});
