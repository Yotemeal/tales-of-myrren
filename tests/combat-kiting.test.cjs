'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/myrren-game.js','utf8');
const match=source.match(/function strikeHitsTarget\(strike,m\)\{[\s\S]*?\n\}/);
assert(match,'melee strike must have a pure hit-geometry function');
const COS_ARC=Math.cos(Math.PI*50/180);
const hits=vm.runInNewContext('('+match[0]+')',{Math,COS_ARC});
const strike={x:100,y:100,fx:1,fy:0,reach:30};
assert(hits(strike,{x:125,y:104}),'forward target inside sword reach must be hit');
assert(!hits(strike,{x:140,y:104}),'target beyond sword reach must miss');
assert(!hits(strike,{x:80,y:104}),'target behind player must miss');
assert(hits(strike,{x:100,y:104}),'close target should not be rejected by facing arc');
const shifted={...strike,x:200,y:200};
assert(!hits(shifted,{x:125,y:104}),'strike must use captured origin, not current position');
const fist={...strike,reach:22};
assert(!hits(fist,{x:125,y:104}),'unarmed attacks must retain shorter reach');
const begin=source.slice(source.indexOf('function beginSwing(now){'),source.indexOf('function resolveSwing(now){'));
const resolve=source.slice(source.indexOf('function resolveSwing(now){'),source.indexOf('function nearFire(){'));
assert(begin.includes('pendingStrike={x:me.x,y:me.y,fx:me.fx,fy:me.fy,reach,target};'),
  'capture player position, facing, weapon reach and selected enemy at swing input');
assert(resolve.includes('if(strike.target?m!==strike.target:!strikeHitsTarget(strike,m))continue;'),
  'locked strikes hit their chosen target while unselected strikes use the facing cone');
assert(resolve.includes('if(strike.target&&meleeDistance(m,strike.x,strike.y)>strike.reach)continue;'),
  'locked strikes cannot reach enemies beyond their original swing origin');
assert(source.includes('me.pend=0;pendingStrike=null;me.swing=-99999;'),
  'death must clear pending damage');
assert(source.includes('const SWING_IV=900'),'attack cooldown must not be accelerated by kiting');
const faceMatch=source.match(/function faceMeleeTarget\(m\)\{[\s\S]*?\n\}/);
assert(faceMatch,'enemy-facing helper must exist');
const me={x:100,y:100,fx:0,fy:1,face:1,dv:'d'};
const faceEnemy=vm.runInNewContext('('+faceMatch[0]+')',{Math,me});
faceEnemy({x:80,y:104});
assert.equal(me.face,-1,'moving away does not change facing away from the locked enemy');
assert.equal(me.fx,-1,'attack direction points at enemy while strafing');
faceEnemy({x:100,y:80});
assert.equal(me.dv,'u','locked facing tracks enemies above the character');
assert(source.includes("const combatHeld=atkHeld||gpAtk||keys[' ']"),'touch, gamepad and keyboard attack share targeting');
assert(source.includes('const lockedEnemy=started&&!inside&&combatHeld?meleeTarget():null'),'active melee targets are selected each held frame');
assert(source.includes('faceMeleeTarget(lockedEnemy);me.tgt=lockedEnemy;'),'held melee attacks continue to face enemies after moving');
console.log('PASS: strike snapshot, directional fallback, targeted range, and responsive strafe facing');
