const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function api(){const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/crater-boss-reward-schema.js'),'utf8'),{window});return window.MyrrenBossRewardSchema}
const proposed=()=>({bossId:'jewelheart_guardian',approved:true,uniques:[
 {itemId:'guardians_necklace',chanceBps:100,stats:{strength:1}},
 {itemId:'guardians_ring',chanceBps:100,stats:{defence:1}}
]});
test('future approved boss config schema accepts complete example without activating it',()=>{
 assert.equal(api().validate(proposed()),true);
});
test('missing approval and rates are rejected',()=>{
 const a=api(),p=proposed();p.approved=false;assert.throws(()=>a.validate(p),/approval/);
 const q=proposed();delete q.uniques[0].chanceBps;assert.throws(()=>a.validate(q),/odds/);
});
test('missing stats, duplicate uniques and wrong boss are rejected',()=>{
 const a=api(),p=proposed();p.uniques[0].stats={};assert.throws(()=>a.validate(p),/stats/);
 const q=proposed();q.uniques[1].itemId='guardians_necklace';assert.throws(()=>a.validate(q),/duplicate/);
 const t=proposed();t.bossId='forest_troll';assert.throws(()=>a.validate(t),/Wrong boss/);
});
