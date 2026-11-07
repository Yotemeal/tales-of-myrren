const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
 const {game:normal}=await createGame();
 const {game:preview}=await createGame({}, {search:'?craterPreview=1'});
 const tiers=[
  ['rat',5,10,4000],['goblin',10,16,6000],['boar',14,25,8000],
  ['wolf',20,40,10000],['goblin_guard',26,50,12000],
  ['guardian',32,65,14000],['troll',42,95,16000]
 ];
 for(const [type,hp,xp,respawn] of tiers){
  const mt=preview.MT[type];
  assert.equal(mt.hp,hp);
  assert.equal(preview.combatKillXp(mt),xp);
  assert.equal(mt.respawnMs,respawn);
  const levelGap=preview.xpTable[mt.lv+1]-preview.xpTable[mt.lv];
  assert(Math.ceil(levelGap/xp)>=7&&Math.ceil(levelGap/xp)<=9);
 }
 for(const [type,damage] of [['goblin',2],['boar',3],['wolf',4],['goblin_guard',4],['guardian',4],['troll',6]]){
  assert.equal(preview.MT[type].max,damage);
 }
 for(const [type,xp] of [['slime',5],['goblin',12],['boar',22],['wolf',44],['bear',168]]){
  assert.equal(normal.combatKillXp(normal.MT[type]),xp);
  assert.equal(normal.MT[type].respawnMs,undefined);
 }
 const rat=preview.mons.find(m=>m.t==='rat');
 preview.mons.splice(0,preview.mons.length,rat);
 const before=preview.save.xp.melee;
 preview.killMon(rat,1000);
 preview.killMon(rat,1001);
 assert.equal(preview.save.xp.melee-before,10);
 preview.update(.05,4999);
 assert.equal(rat.state,'dead');
 preview.update(.05,5000);
 assert.equal(rat.state,'idle');
 assert.equal(rat.hp,5);
 assert.equal(Math.ceil(preview.xpTable[2]/preview.combatKillXp(preview.MT.rat)),9);
 console.log('PASS: preview kill XP and respawn tiers, unchanged damage, one reward per kill and legacy balance.');
})().catch(e=>{console.error(e);process.exitCode=1});
