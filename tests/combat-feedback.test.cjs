'use strict';
// Visual-only combat feedback integration. Run with node tests/combat-feedback.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g}=await createGame();
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

  console.log('PASS: contact flashes, missed attacks, single-target timing, 24-effect cap, expiry, flinch and legacy combat feedback.');
})().catch(e=>{console.error(e);process.exitCode=1});
