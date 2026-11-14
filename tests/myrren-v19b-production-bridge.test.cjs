'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/myrren-v19b-optin-game-bridge.js', 'utf8');
function harness({ ready = true, failed = false, search = '' } = {}) {
  const calls = [], errors = [], events = [];
  const old = { ready: true, draw(...args) { calls.push(['legacy', ...args]); return true; } };
  const next = { ready, failed, draw(...args) { calls.push(['v19b', ...args]); return true; } };
  const window = { location:{search}, MyrrenKezV2Atlas:old, MyrrenV19BAtlas:next,
    dispatchEvent(e){ events.push(e.type); } };
  const console = { error(msg) { errors.push(msg); } };
  const box = {window, console, Event:class { constructor(type) { this.type=type; } }, Number, Boolean, Math, Array, Object};
  vm.runInNewContext(source,box);
  const input = {tool:'fist',g:[0,0,0,0,0,0],deathAt:null,hurtAt:-99999,swingAt:-99999};
  function render(o=input){ return old.draw({},64,64,o,700); }
  return {old,next,window,calls,errors,events,box,render,input};
}
test('default draws accepted V19B when ready',()=>{
  const h=harness(); h.render(); assert.deepEqual(h.calls.map(x=>x[0]),['v19b']);
});
test('temporary loading uses previous character without interrupting gameplay',()=>{
  const h=harness({ready:false}); h.render(); h.render();
  assert.deepEqual(h.calls.map(x=>x[0]),['legacy','legacy']);
  assert.equal(h.errors.length,0);
  h.next.ready=true; h.render(); assert.equal(h.calls.at(-1)[0],'v19b');
});
test('failed artwork visibly reports error and keeps drawing previous character',()=>{
  const h=harness({ready:false,failed:true}); h.render(); h.render();
  assert.deepEqual(h.calls.map(x=>x[0]),['legacy','legacy']);
  assert.equal(h.errors.length,1);assert.deepEqual(h.events,['myrren-v19b-fallback']);
});
test('emergency URL bypasses V19B and cannot be reenabled on that page',()=>{
  const h=harness({search:'?utm_test=1&character=legacy'});h.render();
  assert.equal(h.window.MyrrenV19BGameplayPreview.setEnabled(true),false);
  h.render();assert.deepEqual(h.calls.map(x=>x[0]),['legacy','legacy']);
});
test('attack, hurt, death, armour, and missing explicit render state use legacy',()=>{
  const h=harness();
  const variants = [
    {...h.input,tool:'sword'}, {...h.input,g:[0,1,0,0,0,0]},
    {...h.input,deathAt:20}, {...h.input,hurtAt:600},
    {...h.input,swingAt:600},
    {...h.input,hurtAt:undefined},
    {...h.input,g:[0,0,0]},
    {...h.input,isMe:1,deathAt:undefined},
    (({deathAt,...rest})=>rest)(h.input)
  ];
  for(const o of variants)h.render(o);
  assert.deepEqual(h.calls.map(x=>x[0]),variants.map(()=>'legacy'));
});

test('real multiplayer action code 0 selects V19B for an unarmed peer',()=>{
  const h=harness();
  const peer={...h.input,tool:'',isMe:undefined,deathAt:undefined};
  h.render(peer);
  assert.deepEqual(h.calls.map(x=>x[0]),['v19b']);
});
test('remote empty tool does not override gear, combat or local uninitialized state',()=>{
  const h=harness();
  const barePeer={...h.input,tool:'',isMe:undefined,deathAt:undefined};
  const options=[
    {...barePeer,g:[2,0,0,0,0,0]},
    {...barePeer,swingAt:600},
    {...barePeer,hurtAt:600},
    {...barePeer,dead:true},
    {...barePeer,deathAt:500},
    {...h.input,isMe:1,tool:''},
    {...h.input,tool:undefined},
  ];
  for(const o of options)h.render(o);
  assert.deepEqual(h.calls.map(x=>x[0]),options.map(()=>'legacy'));
});
