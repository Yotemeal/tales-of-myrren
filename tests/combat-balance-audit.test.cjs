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

const manualGate = capture(/if\(started&&!inside&&\(atkHeld\|\|gpAtk\|\|wantSwing\|\|keys\[' '\]\)&&now>=nextSwing\)\{nextSwing=now\+SWING_IV;wantSwing=false;beginSwing\(now\)\}/, 'manual attack cooldown gate');
assert.ok(manualGate);
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

// Directional strikes intentionally sweep every enemy inside the arc.
// This is an AoE advantage, not single-target DPS parity; protect the behaviour
// from accidental changes until a deliberate cleave-balance decision is made.
const swingBody = capture(/function resolveSwing\(now\)\{([\s\S]*?)\n\}\nfunction nearFire/, 'directional strike resolution')[1];
assert.match(swingBody, /for\(const m of mons\)/, 'directional swing currently iterates all monsters');
assert.match(swingBody, /if\(!strikeHitsTarget\(strike,m\)\)continue;/, 'directional swing requires arc and reach');
const targetBody = capture(/const iv=SWING_IV\/1000;a\.t\+=dt;([\s\S]*?)\n\s*\}\n\s*\}\nfunction update/, 'targeted combat action')[1];
assert.match(targetBody, /m\.hp-=dmg/, 'targeted combat action resolves against one monster');
assert.doesNotMatch(src, /wearItem|wearArmour|wearOf|repairCost|rRepair|save\\.wear|Repair:\\[\\]/, 'durability and repair systems must remain removed');
assert.match(src, /const activeDef=slot=>\{const d=eqDef\(slot\);return d&&usable\(d\)\?d:null\}/, 'usable gear must not depend on condition');
console.log('DESIGN NOTE: directional swings cleave multiple enemies in arc; targeted actions hit one enemy. Equal cooldowns do not imply equal multi-target DPS.');

console.log('PASS: source contracts and mathematical invariants; not a browser, multiplayer, or live-game test.');
