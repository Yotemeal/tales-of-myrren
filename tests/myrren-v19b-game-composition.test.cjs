'use strict';
/** Runs the actual live drawKezV2() from public/myrren-game.js in a Node VM
 * with canvas/gear stubs. This is a composition test, not browser gameplay. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('public/myrren-game.js','utf8');
const bridge=fs.readFileSync('public/myrren-v19b-optin-game-bridge.js','utf8');
const playerConstructor=src.match(/const me=\{[^;]+\};/)?.[0];
assert(playerConstructor && playerConstructor.includes('deathAt:null'),
  'fresh local players must start with an explicit null death timestamp');
assert(playerConstructor.includes('hurtAt:-99999'),
  'fresh local players must start without a hurt animation');

const start=src.indexOf('function drawKezV2(');
const end=src.indexOf('function drawPerson(',start);
assert(start>=0&&end>start,'expected live player/peer composition function');
assert(src.slice(start,end).includes('const state={...o,now,deathAt,hurtAt};'),
  'resolved local death/hurt state must reach opt-in adapter');

function harness(){
  const calls=[];
  const me={deathAt:null,hurtAt:-99999};
  const legacy={ready:true,draw(ctx,x,y,state,now){calls.push(['legacy',state,now]);return true;}};
  const native={ready:true,draw(ctx,x,y,state,now){calls.push(['v19b',state,now]);return true;}};
  const window={MyrrenKezV2Atlas:legacy,MyrrenV19BAtlas:native,
    MyrrenKezV2Equipment:{draw(){},colorsFor(){return null;}}};
  const ctx={globalAlpha:1,save(){},restore(){},translate(){},rotate(){}};
  const sandbox={window,me,ctx,console,Math,Number,Boolean,Object,Array,
    shadowE(){},label(){},R(){},drawTool(){},swingAng(){return 0;},missingKezLogged:false};
  vm.createContext(sandbox);
  vm.runInContext(bridge,sandbox);
  vm.runInContext(src.slice(start,end)+'\nthis.drawPlayer=drawKezV2;',sandbox);
  function render(o,now=660){
    calls.length=0;
    sandbox.drawPlayer(40,70,{dv:'d',f:1,moving:true,
      name:'Testing',isMe:1,tool:'fist',g:[0,0,0,0,0,0],swingAt:-99999,hold:0,...o},now);
    return calls.slice();
  }
  return {window,me,calls,render};
}
test('live composition routes unequipped local walking and idle to V19B',()=>{
  const h=harness();
  for(const moving of [true,false]){
    const calls=h.render({moving});
    assert.equal(calls.length,1);
    assert.equal(calls[0][0],'v19b');
    assert.equal(calls[0][1].deathAt,null);
    assert.equal(calls[0][1].hurtAt,-99999);
  }
});
test('live local death and hurt frames stay with existing animations',()=>{
  const h=harness();
  h.me.deathAt=450;
  const dead=h.render({});
  assert.equal(dead[0][0],'legacy');
  assert.equal(dead[0][1].deathAt,450);
  h.me.deathAt=null;
  h.me.hurtAt=600;
  const hurt=h.render({});
  assert.equal(hurt[0][0],'legacy');
  assert.equal(hurt[0][1].hurtAt,600);
});
test('live composition safely falls back for equipment, sword, punch',()=>{
  const h=harness();
  assert.equal(h.render({g:[0,2,0,0,0,0]})[0][0],'legacy');
  assert.equal(h.render({tool:'sword'})[0][0],'legacy');
  assert.equal(h.render({swingAt:600})[0][0],'legacy');
});
test('live peer direction uses V19B route without local death timestamps',()=>{
  const h=harness();
  const peer=h.render({isMe:0,dv:'s',f:-1});
  assert.equal(peer[0][0],'v19b');
  assert.equal(peer[0][1].deathAt,undefined);
});
