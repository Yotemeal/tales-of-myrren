const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function registry(){const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/crater-loot-tables.js'),'utf8'),{window});return window.MyrrenCraterLootTables}
test('all eight approved Crater enemies have explicit loot identities',()=>{
 const r=registry();
 assert.deepEqual(Object.keys(r.identity).sort(),['forest_rat','goblin_miner','wild_boar','dire_wolf','goblin_guard','cave_guardian','forest_troll','jewelheart_guardian'].sort());
});
test('preview monster tables preserve existing drop odds and use shared gear roll',()=>{
 const r=registry();
 const t=r.tableFor('goblin',{coins:[5,12],bread:.25,drop:{p:.07,mats:[1,2]}});
 assert.equal(t.id,'goblin_miner');
 assert.equal(t.main[0].weight,2500);
 assert.equal(t.main[1].weight,7500);
 assert.equal(t.bonus[0].chanceBps,700);
 assert.equal(t.bonus[0].tableId,'legacy_equipment');
});
test('boss rehearsal cannot award unapproved uniques or loot',()=>{
 const r=registry();
 assert.equal(r.tableFor('jewelheart',{coins:[1,2],bread:.1,drop:{p:.1}}),null);
 assert.equal(r.bossUniques.length,2);
 assert.ok(r.bossUniques.every(x=>x.status==='pending-rates-and-stats'));
});
