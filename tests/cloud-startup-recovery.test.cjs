'use strict';
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');
const KEY='ember-reach-v2';
const character=(ts,coins,name='Local QA')=>({v:3,ts,name,xp:{melee:0},inv:{coins},eq:{},bag:[],x:800,y:840});
const local=character(100,100),remote=character(200,999,'Recovered QA');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function cloud(){
  let resolve,reject,requested=false;
  const pending=new Promise((yes,no)=>{resolve=yes;reject=no});
  const writes=[];
  const doc={get(){requested=true;return pending},async set(value){writes.push(JSON.parse(JSON.stringify(value)))}};
  const claude={async use(kind){
    if(kind==='room')throw Error('No room in save test');
    if(kind==='user')return {async id(){return 'save-qa'}};
    if(kind==='db')return {collection(){return {doc(){return doc}}}};
    throw Error('Unexpected capability '+kind);
  }};
  return {claude,writes,get requested(){return requested},resolve,reject};
}
const descendants=node=>[node,...(node.children||[]).flatMap(descendants)];
function choose(runtime,label){
  if(runtime.game.getTab()!=='settings')runtime.game.openModal('settings');
  const button=descendants(runtime.elements.get('mBody')).find(node=>node.innerHTML===label);
  assert(button,'recovered save choice must be offered: '+label);button.click();
}
async function waitingRuntime(){
  const mock=cloud();
  const runtime=await createGame({[KEY]:JSON.stringify(local)},{window:{claude:mock.claude}});
  runtime.document.getElementById('intro');
  await flush();assert(mock.requested,'cloud read must actually be in flight');
  return {runtime,mock};
}
function startAfterTimeout(runtime){
  const guard=runtime.timers.find(timer=>timer.delay===4000);
  assert(guard,'startup fallback remains available');guard.fn();
  runtime.game.start();assert.equal(runtime.elements.get('intro').hidden,true);
  runtime.game.save.inv.coins=120;runtime.game.persist(true);
}
(async()=>{
  const first=await waitingRuntime();
  const {runtime,mock}=first;
  assert.equal(runtime.elements.get('go').disabled,true,'loading keeps the Enter button disabled');
  const before=runtime.memory.get(KEY);
  runtime.elements.get('nick').events.keydown({key:'Enter'});
  assert.equal(runtime.elements.get('intro').hidden,false,'nickname Enter cannot bypass pending save loading');
  assert.equal(runtime.memory.get(KEY),before,'early Enter cannot replace the stored character');
  startAfterTimeout(runtime);
  assert.equal(mock.writes.length,0,'autosave cannot upload while the cloud character is unverified');
  assert(JSON.parse(runtime.memory.get(KEY)).ts>remote.ts,'gameplay has already advanced its local timestamp');
  runtime.game.openModal('settings');
  mock.resolve({exists:true,data:()=>({json:JSON.stringify(remote)})});await flush();
  assert(descendants(runtime.elements.get('mBody')).some(node=>node.innerHTML==='Restore recovered character'),
    'an already open Settings screen shows late recovery choices without reopening');
  assert.equal(mock.writes.length,0,'late recovered character cannot be overwritten by startup gameplay');
  assert.equal(runtime.game.save.inv.coins,120,'the current session waits for an explicit recovery choice');
  runtime.game.persist(true);await flush();
  assert.equal(mock.writes.length,0,'forced saves remain blocked until recovery is resolved');
  choose(runtime,'Restore recovered character');await flush();
  assert.equal(runtime.game.save.inv.coins,999);assert.equal(runtime.game.save.name,'Recovered QA');
  assert.equal(runtime.game.me.hp,runtime.game.hpMax(),'restore choice refreshes the live character');
  assert(mock.writes.length>0);assert(mock.writes.every(write=>write.json&&JSON.parse(write.json).inv.coins===999),
    'only the chosen recovered progress can be uploaded');

  const keep=await waitingRuntime();startAfterTimeout(keep.runtime);
  keep.mock.resolve({exists:true,data:()=>({json:JSON.stringify(remote)})});await flush();
  choose(keep.runtime,'Keep current character');await flush();
  assert.equal(keep.runtime.game.save.inv.coins,120);
  assert(keep.mock.writes.length>0);assert(keep.mock.writes.every(write=>JSON.parse(write.json).inv.coins===120),
    'keep-device choice explicitly permits replacing cloud progress with the current character');

  for(const broken of ['read failure','invalid stored data']){
    const failed=await waitingRuntime();startAfterTimeout(failed.runtime);
    if(broken==='read failure')failed.mock.reject(Error('Cloud temporarily unavailable'));
    else failed.mock.resolve({exists:true,data:()=>({json:JSON.stringify({xp:'invalid'})})});
    await flush();failed.runtime.game.persist(true);await flush();
    assert.equal(failed.mock.writes.length,0,broken+' cannot prove it is safe to overwrite the cloud');
    assert.equal(failed.runtime.game.save.inv.coins,120,'cloud failure preserves local play');
  }
  console.log('PASS: startup Enter respects loading; delayed cloud reads cannot upload stale progress; explicit restore/keep choices and read-error safety.');
})().catch(error=>{console.error(error);process.exitCode=1});
