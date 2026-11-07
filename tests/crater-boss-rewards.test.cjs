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
 const boss=api().create(),result=boss.settle({killId:'boss-1',eligible:true,ironmanOwner:true,contributor:true});
 assert.equal(result.status,'preview-only');
 assert.equal(result.drops.length,0);
});
test('boss progression cannot be activated without approved reward design',()=>{
 assert.throws(()=>api().create({enabled:true,table:{},grant:()=>{}}),/not approved/);
});

test('boss rewards reject non-contributors and non-owner Ironman kills',()=>{
 const boss=api().create(),id='jewelheart-kill-2';
 assert.equal(boss.evaluate({killId:id,eligible:true,ironmanOwner:true,contributor:false}).status,'ineligible');
 assert.equal(boss.evaluate({killId:id,eligible:true,ironmanOwner:false,contributor:true}).status,'ineligible');
 assert.equal(boss.evaluate({killId:id,eligible:false,ironmanOwner:true,contributor:true}).status,'ineligible');
 assert.equal(boss.evaluate({killId:id,eligible:true,ironmanOwner:true,contributor:true}).status,'preview-only');
});
test('wrong boss identity and missing kill ID are rejected',()=>{
 const boss=api().create();
 assert.equal(boss.evaluate({killId:'other-1',bossId:'forest_troll',eligible:true,ironmanOwner:true,contributor:true}).status,'wrong-boss');
 assert.throws(()=>boss.evaluate({killId:''}),/Stable boss kill ID/);
});
test('preview rehearsals never settle or consume a boss reward claim',()=>{
 const boss=api().create(),args={killId:'jewelheart-3',eligible:true,ironmanOwner:true,contributor:true};
 assert.equal(boss.settle(args).status,'preview-only');
 assert.equal(boss.settle(args).status,'preview-only');
});
