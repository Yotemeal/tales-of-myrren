const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');
const fixture={v:3,name:'Combat QA',xp:{melee:0,mining:1234,woodcutting:500,fishing:600,cooking:700},inv:{coins:1000,bread:10},bank:{logs:100},notes:{copper:500},eq:{},bag:[],tokens:47,x:800,y:844};
const monster=(t,type='slime',hp=t.MT[type].hp)=>({t:type,hp,state:'idle',x:t.me.x,y:t.me.y+4,hx:t.me.x,hy:t.me.y+4,back:0,cd:0,prov:false});
function swing(t,now){t.beginSwing(now-110);t.me.pend=0;t.resolveSwing(now)}
async function fresh(){const {game:t,memory}=await createGame();t.adoptSave(JSON.parse(JSON.stringify(fixture)));t.mons.length=0;t.me.fx=0;t.me.fy=1;return{t,memory}}
(async()=>{
 const random=Math.random;
 try{
  // Deterministic successful one-damage hits also exercise loot and saving.
  Math.random=()=>0;
  let {t,memory}=await fresh();let m=monster(t);t.mons.push(m);
  for(let hit=1;hit<5;hit++){swing(t,hit*1000);assert.equal(m.hp,5-hit);assert.equal(t.save.xp.melee,0,'nonlethal hits must award zero XP')}
  const beforeCoins=t.save.inv.coins;swing(t,5000);
  assert.equal(m.state,'dead');assert.equal(t.save.xp.melee,5,'slime kill reward');assert(t.save.inv.coins>beforeCoins,'kill loot retained');
  assert.equal(JSON.parse(memory.get('ember-reach-v2')).xp.melee,5,'kill XP persisted');
  const rewards=t.save.xp.melee,coins=t.save.inv.coins,bag=t.save.bag.length;
  swing(t,6000);t.killMon(m,6000);assert.equal(t.save.xp.melee,rewards,'dead monster cannot award twice');assert.equal(t.save.inv.coins,coins);assert.equal(t.save.bag.length,bag);
  // The older targeted attack path follows the same rule.
  ({t}=await fresh());m=monster(t);t.beginAct('monster',m);t.doAction(.71,1000);assert.equal(m.hp,4);assert.equal(t.save.xp.melee,0);
  for(let hit=0;hit<4;hit++)t.doAction(1.6,2000+hit*2000);
  assert.equal(t.save.xp.melee,5);assert.equal(m.state,'dead');
  // An area swing rewards each killed creature, not a still-living neighbour.
  ({t}=await fresh());const dead=monster(t,'slime',1),alive=monster(t,'slime',5);t.mons.push(dead,alive);swing(t,1000);
  assert.equal(t.save.xp.melee,5);assert.equal(alive.hp,4);assert.equal(dead.state,'dead');
  // High damage and overkill cannot enlarge a creature's fixed reward.
  ({t}=await fresh());t.save.xp.melee=t.xpTable[75];t.save.eq.weapon='steel_sword';m=monster(t,'slime',1);t.mons.push(m);const start=t.save.xp.melee;
  Math.random=()=>.5;swing(t,1000);assert(m.hp<0);assert.equal(t.save.xp.melee-start,5);
  // A respawn can pay once again, while surviving hits still pay nothing.
  Math.random=()=>0;({t}=await fresh());m=monster(t,'slime',1);t.mons.push(m);swing(t,1000);t.update(.02,m.back);assert.equal(m.hp,5);assert.equal(m.state,'idle');
  for(let i=0;i<5;i++)swing(t,15000+i*1000);assert.equal(t.save.xp.melee,10);
  assert.equal(t.save.xp.mining,1234);assert.equal(t.save.tokens,47);assert.equal(t.save.bank.logs,100);assert.equal(t.save.notes.copper,500);
  // Reward reduction is explicit and retains the established monster tiers.
  assert.deepEqual(Object.fromEntries(Object.entries(t.MT).map(([id,mt])=>[id,t.combatKillXp(mt)])),{slime:5,goblin:12,wolf:44,boar:22,bear:168,cave:4500,abear:114400});
  console.log('PASS: zero XP on nonlethal hits in both attack paths; fixed kill rewards; duplicate-death guard; area kills; overkill; respawn; saved XP/loot and retained progress.');
 }finally{Math.random=random}
})().catch(e=>{console.error(e);process.exitCode=1});
