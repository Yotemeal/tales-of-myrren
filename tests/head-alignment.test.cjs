const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const sb={window:{},document:{createElement:()=>createCanvas(1,1)}};vm.createContext(sb);vm.runInContext(fs.readFileSync(process.env.ALIGNMENT_MODULE||'public/approved-character.js','utf8'),sb);
 const image=await loadImage('public/hero-approved-v1.png'),original=createCanvas(384,640);original.getContext('2d').drawImage(image,0,0);
 const H=sb.window.MyrrenHero,matched=H.matchPunchHair(image),a=matched.getContext('2d').getImageData(0,0,384,640).data,b=original.getContext('2d').getImageData(0,0,384,640).data;
 const rgba=(p,row,col,x,y)=>Array.from(p.slice(((row*64+y)*384+col*64+x)*4,((row*64+y)*384+col*64+x)*4+4));
 // Landmarks were checked against each native source pose, including its chin
 // and the separate shoulder beside it. These must never become a second mouth.
 const sideX=[-2,-1,-1,-2,-1,-1],jawY=[45,46,45,46,45,45];
 for(let col=0;col<6;col++)for(const [row,ref,x0,x1,dx] of [[2,6,28,33,sideX[col]],[3,5,30,35,-sideX[col]]]){
  for(let x=x0;x<=x1;x++)assert.deepEqual(rgba(a,row,col,x+dx,jawY[col]),rgba(b,ref,0,x,45),'complete chin must follow the running pose');
  let joined=false;for(let x=x0+dx;x<=x1+dx;x++)for(let near=x-1;near<=x+1;near++)if(rgba(a,row,col,x,jawY[col])[3]&&rgba(a,row,col,near,jawY[col]+1)[3])joined=true;assert(joined,'jaw must remain attached to the neck');
  // Lower torso, hands, knees and feet keep their original pose.
  for(let y=48;y<64;y++)for(let x=0;x<64;x++)assert.deepEqual(rgba(a,row,col,x,y),rgba(b,row,col,x,y),'running body/limbs changed');
 }
 function headCentre(row,col,cut){let left=64,right=-1;for(let y=0;y<cut;y++)for(let x=0;x<64;x++)if(a[((row*64+y)*384+col*64+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x)}return (left+right)/2}
 assert.equal(headCentre(0,3,43),31.5,'standing rear head must be centered on the torso');
 assert.equal(headCentre(0,5,46),32.5,'rear hurt head must follow the shifted neck');
 assert.equal(headCentre(0,4,46),31.5,'front hurt head must stay centered');
 for(let x=30;x<=35;x++)assert.deepEqual(rgba(a,0,4,x,49),rgba(b,5,0,x,45),'hurt chin must replace the old lower face');
 // The forward and rear punch artwork is the approved reference, untouched.
 for(const row of [5,6,9])for(let col=0;col<6;col++)for(let y=0;y<64;y++)for(let x=0;x<64;x++)assert.deepEqual(rgba(a,row,col,x,y),rgba(b,row,col,x,y),'punch reference changed');
 const hero=H.create(image),left=createCanvas(64,64),right=createCanvas(64,64);
 hero.draw(left.getContext('2d'),32,60,{dv:'s',f:-1,hurtAt:1000},1050);hero.draw(right.getContext('2d'),32,60,{dv:'s',f:1,hurtAt:1000},1050);
 const l=left.getContext('2d').getImageData(0,0,64,64).data,r=right.getContext('2d').getImageData(0,0,64,64).data;
 for(let y=0;y<64;y++)for(let x=0;x<64;x++)for(let k=0;k<4;k++)assert.equal(l[(y*64+x)*4+k],r[(y*64+63-x)*4+k],'side hurt must face the correct direction');
 console.log('PASS: complete side-running chins in all 12 poses; centered rear idle/hurt; aligned front hurt jaw; correct side hurt facing; punch/body/feet preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
