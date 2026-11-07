const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../public/crater-loot-preview.js'),'utf8');
function api(){const window={};vm.runInNewContext(src,{window});return window.MyrrenCraterLoot}
test('guaranteed coins, weighted bread and independent gear together',()=>{
 const loot=api(),m={dieAt:100},awards=[];
 const table={guaranteed:[{itemId:'coins',quantity:7}],main:[{itemId:'bread',weight:2500},{itemId:'nothing',weight:7500}],bonus:[{itemId:'existing_random_gear',chanceBps:700}]};
 assert.equal(loot.create().award(m,table,d=>awards.push(...d),()=>0),true);
 assert.deepEqual(awards.map(d=>d.itemId),['coins','bread','existing_random_gear']);
});
test('same death only settles once; respawn death can roll again',()=>{
 const loot=api().create(),m={dieAt:100};let count=0;
 const table={guaranteed:[{itemId:'coins',quantity:1}]};
 assert.equal(loot.award(m,table,()=>count++),true);
 assert.equal(loot.award(m,table,()=>count++),false);
 m.dieAt=200;
 assert.equal(loot.award(m,table,()=>count++),true);
 assert.equal(count,2);
});
test('weighted nothing outcome can still award guaranteed coins',()=>{
 const loot=api(),table={guaranteed:[{itemId:'coins',quantity:2}],main:[{itemId:'bread',weight:1},{itemId:'nothing',weight:9}],bonus:[{itemId:'gear',chanceBps:100}]};
 assert.deepEqual(Array.from(loot.roll(table,()=>0.99),x=>x.itemId),['coins']);
});

test('browser shared tables roll nested rewards without replacing guaranteed coins',()=>{
 const loot=api(),shared={rare:{guaranteed:[{itemId:'guardian_ring',quantity:1}]}};
 const table={guaranteed:[{itemId:'coins',quantity:3}],bonus:[{tableId:'rare',chanceBps:10000,quantity:2}]};
 assert.deepEqual(Array.from(loot.roll(table,()=>0,shared),d=>d.itemId),['coins','guardian_ring','guardian_ring']);
});
test('browser rejects unknown and circular shared table references',()=>{
 const loot=api();
 assert.throws(()=>loot.roll({main:[{tableId:'missing',weight:1}]},()=>0),/Unknown shared/);
 const shared={a:{guaranteed:[{tableId:'b'}]},b:{guaranteed:[{tableId:'a'}]}};
 assert.throws(()=>loot.roll({guaranteed:[{tableId:'a'}]},()=>0,shared),/Circular shared/);
});
test('browser rejects invalid bonus probabilities',()=>{
 assert.throws(()=>api().roll({bonus:[{itemId:'ring',chanceBps:10001}]}),/Invalid bonus odds/);
});
