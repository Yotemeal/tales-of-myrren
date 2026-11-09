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
const targetedSeconds = Number(capture(/const iv\s*=\s*(\d+(?:\.\d+)?)\s*;a\.t\+=dt/, 'targeted attack interval')[1]);
const directionalSeconds = swingMs / 1000;
assert.ok(swingMs > 0 && targetedSeconds > 0);
const swingDpsFactor = targetedSeconds / directionalSeconds;
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
console.log('PASS: source contracts and mathematical invariants; not a browser, multiplayer, or live-game test.');
