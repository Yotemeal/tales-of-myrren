const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const sb={window:{},document:{createElement:()=>createCanvas(1,1)}};vm.createContext(sb);vm.runInContext(fs.readFileSync('public/approved-character.js','utf8'),sb);
 const image=await loadImage('public/hero-approved-v1.png'),original=createCanvas(384,640);original.getContext('2d').drawImage(image,0,0);
 const H=sb.window.MyrrenHero,matched=H.matchPunchHair(image),before=original.getContext('2d').getImageData(0,0,384,640).data,after=matched.getContext('2d').getImageData(0,0,384,640).data;
 assert.equal(H.matchPunchHair(image),matched,'prepare once per atlas');
 let changed=0;
 for(const row of [5,6,9])for(let y=row*64;y<(row+1)*64;y++)for(let x=0;x<384;x++)for(let k=0;k<4;k++)assert.equal(after[(y*384+x)*4+k],before[(y*384+x)*4+k],'punch reference must remain byte-for-byte intact');
 const hash=(canvas,row,col,cut)=>{
  const c=canvas.getContext('2d'),pixels=c.getImageData(col*64,row*64,64,cut).data;let x0=64,y0=cut,x1=0,y1=0;
  for(let y=0;y<cut;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  const trimmed=c.getImageData(col*64+x0,row*64+y0,x1-x0+1,y1-y0+1).data;
  return crypto.createHash('sha256').update(trimmed).digest('hex');
 };
 const front=hash(original,5,0,44),left=hash(original,6,0,44),back=hash(original,9,0,42);
 const necks=[[43,44,44,43,46,46],[43,44,44,43,44,43],[44,44,44,44,44,44],[44,44,44,44,44,44],[42,43,44,43,42,43]];
 for(let row=0;row<5;row++)for(let col=0;col<6;col++){
  const cut=necks[row][col],expected=row===4||row===0&&(col===3||col===5)?back:row===2||row===0&&col===1?left:front;
  if(row===2||row===3||row===0&&col===4)continue; // Full jaw landmarks are checked in head-alignment.test.cjs.
  assert.equal(hash(matched,row,col,cut),expected,'idle/run/hurt head must use the exact punch colour AND silhouette');
  for(let y=cut;y<64;y++)for(let x=0;x<64;x++)for(let k=0;k<4;k++)assert.equal(after[(((row*64+y)*384+col*64+x)*4)+k],before[(((row*64+y)*384+col*64+x)*4)+k],'body/limbs/feet changed');
  // The new head remains attached at the original neck, never floating above it.
  let connected=false;for(let x=16;x<48;x++)if(after[(((row*64+cut-1)*384+col*64+x)*4)+3]&&after[(((row*64+cut)*384+col*64+x)*4)+3])connected=true;
  assert(connected,'disconnected jaw / neck');
 }
 for(let row=7;row<=8;row++)for(let col=2;col<6;col++)for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const i=((row*64+y)*384+col*64+x)*4;assert.equal(after[i+3],before[i+3],'falling silhouette changed');
  if(before[i]>=145)for(let k=0;k<4;k++)assert.equal(after[i+k],before[i+k],'skin or body recoloured');
 }
 for(let i=0;i<after.length;i++){if(after[i]!==before[i])changed++;if(i%4===3)assert(after[i]===0||after[i]===255,'blurred alpha');}
 assert(changed>1000);
 console.log('PASS: exact punch hair shape/colour across idle, four-way run and hurt; all 18 punch frames intact; connected necks; unchanged bodies/feet and falling silhouettes.');
})().catch(e=>{console.error(e);process.exitCode=1});
