'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const bridge = fs.readFileSync('public/myrren-v19b-optin-game-bridge.js', 'utf8');
function harness() {
  const calls = [];
  const legacy = {draw(...args) {calls.push(['legacy', ...args]); return true;}, get ready(){return true;}};
  const native = {draw(...args) {calls.push(['v19b', ...args]); return true;}, ready:true};
  const window = {MyrrenKezV2Atlas:legacy, MyrrenV19BAtlas:native};
  vm.runInNewContext(bridge, {window, console, Number, Math, Object, Boolean, Array});
  return {window, calls, legacy, native};
}
const base = {dv:'d', f:1, moving:true, isMe:1, tool:'fist', g:[0,0,0,0,0,0],
  swingAt:-99999, deathAt:null, hurtAt:-99999};
test('renders accepted V19B only for an eligible six-slot, unarmed idle/walk',()=>{
  const {window, calls} = harness();
  for(const o of [{...base, moving:true}, {...base, dv:'u', moving:false}, {...base,isMe:0}]){
    assert.equal(window.MyrrenKezV2Atlas.draw({},50,70,o,660),true);
  }
  assert.deepEqual(calls.map(x=>x[0]),['v19b','v19b','v19b']);
});
test('preserves old renderer for local death and hurt, attacks, gear, weapons and missing state',()=>{
  const {window,calls}=harness();
  const variants=[
    {...base, deathAt:300},
    {...base, hurtAt:600},
    {...base, swingAt:600},
    {...base, g:[0,1,0,0,0,0]},
    {...base, tool:'sword'},
    {...base, tool:''},
    {...base, g:[]},
    {...base, g:undefined},
    {...base, deathAt:undefined, hurtAt:undefined},
    (({deathAt,...o})=>o)(base),
    (({hurtAt,...o})=>o)(base),
  ];
  for(const v of variants) window.MyrrenKezV2Atlas.draw({},50,70,v,660);
  assert.deepEqual(calls.map(x=>x[0]),variants.map(()=>'legacy'));
});
test('old renderer can be toggled for comparisons without reloading or changing art',()=>{
  const {window,calls}=harness();
  const preview = window.MyrrenV19BGameplayPreview;
  assert.equal(preview.enabled,true);
  assert.equal(preview.setEnabled(false),false);
  window.MyrrenKezV2Atlas.draw({},50,70,base,660);
  assert.equal(preview.setEnabled(true),true);
  window.MyrrenKezV2Atlas.draw({},50,70,base,660);
  assert.deepEqual(calls.map(x=>x[0]),['legacy','v19b']);
});
test('bridge is idempotent and does not mutate frozen render options',()=>{
  const {window,calls}=harness();
  const draw = window.MyrrenKezV2Atlas.draw;
  vm.runInNewContext(bridge,{window,console,Number,Math,Object,Boolean,Array});
  assert.equal(window.MyrrenKezV2Atlas.draw,draw);
  const options=Object.freeze({...base,g:Object.freeze(base.g)});
  window.MyrrenKezV2Atlas.draw({},50,70,options,660);
  assert.equal(calls.length,1);
  assert.equal(calls[0][0],'v19b');
});
