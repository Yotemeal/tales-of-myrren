'use strict';
// Complete armour, shield and sword material plans are advisory only.
// Real batch crafting still consumes each bar, awards current XP and
// preserves gear, inventory and character saves.
// Run: node tests/full-set-smithing-plan.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
 const {game:g,elements}=await createGame();
 const kinds=['helm','body','gloves','legs','boots','shield'];
 const oldNow=Date.now,oldRandom=Math.random;
 let clock=4_000_000;
 Date.now=()=>clock;
 Math.random=()=>.5; // no pet XP unlocks during exact material testing
 try{
   assert.deepEqual(Array.from(g.ARMOUR_SET_KINDS),kinds);
   assert.equal(kinds.reduce((sum,k)=>sum+g.FORGE[k],0),28,
     'complete armour plus shield should require 28 ingots');
   assert.equal(g.FORGE.sword,4);
   for(const r of g.SMELT){
     const armour=g.equipmentSetPlan(r.mat);
     const withSword=g.equipmentSetPlan(r.mat,true);
     assert(armour&&withSword,'a complete plan exists at every metal tier');
     assert.equal(armour.pieces.length,6);
     assert.equal(armour.totalBars,28);
     assert.equal(armour.barsNeeded,28,'new player requires all 28 bars');
     assert.equal(armour.barsToSmelt,28);
     assert.equal(armour.levelRequired,r.req+8,'platebody is last armour Smithing unlock');
     assert.equal(withSword.totalBars,32);
     assert.equal(withSword.pieces.length,7);
     assert.equal(withSword.levelRequired,r.req+8,
       'including the sword does not raise the final Smithing gate');
     assert.equal(armour.totalForgeXp,28*r.forgeXpPerBar,
       'forging XP is based on actual ingot cost');
     assert.equal(armour.totalSmeltXp,28*r.xp,
       'furnace XP is based on the exact number of bars');
     for(const ore of armour.ores){
       assert.equal(ore.needed,28*r.in[ore.id],
         'full-set ore requirement uses existing recipe: '+r.id+'/'+ore.id);
       assert.equal(ore.missing,ore.needed);
     }
     const ids=new Set(armour.pieces.map(p=>p.id));
     assert.equal(ids.size,6,'no duplicate equipment slot in the planner');
     for(const p of armour.pieces){
       assert(g.DEFS[p.id],'plan must point to real forgeable equipment');
       assert.equal(p.bars,g.FORGE[p.kind]);
       assert.equal(p.level,g.forgeReq(r,p.kind));
       assert.equal(p.owned,false);
     }
   }
   assert.equal(g.equipmentSetPlan(1),null,'no invented leather smithing recipes');

   const star=g.SMELT.find(r=>r.id==='starsteel');
   assert(star,'starsteel recipe remains available');
   assert.deepEqual(Object.fromEntries(g.equipmentSetPlan(star.mat).ores.map(o=>[o.id,o.needed])),
     {meteorite:84,coal:112});
   assert.deepEqual(Object.fromEntries(g.equipmentSetPlan(6).ores.map(o=>[o.id,o.needed])),
     {aether:112,coal:84});
   assert.deepEqual(Object.fromEntries(g.equipmentSetPlan(5).ores.map(o=>[o.id,o.needed])),
     {cobalt:84,coal:56});

   // Existing gear in worn slots, backpack or bank counts as already owned.
   // Carried/banked bars are consumed in the plan before raw ingredients;
   // banknotes also represent transferable resources but cannot smelt directly.
   g.save.eq.head='starsteel_helm';
   g.save.bag.push('starsteel_body');
   g.save.bank.starsteel_gloves=1;
   g.save.bank.starsteel_shield=1;
   g.save.inv.ing_starsteel=3;
   g.save.bank.ing_starsteel=2;
   g.save.inv.meteorite=4;
   g.save.bank.meteorite=3;
   g.save.notes.meteorite=2;
   g.save.inv.coal=8;
   g.save.bank.coal=4;
   let plan=g.equipmentSetPlan(star.mat);
   assert.equal(plan.pieces.length-plan.missing.length,4);
   assert.deepEqual(plan.missing.map(p=>p.kind),['legs','boots']);
   assert.equal(plan.barsNeeded,9,'only missing legs and boots need bars');
   assert.equal(plan.heldBars,3);
   assert.equal(plan.bankBars,2);
   assert.equal(plan.barsToSmelt,4);
   assert.equal(plan.remainingLevel,star.req+7,'legs are highest outstanding Smithing gate');
   assert.deepEqual(plan.ores.map(o=>[o.id,o.needed,o.available,o.missing]),
     [['meteorite',12,9,3],['coal',16,12,4]]);
   const swordPlan=g.equipmentSetPlan(star.mat,true);
   assert.equal(swordPlan.barsNeeded,13,'sword is not yet owned');
   assert.equal(swordPlan.barsToSmelt,8);
   assert.equal(swordPlan.ores[0].needed,24,'sword adds four bars of ingredients');
   g.save.eq.weapon='starsteel_sword';
   assert.equal(g.equipmentSetPlan(star.mat,true).barsNeeded,9,
     'equipped sword satisfies optional seventh piece');
   g.save.eq.weapon=null;

   // The actual anvil menu remains a separate screen without any shop header.
   const anvil=g.VILLAGE.stations.find(s=>s.kind==='anvil');
   g.me.x=anvil.x;g.me.y=anvil.y;g.setForgeMat(star.mat);
   g.openSmithy('anvil');
   assert.equal(g.getTab(),'forge');
   assert.equal(g.curShop(),null);
   const planPanel=elements.get('mBody').children.find(c=>c.className==='forge-set-plan');
   assert(planPanel,'anvil has a compact full-set breakdown');
   assert.equal(planPanel.open,false,'details collapsed by default to minimise screen clutter');
   assert(planPanel.children[0].innerHTML.includes('4/6 owned'));
   assert(planPanel.children[0].innerHTML.includes('9 ingots needed'));
   assert(planPanel.children[1].children.some(c=>c.className==='forge-set-line'),
     'expanded details contain individual missing/present gear lines');
   assert(!elements.get('mBody').children.some(c=>c.className==='shophead'),
     'anvil must not gain any merchant UI');
   assert(!elements.get('mBody').children.some(c=>c.className==='smith-shop'),
     'full-set planner never replaces regular forging controls');
   assert(elements.get('mBody').children.some(c=>c.className==='smith-work'),
     'regular one-recipe forging controls are unchanged');

   // Work through the COMPLETE six-piece Starsteel set using the real queued
   // anvil actions. Material and XP checks are based on actual creations.
   g.closeModal();
   g.save.eq.head=null;g.save.bag.length=0;
   g.save.bank.starsteel_gloves=0;g.save.bank.starsteel_shield=0;
   g.save.inv.ing_starsteel=28;g.save.bank.ing_starsteel=0;
   g.save.xp.forging=g.xpTable[80];
   const startingXp=g.save.xp.forging;
   g.openSmithy('anvil');
   g.setSmithQuantity(1);
   for(const kind of kinds){
     const beforeBars=g.save.inv.ing_starsteel;
     const beforeBag=g.save.bag.length;
     assert(g.startSmithing('forge',kind),'start '+kind+' at the real anvil');
     clock+=2500;
     g.smithingTick(clock);
     assert.equal(g.getSmithJob(),null,'one item finishes per queue');
     assert.equal(g.save.inv.ing_starsteel,beforeBars-g.FORGE[kind],
       'exact bar cost for '+kind);
     assert.equal(g.save.bag.length,beforeBag+1,
       'finished gear goes to the real backpack');
     assert.equal(g.save.bag.at(-1),'starsteel_'+kind);
   }
   assert.equal(g.save.inv.ing_starsteel,0);
   assert.equal(g.save.xp.forging-startingXp,28*star.forgeXpPerBar,
     'full set awards only the current per-bar forging XP');
   plan=g.equipmentSetPlan(star.mat);
   assert.equal(plan.missing.length,0,'finished set is recognised from saved backpack items');
   assert.equal(plan.barsToSmelt,0,'completed set requires no further materials');
   assert(plan.ores.every(o=>o.needed===0&&o.missing===0));
   const saveText=JSON.stringify(g.snap());
   assert(!saveText.includes('forgePlanExpanded')&&!saveText.includes('forgePlanWithSword'),
     'material planner presentation state must not enter player saves');
   assert(!saveText.includes('equipmentSetPlan'),'planner must not add a save field');

   const css=fs.readFileSync('public/myrren-ui.css','utf8');
   assert(css.includes('#modal[data-screen="forge"] .forge-set-plan'),
     'compact planner CSS is scoped only to the anvil');
   assert(css.includes('.forge-set-summary:focus-visible'),
     'keyboard/gamepad focus remains readable');
   console.log('PASS: seven full-set ore budgets, owned/banked/noted deductions, compact anvil UI, exact six-item production, XP, bag space and save parity');
 }finally{Date.now=oldNow;Math.random=oldRandom}
})().catch(e=>{console.error(e);process.exitCode=1});
