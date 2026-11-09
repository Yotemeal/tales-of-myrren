'use strict';
// Configured boss/elite warnings must be readable, fixed in place and dodgeable.
// Run: node tests/combat-telegraph.test.cjs
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,rectCount}=await createGame();
  const me=g.me,mons=g.mons;mons.length=0;g.splats.length=0;
  me.x=g.CX;me.y=g.CY;me.hp=g.hpMax();me.tgt=null;me.pend=0;
  assert.equal(g.monsterWarningConfig(g.MT.slime),null,'standard mobs never warn unless opted in');
  assert.equal(g.monsterWarningConfig(g.MT.goblin),null,'goblin attacks remain unchanged');
  assert.equal(g.monsterWarningConfig({boss:true,iv:3}).ms,900,'future boss entries default to a readable windup');
  assert.equal(g.monsterWarningConfig({boss:true,iv:3,telegraph:false}),null,'explicit boss opt-out suppresses warnings');
  assert.equal(g.monsterWarningConfig({iv:3,telegraph:{ms:100,radius:12}}),null,'invalid short windup rejected');
  assert.equal(g.monsterWarningConfig({iv:3,telegraph:{ms:600,radius:999}}),null,'invalid warning radius rejected');
  assert.deepEqual(
    [g.monsterWarningConfig(g.MT.cave).ms,g.monsterWarningConfig(g.MT.abear).ms],
    [700,850],'only selected high-tier mobs receive configured warnings'
  );

  const enemy=(t,cd)=>({t,state:'chase',x:me.x+6,y:me.y+4,hx:me.x+6,hy:me.y+4,
    cd,hp:g.MT[t].hp,face:-1,prov:true,lunge:-9999});
  const cave=enemy('cave',1.69);mons.push(cave);
  const hp=me.hp;
  g.update(.03,1000);
  assert(cave.warn,'cave bear begins warning before its attack');
  assert.equal(cave.warn.start,1000);
  assert.equal(cave.warn.until,1700);
  assert.equal(cave.warn.radius,16);
  assert.equal(cave.warn.x,me.x,"marker snapshots the player's x-coordinate");
  assert.equal(cave.warn.y,me.y,"marker snapshots the player's y-coordinate");
  assert.equal(me.hp,hp,'creating a warning deals no damage');
  assert.equal(cave.lunge,-9999,'enemy does not attack on warning creation');

  let pixels=rectCount();
  g.drawMonsterWarning(cave,me.x-25,me.y-25,1150);
  assert(rectCount()>pixels,'an active telegraph draws visible pixels');
  pixels=rectCount();
  g.drawMonsterWarning(cave,me.x-25,me.y-25,1700);
  assert.equal(rectCount(),pixels,'expired marker is not drawn');

  // Move during the cast: the warning stays where it began and misses if dodged.
  me.x+=28;
  g.update(.05,1699);
  assert.equal(cave.warn.x,me.x-28,'warning must not follow the moving player');
  assert.equal(me.hp,hp,'no early hit before cast finishes');
  g.update(.05,1701);
  assert.equal(cave.warn,null,'completed warning clears its marker');
  assert.equal(cave.cd,0,'dodge still consumes the enemy attack cooldown');
  assert.equal(cave.lunge,1701,'a dodged heavy attack still plays its animation');
  assert.equal(me.hp,hp,'leaving the warning circle avoids damage entirely');
  assert.equal(g.splats.length,0,'dodge does not display false damage text');

  // Standing in a marked zone receives the existing damage calculation.
  me.x=g.CX;me.y=g.CY;me.hp=g.hpMax();
  cave.x=me.x+6;cave.y=me.y+4;cave.hx=cave.x;cave.hy=cave.y;
  cave.state='chase';cave.prov=true;cave.cd=1.69;cave.lunge=-9999;
  const originalRandom=Math.random;
  try{
    Math.random=()=>0;
    g.update(.03,2000);
    assert(cave.warn&&cave.warn.until===2700);
    g.update(.05,2699);
    assert.equal(me.hp,g.hpMax(),'warning remains non-damaging until exact impact time');
    g.update(.05,2700);
    assert.equal(me.hp,g.hpMax()-1,'remaining in range takes one normal hit');
    assert.equal(cave.warn,null);
    assert.equal(cave.cd,0);
    assert.equal(cave.lunge,2700);
  }finally{Math.random=originalRandom}

  // Warning cancels safely if the enemy returns home rather than hitting
  // someone who has already escaped its leash.
  me.x=g.CX;me.y=g.CY;cave.x=me.x+6;cave.y=me.y+4;
  cave.hx=cave.x;cave.hy=cave.y;cave.cd=1.69;cave.prov=true;cave.state='chase';
  g.update(.03,3000);
  assert(cave.warn,'new cast begins');
  me.x+=145; // 139px from the enemy: outside its existing 130px leash
  g.update(.02,3050);
  assert.equal(cave.state,'return','leashing enemy returns home');
  assert.equal(cave.warn,null,'leashing cancels its pending warning');
  assert.equal(cave.cd,1.72,'cancelling warning does not instantly strike the player');

  // Regular enemies still attack without a visual countdown or extra wait.
  mons.length=0;me.x=g.CX;me.y=g.CY;me.hp=g.hpMax();
  const slime=enemy('slime',g.MT.slime.iv-.01);mons.push(slime);
  try{
    Math.random=()=>0;
    g.update(.02,4000);
  }finally{Math.random=originalRandom}
  assert.equal(slime.warn,undefined,'normal slime has no warning');
  assert.equal(slime.lunge,4000,'ordinary melee attack still resolves immediately');
  assert.equal(me.hp,g.hpMax()-1,'ordinary damage remains unchanged');

  // Killing an enemy must immediately remove a pending warning, including
  // when its visual corpse persists on screen.
  mons.length=0;me.hp=g.hpMax();me.x=g.CX;me.y=g.CY;
  const dying=enemy('cave',1.69);mons.push(dying);
  g.update(.03,5000);
  assert(dying.warn);
  g.killMon(dying,5050);
  assert.equal(dying.state,'dead');
  assert.equal(dying.warn,null);
  pixels=rectCount();
  g.drawMonsterWarning(dying,0,0,5075);
  assert.equal(rectCount(),pixels,'dead enemies cannot show stale warnings');
  g.update(.02,dying.back);
  assert.equal(dying.state,'idle');
  assert.equal(dying.cd,0,'respawns reset attack cooldown');
  assert.equal(dying.warn,null,'respawned mob has no telegraph');

  console.log('PASS: default boss and opt-in mob warnings, fixed hit zones, early/late damage, dodge, leash, death, respawn and normal mob parity.');
})().catch(e=>{console.error(e);process.exitCode=1});
