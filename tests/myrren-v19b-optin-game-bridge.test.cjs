'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bridge=fs.readFileSync('public/myrren-v19b-optin-game-bridge.js','utf8');
function harness(){
  const calls=[];
  const legacy={draw(...args){calls.push(['legacy',...args]);return true;},get ready(){return true;}};
  const native={draw(...args){calls.push(['v19b',...args]);return true;},ready:true};
  const window={MyrrenKezV2Atlas:legacy,MyrrenV19BAtlas:native};
  vm.runInNewContext(bridge,{window,console,Number,Math});
  return {window,calls,legacy,native};
}
test('feature is opt-in, preserving old renderer for equipped combat',()=>{
  const {window,calls}=harness();
  const render=o=>window.MyrrenKezV2Atlas.draw({},50,70,o,660);
  render({dv:'d',tool:'fist',g:[0,0,0,0,0,0],moving:true});
  render({dv:'s',f:-1,moving:false,tool:'fist',g:[0,0,0,0,0,0]});
  render({dv:'u',tool:'sword',g:[0,0,0,0,0,0]});
  render({dv:'d',tool:'fist',g:[0,3,0,0,0,0]});
  render({dv:'d',tool:'fist',g:[],swingAt:600});
  render({dv:'d',tool:'fist',g:[],deathAt:300});
  assert.deepEqual(calls.map(x=>x[0]),['v19b','v19b','legacy','legacy','legacy','legacy']);
});
test('in-game wrapper does not alter game state or mutate render options',()=>{
  const {window}=harness();
  const o=Object.freeze({dv:'s',f:1,moving:true,tool:'fist',g:Object.freeze([0,0,0,0,0,0])});
  assert.equal(window.MyrrenKezV2Atlas.draw({},50,70,o,110),true);
  assert.equal(window.MyrrenKezV2Atlas.ready,true);
});
test('loading preview twice cannot wrap legacy draw twice',()=>{
  const {window,calls}=harness();
  const prior=window.MyrrenKezV2Atlas.draw;
  vm.runInNewContext(bridge,{window,console,Number,Math});
  assert.equal(window.MyrrenKezV2Atlas.draw,prior);
  window.MyrrenKezV2Atlas.draw({},50,70,{tool:'fist',g:[]},0);
  assert.equal(calls.length,1);
});
