const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
// Transparency in the outside background (including the space between legs)
// is valid. Transparency enclosed inside the character is a visible hole.
function interiorHoles(p){const visited=new Uint8Array(4096),holes=[];for(let i=0;i<4096;i++){
 if(p[i*4+3]||visited[i])continue;let component=[],stack=[i],outside=false;visited[i]=1;
 while(stack.length){const n=stack.pop(),x=n%64,y=n/64|0;component.push(n);if(!x||x===63||!y||y===63)outside=true;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*64+xx;if(xx<0||xx>63||yy<0||yy>63||visited[j]||p[j*4+3])continue;visited[j]=1;stack.push(j)}
 }if(!outside)holes.push(...component);
}return holes}
(async()=>{
 const sb={window:{},document:{createElement:()=>createCanvas(1,1)}};vm.createContext(sb);vm.runInContext(fs.readFileSync(process.env.RUN_SEAM_MODULE||'public/approved-character.js','utf8'),sb);
 const source=await loadImage('public/hero-approved-v1.png'),H=sb.window.MyrrenHero,hero=H.create(source),atlas=H.matchPunchHair(source),ac=atlas.getContext('2d');
 const original=createCanvas(384,640);original.getContext('2d').drawImage(source,0,0);
 let checked=0;
 for(const f of [-1,1])for(let frame=0;frame<6;frame++)for(const offset of [0,37,74]){
  const c=createCanvas(64,64),ctx=c.getContext('2d');hero.draw(ctx,32,60,{dv:'s',f,moving:true},frame*75+offset);const p=ctx.getImageData(0,0,64,64).data;
  assert.deepEqual(interiorHoles(p),[],`${f<0?'left':'right'} run frame ${frame}: background leaks through neck/body`);checked++;
  for(let i=3;i<p.length;i+=4)assert(p[i]===0||p[i]===255,'moving character should be fully opaque');
  const body=ac.getImageData(frame*64,(f<0?2:3)*64+48,64,16).data,before=original.getContext('2d').getImageData(frame*64,(f<0?2:3)*64+48,64,16).data;
  assert.deepEqual(body,before,'arms/legs/feet changed');
 }
 for(const row of [5,6,9])assert.deepEqual(ac.getImageData(0,row*64,384,64).data,original.getContext('2d').getImageData(0,row*64,384,64).data,'punch artwork must remain intact');
 console.log(`PASS: ${checked} rendered side-run states with zero enclosed transparent pixels; opaque neck/shoulder joins; unchanged lower body and all punch frames.`);
})().catch(e=>{console.error(e);process.exitCode=1});
