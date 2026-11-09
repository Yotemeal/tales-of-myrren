'use strict';
// Visual-only combat feedback integration. Run with node tests/combat-feedback.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,rectCount}=await createGame();
  const me=g.me,mons=g.mons;
  mons.length=0;me.x=g.CX;me.y=g.CY;me.tgt=null;me.pend=0;
  g.save.eq.weapon='bronze_sword';
  const m={t:'slime',state:'idle',x:me.x+12,y:me.y+4,hp:5,hx:me.x+12,hy:me.y+4,cd:0,prov:false,face:1};
  mons.push(m);
  const originalRandom=Math.random;
  try{
    Math.random=()=>0;
    g.beginSwing(1000);
    const beforeHp=m.hp;
    g.resolveSwing(1110);
    assert.equal(m.hp,beforeHp-1,'combat damage and hit timing remain unchanged');
    assert.equal(m.hitAt,1110,'hit reaction is linked to actual contact, not button press');
    assert(m.hitPushX>0,'monster flinches away from the attack origin');
    assert.equal(g.combatImpacts.length,1,'successful melee hit creates one contact spark');
    assert.equal(g.combatImpacts[0].sword,true,'equipped sword gets the modest steel contact accent');
    assert.equal(g.combatImpacts[0].t,1110);
    const xp=g.save.xp.melee;
    g.drawMon(m,40,50,1110);
    g.drawCombatImpacts(1110,me.x-40,me.y-40);
    g.drawCombatImpacts(1230,me.x-40,me.y-40);
    assert.equal(g.combatImpacts.length,1,'impact remains only inside its short visual window');
    g.drawCombatImpacts(1290,me.x-40,me.y-40);
    assert.equal(g.combatImpacts.length,0,'expired sparks must be removed');
    assert.equal(m.hp,beforeHp-1,'rendering must not apply more damage');
    assert.equal(g.save.xp.melee,xp,'rendering must not create XP');

    // A real combat miss should show damage text but no positive-hit flash.
    me.pend=0;Math.random=()=>.999;g.beginSwing(2000);
    const previous=m.hp;g.resolveSwing(2110);
    assert.equal(m.hp,previous);
    assert.equal(g.combatImpacts.length,0,'misses must not create white contact sparks');

    // The retained targeted-action pathway must use the same positive-hit FX.
    Math.random=()=>0;me.pend=0;g.beginAct('monster',m);
    const beforeTargeted=m.hp;g.doAction(1,3000);
    assert.equal(m.hp,beforeTargeted-1);
    assert.equal(g.combatImpacts.length,1,'targeted combat shares the same contact effect');

    // High-density combat cannot create an unbounded mobile render list.
    for(let i=0;i<100;i++)g.recordCombatHit(m,4000+i,me.x,me.y,true);
    assert.equal(g.combatImpacts.length,24,'impact effects must remain capped');
    g.drawCombatImpacts(5000,me.x,me.y);
    assert.equal(g.combatImpacts.length,0,'expired impact list drains completely');
  }finally{Math.random=originalRandom}

  // A positive-hit sprite flinch takes precedence over an enemy's own attack
  // windup, but it must not affect AI, collision or player knockback.
  const gameSource=fs.readFileSync('public/myrren-game.js','utf8');
  const drawMonster=gameSource.slice(gameSource.indexOf('function drawMon('),gameSource.indexOf('function rrect('));
  assert(drawMonster.indexOf("else if(ha>=0&&ha<190)mode='hit'")<
    drawMonster.indexOf("else if(m.state==='chase'"),'hit feedback must remain visible against attacking enemies');
  assert(drawMonster.includes('const kick=!dead&&ha>=0&&ha<150?'),'recoil should affect the drawn sprite only');
  assert(drawMonster.includes('ctx.translate(x+kickX,y+kickY)'),'sprite offset must remain isolated to the canvas');
  assert(!drawMonster.includes('m.x+='),'drawing must never push the monster world position');

  // Defeats have a short confirmation pose, then smoothly flatten the
  // existing corpse artwork around its ground anchor. No physics or reward
  // state is changed by drawing these frames.
  assert.equal(g.defeatCollapse(-20),0,'pre-death time must be clamped');
  assert.equal(g.defeatCollapse(90),0,'the initial 90ms hit flash remains upright');
  assert(g.defeatCollapse(280)>0&&g.defeatCollapse(280)<1,'collapse progresses continuously');
  assert.equal(g.defeatCollapse(500),1,'death pose settles after 410ms');
  assert.equal(g.defeatCollapse(1000),1,'settled pose remains stable');
  for(let age=90;age<=500;age+=10)
    assert(g.defeatCollapse(age)>=g.defeatCollapse(age-10),'collapse never reverses');

  const killAt=6100,oldXp=g.save.xp.melee;
  g.killMon(m,killAt);
  assert.equal(m.state,'dead');
  assert.equal(m.dieAt,killAt,'defeat visual begins at the actual kill time');
  const earnedXp=g.save.xp.melee;
  assert(earnedXp>oldXp,'normal kill still rewards XP');
  g.killMon(m,killAt+50);
  assert.equal(g.save.xp.melee,earnedXp,'visual effect does not duplicate kill rewards');
  const origin=[m.x,m.y,m.hp,m.state];
  let rectangles=rectCount();
  g.drawDefeatDust(m,40,50,89);
  assert.equal(rectCount(),rectangles,'no stray particles before the death transition');
  g.drawDefeatDust(m,40,50,90);
  assert(rectCount()>rectangles,'defeat pixel fragments appear on the first collapse frame');
  rectangles=rectCount();
  g.drawDefeatDust(m,40,50,569);
  assert(rectCount()>rectangles,'late pixel fragments finish briefly before the corpse fades');
  rectangles=rectCount();
  g.drawDefeatDust(m,40,50,570);
  assert.equal(rectCount(),rectangles,'death fragments expire deterministically');

  for(const age of [0,89,90,160,300,500,1000,1400,1600,2000])
    g.drawMon(m,40,50,killAt+age);
  assert.deepEqual([m.x,m.y,m.hp,m.state],origin,'death rendering must not move, revive or damage monsters');
  assert.equal(g.save.xp.melee,earnedXp,'animation must not change XP');

  // Palettes exist for every currently registered monster and effects remain
  // tiny and finite even with many nearby defeats.
  const type=m.t;
  for(const creature of Object.keys(g.MT)){m.t=creature;g.drawDefeatDust(m,40,50,240)}
  m.t=type;
  console.log('PASS: contact feedback, one-shot rewards, grounded enemy collapse, type-specific defeat pixels, visual expiry and no gameplay mutation.');
})().catch(e=>{console.error(e);process.exitCode=1});
