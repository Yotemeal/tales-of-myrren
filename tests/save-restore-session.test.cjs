'use strict';
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

const character=(xp=0,eq={})=>({v:3,ts:1,name:'Restore QA',
  xp:{melee:xp,forging:10000000,cooking:10000000},
  inv:{coins:100,copper:10,tin:10,rshrimp:5},eq,bag:[],x:800,y:840});

(async()=>{
  const {game:t}=await createGame();
  // IndexedDB/cloud loading can adopt a higher-level save after me is
  // initialized from a fresh local character. Start with its proper health.
  t.adoptSave(character(10000000,{weapon:'steel_sword'}));
  assert(t.hpMax()>40);
  assert.equal(t.me.hp,t.hpMax(),'loaded higher-level character starts at full health');
  assert.equal(t.me.tool,'sword');assert.equal(t.me.mat,4);
  t.me.hp=1;
  t.adoptSave(character());
  assert.equal(t.me.hp,t.hpMax(),'restoring low-level save replaces the previous health total');
  assert.equal(t.me.tool,'fist','restored equipment is reflected immediately');

  // A strike aimed by the old character must not resolve with the restored
  // character's equipment, level or position.
  t.beginSwing(1000);assert(t.getPendingStrike());
  t.adoptSave(character());
  assert.equal(t.getPendingStrike(),null);assert.equal(t.me.pend,0);
  t.beginAct('node',{k:'copper',x:t.me.x,y:t.me.y+10,back:0});
  assert(t.getAct());
  t.adoptSave(character());assert.equal(t.getAct(),null);

  // Replacing progress cancels in-flight production, even if the imported
  // save includes enough ingredients to keep the previous queue running.
  const furnace=t.VILLAGE.stations.find(s=>s.kind==='furnace');
  t.me.x=furnace.x;t.me.y=furnace.y;t.openSmithy('furnace');
  assert(t.startSmithing('smelt','bronze'));assert(t.getSmithJob());
  t.adoptSave(character());assert.equal(t.getSmithJob(),null);
  t.smithingTick(Date.now()+10000);
  assert.equal(t.save.inv.copper,10,'old production cannot spend restored ingredients');

  // Old interior coordinates cannot clamp an outdoor restored position.
  t.enterBuilding({...t.BLD.find(b=>b.id==='arms'),open:false},2000);
  assert(t.getInside());
  t.adoptSave(character());
  assert.equal(t.getInside(),null);
  assert.equal(t.me.x,800);assert.equal(t.me.y,840);
  assert.equal(t.snap().x,800);assert.equal(t.snap().y,840);
  t.update(0,3000);
  assert.equal(t.me.x,800);assert.equal(t.me.y,840);
  console.log('PASS: save restoration replaces health, equipment, activities, pending attacks and interior state.');
})().catch(error=>{console.error(error);process.exitCode=1});
