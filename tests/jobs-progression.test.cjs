'use strict';
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g}=await createGame();
  const character={v:3,ts:1,name:'Jobs QA',xp:{woodcutting:2e9,mining:2e9,melee:2e9},inv:{logs:8},eq:{},bag:[],tokens:1000,x:800,y:840};
  g.adoptSave(character);
  const realNow=Date.now,realRandom=Math.random;
  Date.now=()=>1_234_567;Math.random=()=>.5;
  try{
    // Multiple offers are generated in the same millisecond. Their identifiers
    // must not depend on a lucky random draw, or claim/drop can remove siblings.
    g.genOffers();
    const offers=g.getBoardOffers().slice();
    assert.equal(new Set(offers.map(job=>job.id)).size,3,'same-tick offers have distinct IDs even when random values repeat');
    assert.equal(g.acceptJob(offers[0]),true);
    const accepted=JSON.stringify(g.save.jobs);
    assert.equal(g.acceptJob(offers[0]),false,'the same slip cannot be accepted a second time');
    assert.equal(JSON.stringify(g.save.jobs),accepted,'repeated acceptance preserves existing job progress');
    g.genOffers();
    assert(!g.getBoardOffers().some(job=>job.id===g.save.jobs[0].id),'new slips cannot reuse an accepted job ID');
    assert.equal(g.acceptJob(offers[1]),false,'a slip replaced by New slips is no longer available');
  }finally{Date.now=realNow;Math.random=realRandom}

  const job=(id,have=0)=>({id,bracket:'early',tokens:3,xp:{woodcutting:20},done:have===4,
    objs:[{type:'deliver',skill:'woodcutting',item:'logs',need:4,have}]});
  g.adoptSave({...character,jobs:[job('legacy-duplicate',4),job('legacy-duplicate',1),job('legacy-duplicate-')]});
  assert.equal(new Set(g.save.jobs.map(j=>j.id)).size,3,'legacy duplicate job IDs recover without losing any slip');
  const secondId=g.save.jobs[1].id;
  g.claimJob(g.save.jobs[0].id);
  assert.equal(g.save.tokens,1003,'completed slip pays its tokens once');
  assert.equal(g.save.xp.woodcutting,character.xp.woodcutting+20,'completed slip pays its XP once');
  assert.equal(g.save.jobs.length,2,'claiming one legacy slip retains other slips');
  assert.equal(g.save.jobs.find(j=>j.id===secondId).objs[0].have,1,'claiming retains sibling partial delivery');
  g.claimJob('legacy-duplicate');
  assert.equal(g.save.tokens,1003,'repeated claim does not duplicate rewards');
  g.dropJob(secondId);
  assert.equal(g.save.jobs.length,1,'dropping one slip retains the other legacy slip');

  g.adoptSave({...character,jobs:[job('first'),job('second')]});
  g.supplyDeposit();
  assert.equal(g.save.inv.logs,0,'supply crate consumes each carried item once');
  assert(g.save.jobs.every(j=>j.done),'separate deliveries complete after consuming their own items');
  for(const j of g.save.jobs.slice())g.claimJob(j.id);
  assert.equal(g.save.tokens,1006,'both distinct completed deliveries pay once');
  assert.equal(g.save.xp.woodcutting,character.xp.woodcutting+40);

  const pouch=g.ODD.find(it=>it.id==='coal_pouch'),perk=g.ODD.find(it=>it.id==='secateurs');
  g.adoptSave({...character,bank:{coal_pouch:1}});
  g.oddBuy(pouch);
  assert.equal(g.save.tokens,1000,'banking a unique pouch cannot make the player buy it again');
  assert.equal(g.save.inv.coal_pouch,0);assert.equal(g.save.bank.coal_pouch,1);
  g.adoptSave(character);
  g.oddBuy(perk);g.oddBuy(perk);
  assert.equal(g.save.tokens,1000-perk.cost,'repeated utility-perk activation cannot spend tokens twice');
  assert.equal(g.save.perks.secateurs,true);
  g.oddBuy(pouch);g.oddBuy(pouch);
  assert.equal(g.save.tokens,1000-perk.cost-pouch.cost,'carried utility item is charged once');
  assert.equal(g.save.inv.coal_pouch,1);
  console.log('PASS: distinct job slips, stale/duplicate acceptance, legacy ID recovery, single-use delivery/rewards and unique utility purchases across bank storage.');
})().catch(error=>{console.error(error);process.exitCode=1});
