'use strict';
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');
const KEY='ember-reach-v2';
const local={v:3,ts:100,name:'Keep this character',xp:{melee:500},inv:{coins:9876,logs:42},bag:['bronze_sword'],eq:{},x:800,y:840};
const descendants=node=>[node,...(node.children||[]).flatMap(descendants)];
(async()=>{
  for(const invalid of [{xp:'not a character'},{xp:[]},{xp:0},{xp:null},[],null]){
    const runtime=await createGame({[KEY]:JSON.stringify(local)});
    runtime.game.openModal('settings');
    const nodes=descendants(runtime.elements.get('mBody'));
    const box=nodes.find(node=>node.rows===3),restore=nodes.find(node=>node.innerHTML==='Restore code');
    assert(box&&restore,'real Settings save controls must be available');
    const before=runtime.memory.get(KEY);
    box.value='ER1.'+Buffer.from(JSON.stringify(invalid)).toString('base64');restore.click();
    assert.equal(runtime.game.save.inv.coins,9876,'malformed save code cannot erase currency');
    assert.equal(runtime.game.save.inv.logs,42,'malformed save code cannot erase inventory');
    assert.equal(runtime.game.save.xp.melee,500,'malformed save code cannot reset XP');
    assert.deepEqual(runtime.game.save.bag,['bronze_sword']);
    assert.equal(runtime.memory.get(KEY),before,'rejected import leaves the persisted save intact');
    assert.equal(runtime.elements.get('toast').textContent,'That code is not valid');
  }
  const runtime=await createGame({[KEY]:JSON.stringify(local)});
  runtime.game.openModal('settings');
  const nodes=descendants(runtime.elements.get('mBody'));
  nodes.find(node=>node.rows===3).value='ER1.'+Buffer.from(JSON.stringify({...local,name:'Imported QA',inv:{coins:321}})).toString('base64');
  nodes.find(node=>node.innerHTML==='Restore code').click();
  assert.equal(runtime.game.save.name,'Imported QA');assert.equal(runtime.game.save.inv.coins,321);
  assert.equal(JSON.parse(runtime.memory.get(KEY)).inv.coins,321,'valid save code still persists the restored character');
  console.log('PASS: malformed import codes preserve inventory/XP/storage; valid character codes restore successfully.');
})().catch(error=>{console.error(error);process.exitCode=1});
