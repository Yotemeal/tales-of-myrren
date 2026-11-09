'use strict';
// Furnace/anvil batch production: real inventory, XP, cooldown and cancel safety.
// Run: node tests/smithing-batch.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,memory,elements}=await createGame();
  const oldNow=Date.now;let clock=1_000_000;Date.now=()=>clock;
  try{
    const furnace=g.VILLAGE.stations.find(s=>s.kind==='furnace');
    const anvil=g.VILLAGE.stations.find(s=>s.kind==='anvil');
    assert(furnace&&anvil,'existing world has working furnace and anvil stations');
    g.me.x=furnace.x;g.me.y=furnace.y;
    g.save.xp.forging=g.xpTable[65];
    g.save.inv.copper=12;g.save.inv.tin=12;
    g.save.inv.ing_bronze=0;
    g.openSmithy('furnace');
    assert.equal(g.getTab(),'smelt','furnace must use a dedicated smelting screen');
    assert.equal(elements.get('modal').dataset.screen,'smelt','furnace screen is not the merchant shop');
    assert.equal(elements.get('mTitle').textContent,'Furnace · Smelting');
    assert.equal(g.curShop(),null,'furnace must not activate a merchant shop');
    const furnaceRows=elements.get('mBody').children;
    assert(!furnaceRows.some(row=>row.className==='shophead'),'furnace must have no merchant banner or coin totals');
    assert(furnaceRows.some(row=>row.className==='smith-work'),'furnace must retain the smelting production controls');
    assert.equal(g.smithMaximum('smelt','bronze'),12,'batch capacity derives from available ore');
    g.setSmithQuantity(5);
    assert(g.startSmithing('smelt','bronze'));
    assert.equal(g.getSmithJob().total,5);
    const beforeXp=g.save.xp.forging;
    assert.equal(g.save.inv.ing_bronze,0,'batch starts its animation before consuming materials');
    clock+=1499;g.smithingTick(clock);
    assert.equal(g.save.inv.ing_bronze,0,'no production before the 1.5-second smelt interval');
    clock++;g.smithingTick(clock);
    assert.equal(g.save.inv.ing_bronze,1,'first ingot is forged when interval ends');
    assert.equal(g.save.xp.forging-beforeXp,g.SMELT[0].xp,'first smelt awards the balanced ingot XP');
    assert.equal(g.save.inv.copper,11);assert.equal(g.save.inv.tin,11);
    for(let i=0;i<4;i++){clock+=1500;g.smithingTick(clock)}
    assert.equal(g.getSmithJob(),null,'selected five-bar batch completes');
    assert.equal(g.save.inv.ing_bronze,5);
    assert.equal(g.save.inv.copper,7);
    assert.equal(g.save.inv.tin,7);
    assert.equal(g.save.xp.forging-beforeXp,5*g.SMELT[0].xp,'batch gives exact per-ingot XP, never a shortcut bonus');
    assert.equal(JSON.parse(memory.get('ember-reach-v2')).inv.ing_bronze,5,'batch outputs persist normally');

    // All respects available ores and still stops automatically.
    g.save.inv.copper=3;g.save.inv.tin=3;
    g.setSmithQuantity('all');
    assert(g.startSmithing('smelt','bronze'));
    assert.equal(g.getSmithJob().total,3,'All is bounded by current resources');
    for(let i=0;i<3;i++){clock+=1500;g.smithingTick(clock)}
    assert.equal(g.save.inv.ing_bronze,8);
    assert.equal(g.getSmithJob(),null);

    // Closing the window must stop immediately and cannot craft while hidden.
    g.save.inv.copper=10;g.save.inv.tin=10;
    g.setSmithQuantity(10);
    assert(g.startSmithing('smelt','bronze'));
    g.closeModal();
    assert.equal(g.getSmithJob(),null,'closing the workstation cancels production');
    clock+=5000;g.smithingTick(clock);
    assert.equal(g.save.inv.ing_bronze,8,'closed menu cannot continue crafting');

    // Forged batch items stay in the pack, not automatically put on the player.
    g.me.x=anvil.x;g.me.y=anvil.y;g.openSmithy('anvil');
    assert.equal(g.getTab(),'shop','anvil retains its existing forging screen');
    assert.equal(elements.get('modal').dataset.screen,'shop');
    assert(g.curShop(),'anvil still accesses its existing blacksmith shop');
    assert(elements.get('mBody').children.some(row=>row.className==='shophead'),'blacksmith shop banner remains available at the anvil');
    g.setForgeMat(2);
    g.save.inv.ing_bronze=20;
    g.setSmithQuantity(2);
    assert(g.smithMaximum('forge','sword')>=2);
    const bagBefore=g.save.bag.length,forgingBefore=g.save.xp.forging,equipped=g.save.eq.weapon;
    assert(g.startSmithing('forge','sword'));
    clock+=2499;g.smithingTick(clock);
    assert.equal(g.save.bag.length,bagBefore,'forge interval cannot be skipped');
    clock++;g.smithingTick(clock);
    assert.equal(g.save.bag.length,bagBefore+1);
    clock+=2500;g.smithingTick(clock);
    assert.equal(g.getSmithJob(),null);
    assert.equal(g.save.bag.length,bagBefore+2);
    assert.deepEqual(g.save.bag.slice(-2),['bronze_sword','bronze_sword'],'batch preserves duplicate crafted gear');
    assert.equal(g.save.inv.ing_bronze,12,'each sword consumes four bars');
    assert.equal(g.save.eq.weapon,equipped,'batch crafting does not change player equipment');
    assert.equal(g.save.xp.forging-forgingBefore,2*Math.round(g.SMELT[0].xp*1.5*4),'forge batch preserves the balanced per-item XP');

    // Moving away or exhausting supplies cannot continue consuming materials.
    g.me.x=furnace.x;g.me.y=furnace.y;g.openSmithy('furnace');
    g.save.inv.copper=4;g.save.inv.tin=4;g.setSmithQuantity(4);
    assert(g.startSmithing('smelt','bronze'));
    g.me.x+=75;
    clock+=1500;g.smithingTick(clock);
    assert.equal(g.getSmithJob(),null,'walking away from the station cancels safely');
    assert.equal(g.save.inv.copper,4,'no remote crafting after leaving the station');

    // No raw-material recipe may become available merely by selecting it.
    g.me.x=furnace.x;g.me.y=furnace.y;g.openSmithy('furnace');
    g.save.xp.forging=0;
    assert.equal(g.smithMaximum('smelt','aether'),0,'locked tiers remain locked');
    assert.equal(g.startSmithing('smelt','aether'),false,'invalid recipe cannot start');
    assert.equal(g.getSmithJob(),null);

    assert(!Object.hasOwn(g.snap(),'smithJob'),'temporary queue is never written into the player save');
    assert(fs.readFileSync('public/myrren-game.js','utf8').includes("forging:'Smithing'"),'UI calls it Smithing without changing save identifiers');
    const css=fs.readFileSync('public/myrren-ui.css','utf8');
    assert(css.includes('.smith-progress'),'progress bar is styled');
    assert(css.includes('#modal[data-screen="smelt"] .window-footer { display:none; }'),'furnace hides shop currency and token footer');
    assert(css.includes('#modal:is([data-screen="shop"],[data-screen="smelt"]) .smith-work'),'smelt-specific controls keep their styling');
    const source=fs.readFileSync('public/myrren-game.js','utf8');
    assert(!source.includes('Smelt:[]'),'blacksmith merchant categories do not sell smelting');
    assert(source.includes('smelt:rSmelt'),'furnace must render without executing rShop');
    console.log('PASS: furnace and anvil batches, one-at-a-time intervals, real XP and materials, All, duplicates, cancel, skill gates and saved progress.');
  }finally{Date.now=oldNow}
})().catch(e=>{console.error(e);process.exitCode=1});
