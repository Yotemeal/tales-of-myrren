const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');
const KEY='ember-reach-v2';
const model={v:3,ts:100,name:'Kez',xp:{melee:10000000,mining:10000000,woodcutting:10000000,fishing:10000000,cooking:10000000},inv:{coins:98765,bread:10},bag:['iron_pick'],eq:{body:'steel_body',weapon:'iron_pick'},tokens:3000000000};
(async()=>{
 const {game:t,memory}=await createGame({[KEY]:'{damaged',[KEY+'-bak']:JSON.stringify(model)});
 assert.equal(t.save.name,'Kez','damaged primary falls back to backup');
 assert.equal(t.save.inv.coins,98765);assert.equal(t.save.tokens,3000000000,'large token balances do not wrap negative');
 t.persist();assert.equal(JSON.parse(memory.get(KEY+'-bak')).inv.coins,98765,'damaged primary must not overwrite good backup');
 assert.equal(JSON.parse(memory.get(KEY)).name,'Kez');
 t.applySave({...model,bag:Array(40).fill('iron_pick')});assert.equal(t.save.bag.length,40,'legacy overflow is retained');
 assert(t.canFitInventory({bread:1}),'overflow can stack existing items');assert(!t.canFitInventory({logs:1}),'overflow cannot gain a new stack');
 // Full-bag transactions must count the ingredients they consume.
 t.applySave({...model,inv:{coins:98765,copper:5,tin:5},bag:Array(34).fill('iron_pick')});
 assert.equal(t.slotsUsed(),36);const copper=t.save.inv.copper;
 t.smelt(t.SMELT[0]);assert.equal(t.save.inv.copper,copper,'failed smelt keeps ingredients');assert.equal(t.save.inv.ing_bronze,0);
 t.save.inv.copper=1;t.smelt(t.SMELT[0]);assert.equal(t.save.inv.ing_bronze,1,'last consumed ingredient frees a slot');assert.equal(t.slotsUsed(),36);
 // Cooking can replace the last raw fish, but cannot open a 37th stack.
 t.applySave({...model,inv:{coins:98765,rshrimp:2},bag:Array(35).fill('iron_pick')});
 t.beginAct('cook',{});t.getAct().started=true;t.cookTick(2,1000);assert.equal(t.save.inv.rshrimp,2,'full-bag cooking keeps raw fish');assert.equal(t.getAct(),null);
 assert(t.canFitInventory({rshrimp:-1,shrimp:1})===false);t.save.inv.rshrimp=1;assert(t.canFitInventory({rshrimp:-1,shrimp:1}));
 // Gathering must stop before spending a tool use or adding an extra stack.
 t.applySave({...model,inv:{coins:98765},bag:Array(36).fill('iron_pick')});
 const node={k:'copper',x:t.me.x,y:t.me.y+10,back:0};t.beginAct('node',node);t.doAction(2,2000);
 assert.equal(t.save.inv.copper,0);assert.equal(t.getAct(),null);assert(!('wear' in t.save),'durability data is no longer part of active character state');
 // Combat still pays gold when no item slots are free.
 t.applySave({...model,inv:{coins:1000},bag:Array(36).fill('iron_pick')});
 t.killMon({t:'slime',x:900,y:900},3000);
 assert(t.save.inv.coins>1000);assert.equal(t.save.inv.bread,0);assert.equal(t.save.bag.length,36);
 // A coal pouch crossing 100 coal needs a real new slot.
 t.save.inv.coal_pouch=1;t.save.inv.coal=100;t.save.bag=Array(35).fill('iron_pick');
 assert(!t.canFitInventory({coal:1}));assert(t.canFitInventory({coins:100}));
 // Bad numeric inventory values cannot corrupt rendering or arithmetic.
 t.applySave({...model,inv:{coins:'17',bread:Infinity,copper:-3},xp:{melee:NaN}});
 assert.equal(t.save.inv.coins,17);assert.equal(t.save.inv.bread,0);assert.equal(t.save.inv.copper,0);assert.equal(t.save.xp.melee,0);
 console.log('PASS: backup recovery, large balances, legacy overflow, transactional smelting/cooking, full-bag gathering, pouch boundaries and numeric normalization.');
})().catch(e=>{console.error(e);process.exitCode=1});
