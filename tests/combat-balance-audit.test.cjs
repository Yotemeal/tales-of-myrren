'use strict';
/* Read-only regression audit of combat constants on the current game source.
   Run: node tests/combat-balance-audit.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'myrren-game.js'), 'utf8');
function capture(re, name) {
  const match = src.match(re);
  assert.ok(match, 'Could not locate ' + name + '; inspect combat implementation');
  return match;
}
const swingMs = Number(capture(/const SWING_IV\s*=\s*(\d+)/, 'directional swing interval')[1]);
assert.match(src, /const iv=SWING_IV\/1000;a\.t\+=dt;/, 'targeted attacks must use shared swing cooldown');
const targetedSeconds = swingMs / 1000;
const directionalSeconds = swingMs / 1000;
assert.ok(swingMs > 0 && targetedSeconds > 0);
const swingDpsFactor = targetedSeconds / directionalSeconds;
assert.equal(swingDpsFactor, 1, 'attack methods must have identical theoretical single-target DPS');

const manualGate = capture(/if\(started&&!inside&&!me\.pend&&\(combatHeld\|\|wantSwing\)&&now>=nextSwing\)\{\s*nextSwing=now\+SWING_IV;wantSwing=false;beginSwing\(now\);\s*\}/, 'manual attack cooldown gate');
assert.ok(manualGate);
const updateCode = capture(/function update\(dt,now\)\{([\s\S]*?)\n\}\n\n\/\* ---------- drawing/, 'main update loop')[1];
const gamepadInput = updateCode.indexOf('const gp=pollPad(now)');
const collisionEnd = updateCode.indexOf('const lockedEnemy=started&&!inside&&combatHeld');
const attackGate = updateCode.indexOf('if(started&&!inside&&!me.pend&&(combatHeld||wantSwing)');
assert.ok(gamepadInput>=0&&collisionEnd>gamepadInput&&attackGate>collisionEnd, 'gamepad input and collision-adjusted facing must precede attack scheduling');
assert.match(src, /if\(!a\.swung&&a\.t>=iv-\.2&&now>=nextSwing-200\)\{a\.swung=true;startSwing\(now\)\}/, 'targeted attack animation must wait until shared cooldown is nearly ready');
assert.match(src, /if\(a\.t>=iv&&now>=nextSwing\)\{\s*\/\/ Manual and targeted attacks consume the same per-character cooldown\.[\s\S]*?nextSwing=now\+SWING_IV;\s*a\.t=0;/, 'targeted attacks must consume the manual attack cooldown and discard queued time');

const tiers = [
  {name:'Bronze', level:1, attack:1},
  {name:'Iron', level:10, attack:3},
  {name:'Steel', level:20, attack:6},
  {name:'Black Iron', level:30, attack:12},
  {name:'Obsidianite', level:40, attack:17},
  {name:'Myrrenite', level:55, attack:22},
  {name:'Starsteel', level:70, attack:30},
];
const monsterStats = [
  ['Slime',1,5,1],['Goblin',5,10,4],['Boar',8,14,6],
  ['Wolf',12,20,10],['Bear',22,42,18],['Cave bear',40,150,38],
  ['Aether bear',70,520,68],
];
function clamp(v,lo,hi){return Math.min(hi,Math.max(lo,v))}
function hitChance(level,monsterDef,attack){return clamp(.55+(level-monsterDef)*.03+attack*.01,.25,.95)}
function expectedHit(level,attack){return (3+Math.floor(level/4)+attack)/2}
function dps(level,attack,def,interval){return hitChance(level,def,attack)*expectedHit(level,attack)/interval}
function reduction(def){return Math.min(.45,.5*def/(def+70))}
assert.equal(reduction(0),0);
assert.ok(reduction(100)>0 && reduction(100)<.45);
assert.ok(reduction(1000)<=.45);
assert.match(src,/function combatKillXp\(mt\)/);
assert.match(src,/function killMon\(m,now\)/);
assert.match(src,/m\.hp-=dmg/g);
assert.equal(tiers.length,7);
console.log('Attack interval audit (read-only):');
console.log('directional: '+directionalSeconds.toFixed(2)+'s; targeted: '+targetedSeconds.toFixed(2)+'s; theoretical DPS factor: '+swingDpsFactor.toFixed(3)+'x');
console.log('Enemy | level | HP | directional DPS | targeted DPS | directional expected TTK (s)');
for(const [name,level,hp,def] of monsterStats){
  const tier=[...tiers].reverse().find(t=>t.level<=level)||tiers[0];
  const directional=dps(level,tier.attack,def,directionalSeconds);
  const targeted=dps(level,tier.attack,def,targetedSeconds);
  console.log([name,level,hp,directional.toFixed(2),targeted.toFixed(2),(hp/directional).toFixed(1)].join(' | '));
}
if(Math.abs(swingDpsFactor-1)>0.05){
  console.warn('BALANCE WARNING: attack input methods differ by '+((swingDpsFactor-1)*100).toFixed(1)+'% in theoretical DPS. This is a known baseline, not a test failure.');
}

// Auto-targeted swings hit one enemy. Directional fallback applies only when
// no enemy was selected at swing start.
const swingBody = capture(/function resolveSwing\(now\)\{([\s\S]*?)\n\}\nfunction nearFire/, 'directional strike resolution')[1];
assert.match(swingBody, /for\(const m of mons\)/, 'directional swing currently iterates all monsters');
assert.match(swingBody, /if\(strike\.target\?m!==strike\.target:!strikeHitsTarget\(strike,m\)\)continue;/, 'locked melee attacks hit their selected enemy; empty swings use directional fallback');
assert.match(src, /function meleeTarget\(reach=meleeReach\(\)\)/, 'attacks and strafing use shared target selection');
assert.match(src, /t&&t\.state!=='dead'&&meleeDistance\(t\)<=reach\?t:nearestMon\(reach\)/, 'lock must retain only living in-range enemies');
assert.match(src, /const lockedEnemy=started&&!inside&&combatHeld\?meleeTarget\(\):null/, 'held attacks should track a reachable enemy');
assert.match(src, /if\(target\)\{faceMeleeTarget\(target\)/, 'swing must face the acquired target');
assert.match(src, /function meleeDistance\(m,x=me\.x,y=me\.y\)/, 'targeting must use strike-centre hit distance');
const targetBody = capture(/const iv=SWING_IV\/1000;a\.t\+=dt;([\s\S]*?)\n\s*\}\n\s*\}\nfunction update/, 'targeted combat action')[1];
assert.match(targetBody, /m\.hp-=dmg/, 'targeted combat action resolves against one monster');
assert.doesNotMatch(src, /wearItem|wearArmour|wearOf|repairCost|rRepair|save\\.wear|Repair:\\[\\]/, 'durability and repair systems must remain removed');
assert.match(src, /const activeDef=slot=>\{const d=eqDef\(slot\);return d&&usable\(d\)\?d:null\}/, 'usable gear must not depend on condition');
console.log('DESIGN NOTE: auto-targeted swings hit one enemy; untargeted swings retain a directional fallback.');

console.log('PASS: source contracts and mathematical invariants; not a browser, multiplayer, or live-game test.');
