const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');
const base={v:3,name:'Bank QA',xp:{melee:10000000,mining:10000000},inv:{coins:50000,logs:1000,bread:20},bag:['iron_pick','iron_pick','steel_helm'],eq:{weapon:'steel_sword'},x:745,y:886};
(async()=>{
 const {game:t}=await createGame();t.adoptSave(base);t.me.x=t.SPOTS.bank.x;t.me.y=t.SPOTS.bank.y;assert(t.bankAccess());
 const entry=(kind,id)=>t.inventoryEntries().find(e=>e.kind===kind&&e.id===id);
 assert(t.depositItem(entry('stack','logs'),'all'));assert.equal(t.save.inv.logs,0);assert.equal(t.save.bank.logs,1000);
 assert(t.withdrawItem('logs',5));assert.equal(t.save.inv.logs,5);assert.equal(t.save.bank.logs,995);
 assert(t.withdrawItem('logs','all',true));assert.equal(t.save.notes.logs,995);assert.equal(t.save.bank.logs,undefined);
 assert.equal(t.slotsUsed(),6,'notes use one slot, independent of quantity');
 assert(t.depositItem(entry('note','logs'),10));assert.equal(t.save.notes.logs,985);assert.equal(t.save.bank.logs,10);
 assert(t.depositItem(entry('gear','iron_pick'),'all'));assert.equal(t.save.bank.iron_pick,2);assert.equal(t.save.bag.filter(x=>x==='iron_pick').length,0);
 assert(t.withdrawItem('iron_pick','all',true));assert.equal(t.save.notes.iron_pick,2);
 // Moving an item into an empty position persists through a full save roundtrip.
 let slots=t.inventorySlots();const first=slots.findIndex(Boolean);const key=slots[first].key;assert(t.moveInventorySlot('pack',first,35));assert.equal(t.inventorySlots()[35].key,key);
 const snapshot=JSON.parse(JSON.stringify(t.snap()));t.adoptSave(snapshot);assert.equal(t.inventorySlots()[35].key,key);assert.equal(t.save.notes.iron_pick,2);assert.equal(t.save.bank.logs,10);assert.equal(t.save.inv.coins,50000);
 // Notes can be reconstituted only at the bank, without creating extra items.
 assert(t.depositItem(entry('note','iron_pick'),'all'));assert(t.withdrawItem('iron_pick',1));assert.equal(t.save.bank.iron_pick,1);assert.equal(t.save.bag.filter(x=>x==='iron_pick').length,1);
 t.save.bank.steel_helm=100;t.save.inv={coins:50000};t.save.notes={};t.save.bag=Array(36).fill('iron_pick');assert(!t.withdrawItem('steel_helm',1,true));assert.equal(t.save.bank.steel_helm,100);
 t.save.bag.pop();assert(t.withdrawItem('steel_helm','all',true));assert.equal(t.save.notes.steel_helm,100);assert.equal(t.slotsUsed(),36);
 assert(t.depositItem(entry('note','steel_helm'),'all'));assert(t.withdrawItem('steel_helm',10));assert.equal(t.save.bag.length,36,'normal gear withdrawal stops at free capacity');assert.equal(t.save.bank.steel_helm,99);
 // Moving bank entries swaps slots and survives reload as well.
 t.save.bank.logs=100;t.save.bank.copper=200;slots=t.inventorySlots('bank');const bankFirst=slots.findIndex(Boolean),bankKey=slots[bankFirst].key;assert(t.moveInventorySlot('bank',bankFirst,35));assert.equal(t.inventorySlots('bank')[35].key,bankKey);
 const bankSave=JSON.parse(JSON.stringify(t.snap()));t.adoptSave(bankSave);assert.equal(t.inventorySlots('bank')[35].key,bankKey);
 t.me.x=400;t.me.y=800;assert(!t.bankAccess());assert(!t.withdrawItem('logs',1));assert.equal(t.save.bank.logs,100);
 // Shops accept exact quantities of carried notes, never remote bank contents.
 t.save.notes.logs=100;t.save.inv.coins=50000;
 t.me.x=t.TRADER.x;t.me.y=t.TRADER.y;t.enterBuilding(t.BLD.find(b=>b.id==='axe'),4000);t.openModal('pack');
 const notedLog=t.inventoryEntries().find(e=>e.kind==='note'&&e.id==='logs');
 assert(t.canSellEntry(notedLog));assert(t.sellItemQuantity(notedLog,5));assert.equal(t.save.notes.logs,95);assert(t.save.inv.coins>50000);
 assert(t.sellItemQuantity(notedLog,'all'));assert.equal(t.save.notes.logs,undefined);assert.equal(t.save.bank.logs,100);
 console.log('PASS: exact-quantity bank transfers, note conversion, gear aggregation, 36-slot limits, saved drag positions and proximity checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
