const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function api(){const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/crater-boss-rewards.js'),'utf8'),{window});return window.MyrrenJewelheartRewards}
test('Jewelheart is the only boss reward identity and uniques remain unapproved',()=>{
 const boss=api();
 assert.equal(boss.bossId,'jewelheart_guardian');
 assert.deepEqual(Array.from(boss.uniques,u=>u.itemId),['guardians_necklace','guardians_ring']);
 assert.ok(boss.uniques.every(u=>u.approved===false));
});
test('boss rehearsal never grants rewards',()=>{
 const boss=api().create(),result=boss.settle({killId:'boss-1'});
 assert.equal(result.status,'preview-only');
 assert.equal(result.drops.length,0);
});
test('boss progression cannot be activated without approved reward design',()=>{
 assert.throws(()=>api().create({enabled:true,table:{},grant:()=>{}}),/not approved/);
});
