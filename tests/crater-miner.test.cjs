const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createCanvas,loadImage}=require('@napi-rs/canvas');

(async()=>{
 const metadata=JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'));
 const image=await loadImage('public/'+metadata.references.R3.file);
 const window={},document={createElement:()=>createCanvas(1,1)};
 function AtlasImage(){
  const canvas=createCanvas(image.width,image.height);
  canvas.getContext('2d').drawImage(image,0,0);
  Object.defineProperty(canvas,'src',{set(value){
   assert.equal(value.split('?')[0],'/'+metadata.references.R3.file);
   canvas.onload();
  }});
  Object.defineProperties(canvas,{naturalWidth:{value:image.width},naturalHeight:{value:image.height}});
  return canvas;
 }
 for(const name of ['crater-animation','crater-miner']){
  new Function('window','document','Image','fetch',fs.readFileSync('public/'+name+'.js','utf8'))(
   window,document,AtlasImage,async()=>({ok:true,json:async()=>metadata}));
 }
 const miner=window.MyrrenCraterMiner.create();
 assert(await miner.load());
 const draw=window.MyrrenCraterAnimation.drawFrame;
 const surface=createCanvas(640,84),ctx=surface.getContext('2d');
 ctx.fillStyle='#283a32';
 ctx.fillRect(0,0,640,84);
 let frame,flipped;
 window.MyrrenCraterAnimation.drawFrame=(...args)=>{
  frame=args[2];
  flipped=args[6];
  draw(...args);
 };
 const {states}=metadata.creatures.find(c=>c.id==='goblin_miner');
 const cast={at:1000},release={rockReleasedAt:1300};
 const cases=[
  [1000,{rockCast:cast},states.attack.frames[0]],
  [1150,{rockCast:cast},states.attack.frames[1]],
  [1300,release,states.attack.frames[2]],
  [1410,release,states.attack.frames[3]],
  [1520,release,states.idle.frames[0]],
  [1560,{moving:true},states.move.frames[1]],
  [1560,{hitAge:20},states.hit.frames[0]],
  [1560,{state:'dead',dieAt:1300},states.death.frames[1]]
 ];
 for(const [i,[now,pose,expected]] of cases.entries()){
  const {moving=false,hitAge=Infinity,...monster}=pose;
  assert(miner.draw(ctx,{t:'goblin',state:'chase',face:i%2?-1:1,...monster},i*80+40,60,now,{moving,hitAge,windup:300}));
  assert.equal(frame,expected);
  assert.equal(flipped,!!(i%2));
 }
 assert.equal(states.attack.frames[2].w,88,'release crop excludes the baked-in rock');
 assert.equal(miner.draw(ctx,{t:'boar'},0,0,0,{}),false);
 if(process.env.MINER_CONTACT_SHEET)fs.writeFileSync(process.env.MINER_CONTACT_SHEET,surface.toBuffer('image/png'));
 console.log('PASS: miner art tracks windup, release, recovery, movement, hit and death without a duplicate rock.');
})().catch(e=>{console.error(e);process.exitCode=1});
