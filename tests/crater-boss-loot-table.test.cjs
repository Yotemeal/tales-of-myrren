const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/crater-boss-loot-table.js'),'utf8'),{window});
const t=window.MyrrenJewelheartLootProposal;
test('Jewelheart loot is a non-live balance proposal',()=>{
 assert.equal(t.bossId,'jewelheart_guardian');
 assert.equal(t.status,'balance-proposal');
});
test('boss proposes guaranteed money and existing low-tier ores',()=>{
 assert.equal(t.guaranteed[0].itemId,'coins');
 assert.ok(t.guaranteed[0].min>0);
 assert.deepEqual(Array.from(t.main,x=>x.itemId),['copper','tin','iron','coal']);
 assert.equal(t.main.reduce((n,x)=>n+x.weight,0),100);
});
test('steel equipment and both jewellery items have independent rare entries',()=>{
 const ids=Array.from(t.bonus,x=>x.itemId);
 for(const id of ['steel_sword','steel_helm','steel_body','steel_legs','steel_shield','guardians_necklace','guardians_ring'])assert.ok(ids.includes(id));
 assert.ok(t.bonus.filter(x=>x.itemId.startsWith('steel_')).every(x=>Number.isInteger(x.chanceBps)&&x.chanceBps>0&&x.chanceBps<=10000));
 for(const id of ['guardians_necklace','guardians_ring']){
  const item=t.bonus.find(x=>x.itemId===id);
  assert.equal(item.chanceNumerator,1);
  assert.equal(item.chanceDenominator,150);
 }
});
