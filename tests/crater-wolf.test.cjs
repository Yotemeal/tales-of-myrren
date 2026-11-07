const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const createGame=require('./game-runtime.cjs');

(async()=>{
 async function encounter(search='?craterPreview=1'){
  const {game:g}=await createGame({}, {search});
  const wolf=g.mons.find(m=>m.t==='wolf');
  g.mons.splice(0,g.mons.length,wolf);
  Object.assign(wolf,{x:1380,y:800,hx:1380,hy:800,cd:g.MT.wolf.iv,state:'chase',prov:true});
  Object.assign(g.me,{x:1405,y:800,hp:g.hpMax()});
  return {g,wolf};
 }
 const random=Math.random;
 try{
  Math.random=()=>0;
  let {g,wolf}=await encounter();
  const hp=g.me.hp;
  g.update(.05,1000);
  assert(wolf.wolfAttack);
  g.update(.05,1319);
  assert.equal(wolf.x,1380);
  assert.equal(g.me.hp,hp);
  g.update(.05,1320);
  assert.equal(wolf.lunge,1320);
  g.update(.05,1430);
  assert(wolf.x>1380);
  assert(g.me.hp<hp);
  const after=g.me.hp;
  g.update(.05,1470);
  assert.equal(g.me.hp,after);
  assert.equal(wolf.x,1405);
  assert.equal(wolf.wolfAttack,null);

  ({g,wolf}=await encounter());
  g.update(.05,1000);
  g.me.y+=20;
  g.update(.05,1320);
  g.update(.05,1470);
  assert.equal(wolf.y,800,'the lunge stays aimed at the original position');
  assert.equal(g.me.hp,g.hpMax(),'the player can dodge sideways');

  ({g,wolf}=await encounter());
  g.SOLID.push({x0:1389,x1:1394,y0:795,y1:805});
  g.update(.05,1000);
  g.update(.05,1320);
  g.update(.05,1470);
  assert(wolf.x<1389);
  assert.equal(g.me.hp,g.hpMax());

  ({g,wolf}=await encounter());
  g.update(.05,1000);
  g.killMon(wolf,1100);
  assert.equal(wolf.wolfAttack,null);
  g.update(.05,1470);
  assert.equal(g.me.hp,g.hpMax());

  ({g,wolf}=await encounter(''));
  g.update(.05,1000);
  assert.equal(wolf.wolfAttack,undefined);
  assert(wolf.x>1380,'normal play keeps the existing chase');
 }finally{Math.random=random}

 const metadata=JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'));
 const image=await loadImage('public/'+metadata.references.R6.file);
 const window={},document={createElement:()=>createCanvas(1,1)};
 function AtlasImage(){
  const canvas=createCanvas(image.width,image.height);
  canvas.getContext('2d').drawImage(image,0,0);
  Object.defineProperty(canvas,'src',{set(value){
   assert.equal(value.split('?')[0],'/'+metadata.references.R6.file);
   canvas.onload();
  }});
  Object.defineProperties(canvas,{naturalWidth:{value:image.width},naturalHeight:{value:image.height}});
  return canvas;
 }
 for(const name of ['crater-animation','crater-wolf']){
  new Function('window','document','Image','fetch',fs.readFileSync('public/'+name+'.js','utf8'))(
   window,document,AtlasImage,async()=>({ok:true,json:async()=>metadata}));
 }
 const renderer=window.MyrrenCraterWolf.create();
 assert(await renderer.load());
 const surface=createCanvas(560,84),ctx=surface.getContext('2d');
 ctx.fillStyle='#283a32';ctx.fillRect(0,0,560,84);
 const {states}=metadata.creatures.find(c=>c.id==='dire_wolf');
 const draw=window.MyrrenCraterAnimation.drawFrame;
 let frame;
 window.MyrrenCraterAnimation.drawFrame=(...args)=>{frame=args[2];draw(...args)};
 const cases=[
  [{},states.idle.frames[0]],
  [{moving:true},states.move.frames[0]],
  [{wolfAttack:{}},states.attack.frames[0]],
  [{lunge:0},states.attack.frames[1]],
  [{lunge:-90},states.attack.frames[2]],
  [{hitAge:0},states.hit.frames[0]],
  [{state:'dead'},states.death.frames[0]]
 ];
 for(const [i,[pose,expected]] of cases.entries()){
  const {moving=false,hitAge=Infinity,...monster}=pose;
  assert(renderer.draw(ctx,{t:'wolf',state:'chase',lunge:-9999,face:i%2?-1:1,...monster},i*80+40,60,0,{moving,hitAge}));
  assert.equal(frame,expected);
 }
 if(process.env.WOLF_CONTACT_SHEET)fs.writeFileSync(process.env.WOLF_CONTACT_SHEET,surface.toBuffer('image/png'));
 console.log('PASS: Dire Wolf preview selects approved poses, telegraphs and lunges once, can be dodged, stops at obstacles and cancels on death.');
})().catch(e=>{console.error(e);process.exitCode=1});
