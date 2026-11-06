const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
function extractFunction(source,name){let a=source.indexOf('function '+name+'('),i=source.indexOf('{',a)+1,depth=1,quote=null,comment=null,escape=false;for(;depth;i++){const c=source[i],d=source.slice(i,i+2);if(comment==='line'){if(c==='\n')comment=null}else if(comment==='block'){if(d==='*/'){comment=null;i++}}else if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null}else if(d==='//'){comment='line';i++}else if(d==='/*'){comment='block';i++}else if("'\"`".includes(c))quote=c;else if(c==='{')depth++;else if(c==='}')depth--}return source.slice(a,i)}
(async()=>{
 const document={createElement:()=>createCanvas(128,320)},sb={document,window:{}};vm.createContext(sb);
 vm.runInContext(fs.readFileSync('public/v31-character.js','utf8')+fs.readFileSync('public/v31-feet.js','utf8')+fs.readFileSync('public/v31-equipment.js','utf8')+'\nthis.E=V31Equipment;',sb);
 const original=await loadImage('public/hero_32x40_v31.png'),face=sb.window.V31Character.buildFaceAtlas(original),feet=sb.buildV31FeetAtlas(face),gear=sb.E.make(feet);
 const base=createCanvas(128,320);base.getContext('2d').drawImage(original,0,0);const before=base.getContext('2d').getImageData(0,0,128,320).data,after=face.getContext('2d').getImageData(0,0,128,320).data;
 const centers=[15,16,15,15];let changed=0;
 for(let y=0;y<320;y++)for(let x=0;x<128;x++){const row=Math.floor(y/40),frame=Math.floor(x/32),xx=x%32,yy=y%40,i=(y*128+x)*4,patch=(row===0||row===4)&&yy>=18&&yy<=22&&xx>=(row===0?10:centers[frame]-6)&&xx<(row===0?22:centers[frame]+6);for(let k=0;k<4;k++)if(before[i+k]!==after[i+k]){assert(patch,'changed pixels outside face patch');changed++}}
 assert(changed>0);
 for(let f=0;f<4;f++)for(let y=18;y<=22;y++)for(let dx=0;dx<12;dx++)for(let k=0;k<4;k++){
  const canonical=before[((160+y)*128+9+dx)*4+k];
  assert.equal(after[(y*128+f*32+10+dx)*4+k],canonical,'standing face differs from walking face');
  assert.equal(after[((160+y)*128+f*32+centers[f]-6+dx)*4+k],canonical,'walking face changes shape between frames');
 }
 const runtime=fs.readFileSync('public/myrren-game.js','utf8'),draw=extractFunction(runtime,'drawApprovedPlayer'),canvas=createCanvas(32,42);
 Object.assign(sb,{ctx:canvas.getContext('2d'),approvedHero:null,myrrenV31Ready:true,myrrenV31FeetAtlas:feet,myrrenV31Equipment:gear,URLSearchParams,location:{search:''},DYES:[],me:{},shadowE(){},label(){},R(){},drawTool(){},rrect(){}});
 vm.runInContext(draw+'\nthis.draw=drawApprovedPlayer;',sb);
 let poses=0;
 const render=(tier,time,moving=false,swingAt=-99999,pose={dv:'d',f:1})=>{sb.ctx.clearRect(0,0,32,42);assert(sb.draw(16,41,{...pose,g:[tier,tier,tier,tier,tier],moving,swingAt,tool:'fist'},time));return Buffer.from(sb.ctx.getImageData(0,0,32,42).data)};
 for(let t=0;t<=6;t++)for(const [row,pose] of [[0,{dv:'d',f:1}],[1,{dv:'s',f:-1}],[2,{dv:'s',f:1}],[3,{dv:'u',f:1}]]){
  const rest=render(t,0,false,-99999,pose),breath=render(t,2240,false,-99999,pose);assert.notDeepEqual(rest,breath,'idle is frozen');
  for(let y=32;y<42;y++)for(let x=0;x<32;x++)for(let k=0;k<4;k++)assert.equal(rest[(y*32+x)*4+k],breath[(y*32+x)*4+k],'idle moves soles/legs');
  // Breathing never changes the upper body geometry: it translates as one piece.
  const atlas=gear.get(t,t,null,t,t,t),src=atlas.getContext('2d').getImageData(0,0,128,320).data,frame=0;
  for(let y=0;y<31;y++)for(let x=0;x<32;x++)for(let k=0;k<4;k++)assert.equal(breath[(y*32+x)*4+k],src[((row*40+y)*128+frame*32+x)*4+k],'head/chest/neck idle translation changed geometry');
  render(t,2000,true,-99999,pose);render(t,2000,false,1900,pose);poses+=4;
 }
 assert.equal(sb.window.V31Character.idleLift(2000,false),0);assert.equal(sb.window.V31Character.idleLift(NaN),0);
 assert.equal(sb.window.V31Character.idleLift(0),0);assert.equal(sb.window.V31Character.idleLift(2000),1);assert.equal(sb.window.V31Character.idleLift(3600),0);
 const speed=+runtime.match(/SPD=(\d+)/)[1];assert.equal(speed,90);assert(speed/46>1.6);assert(runtime.includes('Math.floor(now/90)%4'));
 // Export a code-rendered before/after check sheet, not a replacement asset.
 const out=createCanvas(768,360),g=out.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#53664c';g.fillRect(0,0,768,360);g.fillStyle='#fff';g.font='16px sans-serif';
 g.fillText('Before · standing',12,24);g.fillText('After · standing',268,24);g.fillText('After · walking',524,24);
 g.drawImage(base,0,0,32,40,32,40,192,240);g.drawImage(feet,0,0,32,40,288,40,192,240);g.drawImage(feet,0,160,32,40,544,40,192,240);
 fs.writeFileSync('/workspace/scratch/myrren-face-comparison.png',out.toBuffer('image/png'));
 console.log(`PASS: aligned standing/walking face; ${poses} bare/equipped render states; fixed feet; connected native upper body; 3.6s idle cycle; 90px/s movement.`);
})().catch(e=>{console.error(e);process.exitCode=1});
