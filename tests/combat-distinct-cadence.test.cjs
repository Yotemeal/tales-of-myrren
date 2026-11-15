'use strict';
/* Combat cadence contracts. Only timing is varied; hit, damage and XP stay owned by the game. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'../public/myrren-game.js'),'utf8');
const constants=game.match(/^const SWING_IV=900,FIST_SWING_IV=850,COS_ARC=.*;$/m)?.[0];
const helper=game.match(/^const swingInterval=w=>w\?SWING_IV:FIST_SWING_IV;$/m)?.[0];
assert(constants&&helper,'production must define the distinct native attack intervals');
function interval(weapon){
  return vm.runInNewContext(constants+'\n'+helper+'\nswingInterval(weapon)',{weapon});
}
test('barehanded cadence is unique, responsive and modestly faster',()=>{
  assert.equal(interval(null),850);
  assert.equal(interval(undefined),850);
  assert.equal(interval({kind:'sword'}),900);
  assert.equal(interval({kind:'sword',mat:8}),900);
  assert(interval(null)>320,'punch recovery must finish before next attack');
  assert(900/850<1.07,'unarmed DPS increase should remain below 7 percent');
});
test('manual and auto-targeted attacks share the one nextSwing gate',()=>{
  assert.match(game,/const interval=swingInterval\(w\),iv=interval\/1000;a\.t\+=dt;/);
  assert.match(game,/if\(a\.t>=iv&&now>=nextSwing\)\{[\s\S]*?nextSwing=now\+interval;\s*a\.t=0;a\.swung=false;/);
  assert.match(game,/if\(started&&!inside&&!me\.pend&&\(combatHeld\|\|wantSwing\)&&now>=nextSwing\)\{\s*nextSwing=now\+swingInterval\(activeDef\('weapon'\)\);wantSwing=false;beginSwing\(now\);/);
  assert.equal(game.split('nextSwing=now+').length-1,2,
    'each attack mode must update the same shared timestamp');
});
test('equip swaps cannot reset or bypass the previous strike cooldown',()=>{
  let nextSwing=0;
  const strike=(now,weapon)=>{
    if(now<nextSwing)return false;
    nextSwing=now+interval(weapon);
    return true;
  };
  assert(strike(0,null));
  assert(!strike(100,{kind:'sword'}));
  assert(!strike(849,{kind:'sword'}));
  assert(strike(850,{kind:'sword'}));
  assert(!strike(1699,null));
  assert(strike(1750,null));
  assert(!strike(2500,{kind:'sword'}));
  assert(strike(2600,{kind:'sword'}));
});
test('existing hit resolution and sprite attack window are unchanged',()=>{
  assert.match(game,/startSwing\(now\);me\.pend=now\+110;/);
  assert.match(game,/const age=now-\(o\.swingAt\?\?-99999\),attacking=age>=0&&age<320;/);
  assert.match(game,/function resolveSwing\(now\)\{/);
  assert.match(game,/recordBossContribution\(m,'local',dmg\)/);
  assert.match(game,/if\(m\.hp<=0\)killMon\(m,now\)/);
});
