const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const createGame=require('./game-runtime.cjs');

(async()=>{
 const {game:normal}=await createGame();
 const {game:preview}=await createGame({}, {search:'?craterPreview=1'});
 const legacy=['bunny','bird','deer','fox'];
 assert.deepEqual([...new Set(normal.crits.map(c=>c.t))],legacy);
 assert.deepEqual([...new Set(preview.crits.map(c=>c.t))],[...legacy,'squirrel']);
 const hp=preview.me.hp;
 for(const type of [...legacy,'squirrel']){
  const animal=preview.crits.find(c=>c.t===type);
  preview.me.x=animal.x-1;
  preview.me.y=animal.y;
  preview.critUpdate(.05,1000);
  assert.equal(animal.mode,type==='bird'?'fly':'flee');
  if(type==='bird')assert(animal.z>0);
 }
 assert.equal(preview.me.hp,hp);

 const window={},document={createElement:()=>createCanvas(1,1)};
 const metadata=JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'));
 const image=await loadImage('public/'+metadata.references.R4.file);
 // Use a real canvas as the image source while keeping the loader synchronous.
 function AtlasImage(){
  const canvas=createCanvas(image.width,image.height);
  canvas.getContext('2d').drawImage(image,0,0);
  Object.defineProperty(canvas,'src',{set(value){
   assert.equal(value.split('?')[0],'/'+metadata.references.R4.file);
   canvas.onload();
  }});
  Object.defineProperties(canvas,{naturalWidth:{value:image.width},naturalHeight:{value:image.height}});
  return canvas;
 }
 for(const name of ['crater-animation','crater-wildlife']){
  new Function('window','document','Image','fetch',fs.readFileSync('public/'+name+'.js','utf8'))(
   window,document,AtlasImage,async()=>({ok:true,json:async()=>metadata}));
 }
 const art=window.MyrrenCraterWildlife.create();
 const surface=createCanvas(500,180),ctx=surface.getContext('2d');
 assert.equal(art.draw(ctx,{t:'deer'},0,0,0),false);
 assert(await art.load());
 for(const [column,t] of [...legacy,'squirrel'].entries()){
  for(const [row,mode] of ['idle',t==='bird'?'fly':'flee'].entries()){
   const x=column*100,y=row*90;
   assert(art.draw(ctx,{t,mode,face:row?1:-1,z:row&&t==='bird'?12:0,flightAt:0},x+50,y+70,330));
   const pixels=ctx.getImageData(x,y,100,90).data;
   assert(pixels.some((v,i)=>i%4===3&&v===255));
   assert(pixels.some((v,i)=>i%4===3&&v===0));
  }
 }
 if(process.env.WILDLIFE_CONTACT_SHEET)fs.writeFileSync(process.env.WILDLIFE_CONTACT_SHEET,surface.toBuffer('image/png'));
 console.log('PASS: five passive species flee, raven takes flight, normal roster stays intact, and both poses render for every species.');
})().catch(e=>{console.error(e);process.exitCode=1});
