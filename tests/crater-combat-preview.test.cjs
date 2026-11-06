const assert=require('node:assert/strict'),createGame=require('./game-runtime.cjs');
const goblin=(g,x=1385,y=800)=>({t:'goblin',x,y,hx:x,hy:y,hp:g.MT.goblin.hp,state:'chase',back:0,cd:g.MT.goblin.iv,w:0,wx:x,wy:y,face:1,lunge:-9999,prov:true});
(async()=>{
 const normal=await createGame();assert.equal(normal.game.craterPreview,false);assert.equal(normal.game.craterRocks,null,'default game has no projectile system');
 const fixture={v:3,name:'Crater QA',xp:{melee:0,mining:123,woodcutting:234,fishing:345,cooking:456},inv:{coins:150,bread:3},bank:{logs:20},notes:{copper:10},eq:{},bag:[],pets:{woodcutting:2,mining:1,fishing:2},tokens:21,x:1450,y:800};
 const make=async()=>{const {game:g,memory}=await createGame({'ember-reach-v2':JSON.stringify(fixture)}, {search:'?craterPreview=1'});g.__memory=memory;g.adoptSave(JSON.parse(JSON.stringify(fixture)));g.mons.length=0;g.me.x=1450;g.me.y=800;g.me.hp=g.hpMax();return g};
 const random=Math.random;
 try{
  Math.random=()=>0;
  const legacy=normal.game;legacy.me.x=1450;legacy.me.y=800;legacy.me.hp=legacy.hpMax();legacy.mons.length=0;legacy.mons.push(goblin(legacy,1445));const legacyHp=legacy.me.hp;legacy.update(.05,1000);assert(legacy.me.hp<legacyHp,'normal goblin retains melee damage with preview disabled');
  let g=await make(),m=goblin(g);g.mons.push(m);const before=g.me.hp,xp=g.save.xp.melee;
  g.update(.05,1000);assert(m.rockCast,'goblin telegraphs before throwing');assert.equal(g.craterRocks.rocks.length,0);assert.equal(g.me.hp,before);
  g.update(.05,1300);assert.equal(g.craterRocks.rocks.length,1);assert.equal(g.me.hp,before,'launch is not instant damage');
  for(let i=1;i<=12;i++)g.update(.05,1300+i*50);
  assert(g.me.hp<before,'rock collision actually damages the player');assert.equal(g.save.xp.melee,xp,'enemy rock creates no combat XP');assert.equal(g.craterRocks.rocks.length,0);
  const after=g.me.hp;for(let i=1;i<=3;i++)g.update(.05,1900+i*50);assert.equal(g.me.hp,after,'impact cannot hit repeatedly');
  assert.deepEqual(g.snap().pets,fixture.pets);assert.deepEqual(g.snap().bank,fixture.bank);assert.deepEqual(g.snap().notes,fixture.notes);assert.equal(g.save.inv.coins,fixture.inv.coins);
  assert.deepEqual(JSON.parse(g.__memory.get('ember-reach-v2')),fixture,'preview cannot overwrite the live save');assert(g.__memory.has('myrren-crater-preview-v1'),'preview uses a separate local save key');
  g=await make();m=goblin(g);g.mons.push(m);g.update(.05,1000);g.me.y=830;g.update(.05,1300);const dodgeHp=g.me.hp;for(let i=1;i<=18;i++)g.update(.05,1300+i*50);assert.equal(g.me.hp,dodgeHp,'moving aside after telegraph dodges the rock');
  g=await make();m=goblin(g,1440);const d=Math.abs(m.x-g.me.x);g.updateRockThrower(m,g.MT.goblin,.1,1000,d,g.me.x-m.x,0);assert(Math.abs(m.x-g.me.x)>d,'miner retreats when crowded');
  g=await make();m=goblin(g);g.mons.push(m);g.update(.05,1000);m.hx=m.x-200;g.update(.05,1100);assert.equal(m.state,'return');assert.equal(m.rockCast,null,'leashing cancels a prepared throw');
  g=await make();g.craterRocks.launch({x:1385,y:800,targetX:1450,targetY:800,speed:140,maxDistance:120,owner:'goblin'});g.enterBuilding(g.BLD.find(b=>!b.open),2000);assert.equal(g.craterRocks.rocks.length,0,'entering an interior clears outdoor rocks');
  g=await make();m=goblin(g);m.rockCast={at:1000,x:g.me.x,y:g.me.y};g.mons.push(m);g.killMon(m,1100);assert.equal(m.rockCast,null,'death cancels unreleased cast');
  g.craterRocks.launch({x:1385,y:800,targetX:1450,targetY:800,speed:140,maxDistance:120,owner:'goblin'});g.adoptSave(fixture);assert.equal(g.craterRocks.rocks.length,0,'restoring a save clears transient projectiles');
  g.craterRocks.launch({x:1385,y:800,targetX:1450,targetY:800,speed:140,maxDistance:120,owner:'goblin'});g.me.deathAt=1000;g.update(.05,1100);assert.equal(g.craterRocks.rocks.length,0,'player death clears projectiles');
 }finally{Math.random=random}
 console.log('PASS: opt-in legacy-goblin preview telegraphs, throws, damages, retreats and permits dodging; casts cancel and progress remains intact.');
})().catch(e=>{console.error(e);process.exitCode=1});
