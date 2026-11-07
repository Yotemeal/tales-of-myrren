const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const createGame=require('./game-runtime.cjs');

(async()=>{
 async function encounter(search='?craterPreview=1',type='wolf'){
  const {game:g}=await createGame({}, {search});
  const creature=g.mons.find(m=>m.t===type);
  g.mons.splice(0,g.mons.length,creature);
  Object.assign(creature,{x:1380,y:800,hx:1380,hy:800,cd:g.MT[type].iv,state:'chase',prov:true});
  Object.assign(g.me,{x:1405,y:800,hp:g.hpMax()});
  return {g,creature};
 }
 const random=Math.random;
 try{
  Math.random=()=>0;
  let {g,creature}=await encounter();
  const hp=g.me.hp;
  g.update(.05,1000);
  assert(creature.dashAttack);
  g.update(.05,1319);
  assert.equal(creature.x,1380);
  assert.equal(g.me.hp,hp);
  g.update(.05,1320);
  assert.equal(creature.lunge,1320);
  g.update(.05,1430);
  assert(creature.x>1380);
  assert(g.me.hp<hp);
  const after=g.me.hp;
  g.update(.05,1470);
  assert.equal(g.me.hp,after);
  assert.equal(creature.x,1405);
  assert.equal(creature.dashAttack,null);

  ({g,creature}=await encounter());
  g.update(.05,1000);
  g.me.y+=20;
  g.update(.05,1320);
  g.update(.05,1470);
  assert.equal(creature.y,800,'the lunge stays aimed at the original position');
  assert.equal(g.me.hp,g.hpMax(),'the player can dodge sideways');

  ({g,creature}=await encounter());
  g.SOLID.push({x0:1389,x1:1394,y0:795,y1:805});
  g.update(.05,1000);
  g.update(.05,1320);
  g.update(.05,1470);
  assert(creature.x<1389);
  assert.equal(g.me.hp,g.hpMax());

  ({g,creature}=await encounter());
  g.update(.05,1000);
  g.killMon(creature,1100);
  assert.equal(creature.dashAttack,null);
  g.update(.05,1470);
  assert.equal(g.me.hp,g.hpMax());

  ({g,creature}=await encounter('?craterPreview=1','boar'));
  g.me.x=1420;
  g.update(.05,1000);
  assert(creature.dashAttack,'boar starts its charge from further away');
  g.update(.05,1459);
  assert.equal(creature.x,1380);
  assert.equal(g.me.hp,g.hpMax());
  g.update(.05,1460);
  g.update(.05,1650);
  assert.equal(creature.x,1420);
  assert(g.me.hp<g.hpMax());
  const boarHit=g.me.hp;
  g.update(.05,1740);
  assert.equal(g.me.hp,boarHit);
  assert.equal(creature.cd,0,'boar is still recovering');

  ({g,creature}=await encounter('?craterPreview=1','boar'));
  g.update(.05,1000);
  g.me.y+=20;
  g.update(.05,1460);
  g.update(.05,1650);
  assert.equal(creature.y,800);
  assert.equal(g.me.hp,g.hpMax());

  ({g,creature}=await encounter('?craterPreview=1','rat'));
  assert.equal(g.MT.rat.lv,1);
  g.me.x=1392;
  g.update(.05,1000);
  assert(creature.dashAttack,'a rat winds up only in close range');
  g.update(.05,1239);
  assert.equal(g.me.hp,g.hpMax());
  g.update(.05,1240);
  g.update(.05,1330);
  assert.equal(creature.x,1386,'a bite only moves the rat a few pixels');
  assert.equal(g.me.hp,g.hpMax()-1);
  g.update(.05,1400);
  assert.equal(g.me.hp,g.hpMax()-1,'a bite lands once');

  ({g,creature}=await encounter('?craterPreview=1','rat'));
  g.me.x=1392;
  g.update(.05,1000);
  g.me.y+=12;
  g.update(.05,1240);
  g.update(.05,1330);
  assert.equal(g.me.hp,g.hpMax(),'stepping away avoids the bite');

  ({g,creature}=await encounter('?craterPreview=1','troll'));
  assert.equal(g.MT.troll.lv,22);
  g.me.x=1402;
  g.update(.05,1000);
  assert(creature.dashAttack);
  g.update(.05,1619);
  assert.equal(g.me.hp,g.hpMax(),'raised club deals no damage before impact');
  g.update(.05,1620);
  assert.equal(creature.x,1380,'the troll plants its feet');
  assert(g.me.hp<g.hpMax());
  const afterSlam=g.me.hp;
  g.update(.05,1800);
  assert.equal(g.me.hp,afterSlam);
  assert.equal(creature.cd,0,'the troll recovers after impact');

  ({g,creature}=await encounter('?craterPreview=1','troll'));
  g.me.x=1402;
  g.update(.05,1000);
  g.me.y+=14;
  g.update(.05,1620);
  assert.equal(g.me.hp,g.hpMax(),'moving away from the aimed point dodges the slam');

  ({g,creature}=await encounter('?craterPreview=1','troll'));
  g.me.x=1402;
  g.SOLID.push({x0:1389,x1:1394,y0:795,y1:805});
  g.update(.05,1000);
  g.update(.05,1620);
  assert.equal(g.me.hp,g.hpMax(),'the club does not hit through a barrier');

  ({g,creature}=await encounter('?craterPreview=1','guardian'));
  assert.equal(g.MT.guardian.lv,18);
  g.me.x=1404;
  g.update(.05,1000);
  assert(creature.dashAttack);
  g.update(.05,1719);
  assert.equal(g.me.hp,g.hpMax());
  g.update(.05,1720);
  assert.equal(creature.x,1380,'guardian stays planted during the slam');
  const afterGuardian=g.me.hp;
  assert(afterGuardian<g.hpMax());
  g.update(.05,1900);
  assert.equal(g.me.hp,afterGuardian,'slam can only hit once');

  ({g,creature}=await encounter('?craterPreview=1','guardian'));
  g.me.x=1404;
  g.update(.05,1000);
  g.me.y+=18;
  g.update(.05,1720);
  assert.equal(g.me.hp,g.hpMax(),'moving out of the impact area dodges the guardian');

  const {game:normal}=await createGame();
  assert(!normal.mons.some(m=>m.t==='rat'||m.t==='troll'||m.t==='guardian'));
  const {game:preview}=await createGame({}, {search:'?craterPreview=1'});
  assert(preview.mons.some(m=>m.t==='rat'));
  assert(preview.mons.some(m=>m.t==='troll'));
  assert(preview.mons.some(m=>m.t==='guardian'));
  assert.equal(preview.mons.filter(m=>m.t==='cave').length,normal.mons.filter(m=>m.t==='cave').length);
  assert.equal(preview.mons.filter(m=>m.t==='bear').length,normal.mons.filter(m=>m.t==='bear').length);
  assert.equal(preview.mons.filter(m=>m.t==='slime').length,normal.mons.filter(m=>m.t==='slime').length);

  ({g,creature}=await encounter(''));
  g.update(.05,1000);
  assert.equal(creature.dashAttack,undefined);
  assert(creature.x>1380,'normal play keeps the existing chase');
 }finally{Math.random=random}

 const metadata=JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'));
 const sources=new Map(await Promise.all(['R1','R2','R6'].map(async ref=>{
  const file=metadata.references[ref].file;
  return ['/'+file,await loadImage('public/'+file)];
 })));
 const window={},document={createElement:()=>createCanvas(1,1)};
 function AtlasImage(){
  const canvas=createCanvas(1,1);
  Object.defineProperty(canvas,'src',{set(value){
   const image=sources.get(value.split('?')[0]);
   assert(image);
   canvas.width=image.width;
   canvas.height=image.height;
   canvas.getContext('2d').drawImage(image,0,0);
   Object.defineProperties(canvas,{naturalWidth:{value:image.width},naturalHeight:{value:image.height}});
   canvas.onload();
  }});
  return canvas;
 }
 for(const name of ['crater-animation','crater-dash']){
  new Function('window','document','Image','fetch',fs.readFileSync('public/'+name+'.js','utf8'))(
   window,document,AtlasImage,async()=>({ok:true,json:async()=>metadata}));
 }
 const renderer=window.MyrrenCraterDash.create();
 assert(await renderer.load());
 const surface=createCanvas(560,426),ctx=surface.getContext('2d');
 ctx.fillStyle='#283a32';ctx.fillRect(0,0,560,426);
 const {states}=metadata.creatures.find(c=>c.id==='dire_wolf');
 const draw=window.MyrrenCraterAnimation.drawFrame;
 let frame;
 window.MyrrenCraterAnimation.drawFrame=(...args)=>{frame=args[2];draw(...args)};
 const cases=[
  [{},states.idle.frames[0]],
  [{moving:true},states.move.frames[0]],
  [{dashAttack:{}},states.attack.frames[0]],
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
 const boar=metadata.creatures.find(c=>c.id==='wild_boar').states;
 const boarCases=[
  [{},boar.idle.frames[0]],
  [{moving:true},boar.move.frames[0]],
  [{dashAttack:{}},boar.attack.frames[0]],
  [{lunge:0},boar.attack.frames[1]],
  [{lunge:-90},boar.attack.frames[1]],
  [{hitAge:0},boar.hit.frames[0]],
  [{state:'dead'},boar.death.frames[0]]
 ];
 for(const [i,[pose,expected]] of boarCases.entries()){
  const {moving=false,hitAge=Infinity,...monster}=pose;
  assert(renderer.draw(ctx,{t:'boar',state:'chase',lunge:-9999,face:i%2?-1:1,...monster},i*80+40,144,0,{moving,hitAge,recover:380}));
  assert.equal(frame,expected);
 }
 const rat=metadata.creatures.find(c=>c.id==='forest_rat');
 assert(rat.draftFitHeight<metadata.creatures.find(c=>c.id==='wild_boar').draftFitHeight);
 const ratCases=[
  [{},rat.states.idle.frames[0]],
  [{moving:true},rat.states.move.frames[0]],
  [{dashAttack:{}},rat.states.attack.frames[0]],
  [{lunge:0},rat.states.attack.frames[1]],
  [{hitAge:0},rat.states.hit.frames[0]],
  [{state:'dead'},rat.states.death.frames[0]]
 ];
 for(const [i,[pose,expected]] of ratCases.entries()){
  const {moving=false,hitAge=Infinity,...monster}=pose;
  assert(renderer.draw(ctx,{t:'rat',state:'chase',lunge:-9999,face:i%2?-1:1,...monster},i*80+40,228,0,{moving,hitAge,recover:200}));
  assert.equal(frame,expected);
 }
 const troll=metadata.creatures.find(c=>c.id==='forest_troll').states;
 for(const [i,[pose,expected]] of [
  [{},troll.idle.frames[0]],
  [{moving:true},troll.move.frames[0]],
  [{dashAttack:{}},troll.attack.frames[0]],
  [{lunge:0},troll.attack.frames[1]],
  [{hitAge:0},troll.hit.frames[0]],
  [{state:'dead'},troll.death.frames[0]]
 ].entries()){
  const {moving=false,hitAge=Infinity,...monster}=pose;
  assert(renderer.draw(ctx,{t:'troll',state:'chase',lunge:-9999,face:i%2?-1:1,...monster},i*80+40,312,0,{moving,hitAge,recover:560}));
  assert.equal(frame,expected);
 }
 const guardian=metadata.creatures.find(c=>c.id==='cave_guardian').states;
 for(const [i,[now,pose,expected]] of [
  [0,{},guardian.idle.frames[0]],
  [0,{moving:true},guardian.move.frames[0]],
  [0,{dashAttack:{at:0}},guardian.attack.frames[0]],
  [240,{dashAttack:{at:0}},guardian.attack.frames[1]],
  [480,{dashAttack:{at:0}},guardian.attack.frames[2]],
  [720,{lunge:720},guardian.attack.frames[3]],
  [890,{state:'dead',dieAt:720},guardian.death.frames[1]]
 ].entries()){
  const {moving=false,...monster}=pose;
  assert(renderer.draw(ctx,{t:'guardian',state:'chase',lunge:-9999,face:i%2?-1:1,...monster},i*80+40,400,now,{moving,hitAge:Infinity,windup:720,recover:640}));
  assert.equal(frame,expected);
 }
 if(process.env.DASH_CONTACT_SHEET)fs.writeFileSync(process.env.DASH_CONTACT_SHEET,surface.toBuffer('image/png'));
 console.log('PASS: Crater beasts, Forest Troll and Cave Guardian use approved poses and dodgeable attacks. Checked damage, recovery, terrain and cancellation.');
})().catch(e=>{console.error(e);process.exitCode=1});
