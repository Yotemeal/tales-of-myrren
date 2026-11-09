'use strict';
// Behavioral regression for the mobile hold-to-attack target lock.
// Run: node tests/combat-input.test.cjs
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g}=await createGame();
  const me=g.me,mons=g.mons;
  mons.length=0;
  me.x=g.CX;me.y=g.CY;me.tgt=null;me.pend=0;
  g.save.eq.weapon=null;
  assert.equal(g.meleeReach(),22,'bare hands use their shorter reach');
  g.save.eq.weapon='bronze_sword';
  assert.equal(g.meleeReach(),30,'swords extend auto-targeting reach');
  g.save.eq.weapon=null;

  const mob=(dx,dy=4)=>({t:'slime',state:'idle',x:me.x+dx,y:me.y+dy,hp:100,prov:false,cd:0,face:1});
  const edge=mob(21,8),closer=mob(8);
  mons.push(edge,closer);
  // Enemy hit centres are four pixels above their foot position.
  assert(g.meleeDistance(edge)<22,'fixture is inside fist reach by hit centre');
  assert(Math.hypot(edge.x-me.x,edge.y-me.y)>22,'fixture is outside old foot-distance reach');
  assert.equal(g.meleeTarget(),closer,'nearest eligible creature is acquired');

  me.tgt=edge;
  assert.equal(g.meleeTarget(),edge,'an in-range locked target takes priority over nearer enemies');
  edge.x=me.x+50;
  assert.equal(g.meleeTarget(),closer,'leaving range transfers focus to the nearest eligible creature');
  closer.state='dead';
  assert.equal(g.meleeTarget(),null,'dead and out-of-reach enemies cannot be selected');
  mons.length=0;me.tgt=null;

  const left=mob(-12),right=mob(9);
  mons.push(left,right);
  me.tgt=left;
  g.beginSwing(1000);
  assert.equal(g.getPendingStrike().target,left,'swing retains its selected enemy');
  assert.equal(me.face,-1,'attack automatically faces the target to the left');
  assert(me.fx<0,'directional vector points toward the target');
  g.resolveSwing(1110);
  assert.equal(left.prov,true,'the chosen enemy registers being attacked');
  assert.equal(right.hp,100,'a locked attack does not splash onto another enemy');
  assert.equal(right.prov,false,'the other enemy remains unprovoked');
  me.pend=0;

  // A hit uses the strike's locked origin and cannot land from arbitrary range
  // when an enemy moves away during the 110ms wind-up.
  me.tgt=right;
  g.beginSwing(2000);
  const hp=right.hp;
  right.x=me.x+70;
  g.resolveSwing(2110);
  assert.equal(right.hp,hp,'a retreating enemy cannot be hit outside the original reach');
  assert.equal(right.prov,false,'the whiff cannot provoke a distant target');

  right.state='dead';left.state='idle';me.tgt=right;me.pend=0;
  assert.equal(g.meleeTarget(),left,'dead target does not block reacquisition');
  g.faceMeleeTarget(left);
  assert.equal(me.face,-1,'enemy-facing helper is stable after retargeting');
  console.log('PASS: hit-centre selection, sticky lock, switching, facing, single-target damage and range-safe whiffs.');
})().catch(e=>{console.error(e);process.exitCode=1});
