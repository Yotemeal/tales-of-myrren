'use strict';
// Boss loot uses the original one-kill coin/rare-item budget. Each verified
// contributor earns an independent weighted roll, but a static client cannot
// legitimately pay other network players until boss HP becomes authoritative.
// Run: node tests/boss-contribution-loot.test.cjs
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
 const {game:g}=await createGame();
 const cave=g.MT.cave,aether=g.MT.abear;
 assert(cave.boss&&aether.boss,'existing bears must be explicitly marked boss');
 assert(Object.entries(g.MT).filter(([,m])=>m.boss).length===2);
 assert.equal(cave.drop.p,.12);
 assert.equal(aether.drop.p,.14);
 assert.equal(g.resolveBossRewards(g.MT.slime,[{id:'local',damage:5}],5,()=>0).length,0,
   'ordinary monsters do not use boss contribution rules');

 const single=g.resolveBossRewards(cave,[{id:'local',damage:cave.hp}],52,()=>.5);
 assert.equal(single.length,1);
 assert.equal(single[0].id,'local');
 assert.equal(single[0].coins,52,'100% of one solo coin roll is guaranteed');
 assert.equal(single[0].damage,cave.hp);
 assert.equal(single[0].share,1);
 assert.equal(single[0].dropChance,.12,'solo keeps original boss rare rate');
 assert.equal(single[0].rare,false);
 assert(g.resolveBossRewards(cave,[{id:'local',damage:150}],30,()=>0)[0].rare,
   'rare gear must be possible and may roll repeatedly on future kills');

 // Group simulation, not live multiplayer. Ignore trivial boss tagging,
 // combine duplicate credit rows and rank by actual damage rather than
 // kill blow, total Combat level, presence or per-client combat estimates.
 const rows=[
   {id:'leech',damage:2},{id:'support',damage:30},
   {id:'main',damage:100},{id:'main',damage:18}
 ];
 const rewards=g.resolveBossRewards(cave,rows,51,()=>.5);
 assert.deepEqual(rewards.map(r=>r.id),['main','support']);
 assert.deepEqual(rewards.map(r=>r.damage),[118,30]);
 assert.equal(rewards.reduce((total,p)=>total+p.coins,0),51,
   'group payout conserves a single original boss coin roll');
 assert(rewards.every(p=>p.coins>=1),'meaningful contributors receive coins');
 assert(rewards[0].coins>rewards[1].coins,'highest damage earns the highest coin share');
 assert(rewards[0].dropChance>rewards[1].dropChance,
   'highest damage gets the largest independent rare roll chance');
 assert(Math.abs(rewards.reduce((total,p)=>total+p.dropChance,0)-cave.drop.p)<1e-12,
   'group item-roll probabilities conserve the original one-boss rare budget');
 assert(rewards.every(p=>p.rare===false));
 const backwards=g.resolveBossRewards(cave,[...rows].reverse(),51,()=>.5);
 assert.deepEqual(backwards,rewards,'payout must be independent of credit record ordering');
 assert.deepEqual(g.resolveBossRewards(cave,[],40),[],
   'missing credit must not allocate coins or items');
 const corrupted=[{id:'',damage:50},{id:'someone',damage:-10},
   {id:'null',damage:NaN},{id:'inf',damage:Infinity},{id:4,damage:60},
   {id:'ok',damage:15}];
 const sanitized=g.resolveBossRewards(cave,corrupted,30,()=>.5);
 assert.deepEqual(sanitized.map(p=>p.id),['ok']);
 assert.equal(sanitized[0].coins,30,'invalid or negative claims cannot dilute payout');

 // Group rare rolls remain fair over repeated kills: different members can
 // roll independently, and one player never obtains several guaranteed
 // copies simply because others participated.
 let count=0;
 const groupRoll=g.resolveBossRewards(aether,
   [{id:'tank',damage:300},{id:'dps',damage:200},{id:'tag',damage:20}],120,
   ()=>{count++;return count===2?0:1});
 assert.equal(groupRoll.length,2,'Aether bear needs meaningful damage (>5% HP)');
 assert.equal(count,2,'one rare roll for each qualified member');
 assert.equal(groupRoll.filter(p=>p.rare).length,1);
 assert(Math.abs(groupRoll.reduce((p,r)=>p+r.dropChance,0)-.14)<1e-12);
 assert.equal(groupRoll.reduce((p,r)=>p+r.coins,0),120);
 assert(groupRoll[0].coins>groupRoll[1].coins);
 for(const coins of [cave.coins[0],cave.coins[1],aether.coins[0],aether.coins[1]]){
   const mt=coins>100?aether:cave;
   const payout=g.resolveBossRewards(mt,
     [{id:'a',damage:mt.hp*.6},{id:'b',damage:mt.hp*.25},{id:'c',damage:mt.hp*.15}],
     coins,()=>1);
   assert.equal(payout.reduce((n,p)=>n+p.coins,0),coins,'rounded shares conserve all coins');
   assert(payout.every(p=>p.coins>0));
 }

 // Damage ledger credits only effective, non-overkill hits, never a whiff.
 // The ledger is transient, isn't exported to a character save, and is
 // cleared after the boss is killed or leashes all the way back home.
 const mob=(type,hp)=>({
   t:type,hp,x:g.me.x+10,y:g.me.y+4,hx:g.me.x+10,hy:g.me.y+4,
   state:'idle',back:0,cd:0,prov:false,w:999,wx:0,wy:0
 });
 const m=mob('cave',cave.hp);
 assert.equal(g.recordBossContribution(m,'local',0),0);
 assert.equal(g.recordBossContribution(m,'local',-5),0);
 assert.equal(g.recordBossContribution(m,'local',Infinity),0);
 assert.equal(g.recordBossContribution(m,'local',20),20);
 m.hp-=20;
 assert.equal(g.recordBossContribution(m,'local',9999),m.hp,
   'cannot credit overkill damage in the local ledger');
 assert.equal(m.bossDamage.get('local'),150);
 assert.equal(g.recordBossContribution(m,'local',NaN),0);
 assert(!JSON.stringify(g.snap()).includes('bossDamage'),'combat-ledger state cannot enter old saves');

 // Real combat target code records hit damage automatically.
 const oldRandom=Math.random;
 try{
   Math.random=()=>0;
   g.mons.length=0;g.mons.push(m);
   g.me.x=g.CX;g.me.y=g.CY;g.me.fx=1;g.me.fy=0;g.me.pend=0;
   m.x=g.me.x+10;m.y=g.me.y+4;
   m.hp=2;m.bossDamage=null;
   g.beginSwing(1000);g.me.pend=0;g.resolveSwing(1110);
   assert.equal(m.bossDamage.get('local'),1);
   g.beginSwing(2000);g.me.pend=0;g.resolveSwing(2110);
   assert.equal(m.state,'dead');
   assert.equal(m.bossDamage.get('local'),2);
   assert.equal(g.save.xp.melee,g.combatKillXp(cave),
     'solo cave boss pays fixed XP exactly once');
   assert.equal(g.save.inv.coins,30+g.MT.cave.coins[0],
     'solo boss coin roll is guaranteed at original minimum');
   assert.equal(g.save.bag.length,1,'rare equipment is awarded from existing loot tier');
   const dropped=g.save.bag[0];
   assert(g.DEFS[dropped],'boss drop must be a real, usable item definition');
   assert.equal(g.save.eq.weapon,null,'boss gear drop goes to backpack, not autoequip');

   // A second boss kill may grant the exact same item: duplicates are
   // allowed for normal players and self-found/Ironman progression.
   const second=mob('cave',1);
   g.mons.push(second);
   g.me.pend=0;g.beginSwing(3000);g.me.pend=0;g.resolveSwing(3110);
   assert.equal(second.state,'dead');
   assert.deepEqual(g.save.bag,[dropped,dropped],
     'boss reward rolls never reject duplicate equipment');
   assert.equal(g.save.xp.melee,g.combatKillXp(cave)*2);
   const xp=g.save.xp.melee,bank=g.save.inv.coins,bag=g.save.bag.length;
   g.killMon(second,3200);
   assert.equal(g.save.xp.melee,xp,'duplicate death processing pays no extra XP');
   assert.equal(g.save.inv.coins,bank,'duplicate death processing pays no extra coins');
   assert.equal(g.save.bag.length,bag,'duplicate death processing pays no extra gear');
   g.update(.02,second.back);
   assert.equal(second.bossDamage,null,'boss respawn clears old damage tally');

   // Existing non-boss XP and loot rules are untouched.
   const slime=mob('slime',1);
   const coinsBefore=g.save.inv.coins;
   g.killMon(slime,5000);
   assert.equal(g.save.inv.coins,coinsBefore+g.MT.slime.coins[0]);
 }finally{Math.random=oldRandom}
 console.log('PASS: weighted group contribution model, conserved coin/drop budgets, leader priority, solo XP/guaranteed coins, duplicate gear, overkill, reset and save safety');
})().catch(err=>{console.error(err);process.exitCode=1});
