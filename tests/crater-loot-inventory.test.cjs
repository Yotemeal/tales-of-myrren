const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function api(){const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/crater-loot-inventory.js'),'utf8'),{window});return window.MyrrenCraterInventory}
test('coins and bread stack and two duplicate equipment rewards remain separate',()=>{
 const a=api(),inv={coins:5,bread:1},bag=[];
 const p=a.plan([{itemId:'coins',quantity:3},{itemId:'bread',quantity:2},{itemId:'existing_random_gear',quantity:2}],{inventory:inv,canFit:()=>true,resolveGear:()=> 'bronze_sword'});
 a.commit(p,inv,bag);
 assert.equal(inv.coins,8);assert.equal(inv.bread,3);assert.deepEqual(bag,['bronze_sword','bronze_sword']);
});
test('full inventory still accepts existing stacks and rejects new gear',()=>{
 const a=api(),inv={coins:10,bread:2},bag=[];
 const p=a.plan([{itemId:'coins',quantity:1},{itemId:'bread',quantity:1},{itemId:'existing_random_gear',quantity:1}],{inventory:inv,canFit:(stack,gear)=>gear===0,resolveGear:()=> 'bronze_sword'});
 a.commit(p,inv,bag);
 assert.equal(inv.coins,11);assert.equal(inv.bread,3);assert.equal(bag.length,0);assert.equal(p.rejected.length,1);
});
test('invalid loot and overflow do not mutate inventory',()=>{
 const a=api(),inv={coins:Number.MAX_SAFE_INTEGER},bag=[];
 const p=a.plan([{itemId:'coins',quantity:1}],{inventory:inv,canFit:()=>true,resolveGear:()=> 'bronze_sword'});
 assert.throws(()=>a.commit(p,inv,bag),/overflow/);
 assert.equal(inv.coins,Number.MAX_SAFE_INTEGER);assert.equal(bag.length,0);
});
