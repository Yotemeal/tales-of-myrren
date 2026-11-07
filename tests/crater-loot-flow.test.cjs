const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function setup(){
 const window={};const context=vm.createContext({window});
 for(const file of ['crater-loot-preview.js','crater-loot-tables.js','crater-loot-inventory.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),context,{filename:file});
 }
 return window;
}
test('Crater kill-to-inventory preview: guaranteed coins, bread, gear, and respawn',()=>{
 const w=setup(),monster={dieAt:100},inv={coins:10,bread:0},bag=[];
 const mt={coins:[4,4],bread:1,drop:{p:1,mats:[2]}};
 const table=w.MyrrenCraterLootTables.tableFor('rat',mt);
 const award=w.MyrrenCraterLoot.create();
 function grant(drops){
  const plan=w.MyrrenCraterInventory.plan(drops,{inventory:inv,gear:bag,canFit:()=>true,resolveGear:()=> 'iron_sword'});
  w.MyrrenCraterInventory.commit(plan,inv,bag);
 }
 function settle(){
  return award.award(monster,{...table,guaranteed:[{itemId:'coins',quantity:4}]},grant,()=>0,w.MyrrenCraterLootTables.sharedTables);
 }
 assert.equal(settle(),true);assert.equal(settle(),false);
 assert.equal(inv.coins,14);assert.equal(inv.bread,1);assert.deepEqual(bag,['iron_sword']);
 monster.dieAt=200;assert.equal(settle(),true);
 assert.equal(inv.coins,18);assert.equal(inv.bread,2);assert.deepEqual(bag,['iron_sword','iron_sword']);
});
test('Crater kill-to-inventory preview: full bag retains coin stack and rejects gear',()=>{
 const w=setup(),monster={dieAt:100},inv={coins:10,bread:0},bag=['iron_sword'];
 const table=w.MyrrenCraterLootTables.tableFor('wolf',{coins:[3,3],bread:0,drop:{p:1,mats:[2]}});
 let rejected;
 w.MyrrenCraterLoot.create().award(monster,{...table,guaranteed:[{itemId:'coins',quantity:3}]},drops=>{
  const plan=w.MyrrenCraterInventory.plan(drops,{inventory:inv,gear:bag,canFit:(stack,extra)=>extra===0,resolveGear:()=> 'iron_sword'});
  rejected=plan.rejected;
  w.MyrrenCraterInventory.commit(plan,inv,bag);
 },()=>0,w.MyrrenCraterLootTables.sharedTables);
 assert.equal(inv.coins,13);assert.equal(bag.length,1);assert.equal(rejected.length,1);
});
