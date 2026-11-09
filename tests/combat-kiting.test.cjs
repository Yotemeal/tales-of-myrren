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
assert(begin.includes('pendingStrike={x:me.x,y:me.y,fx:me.fx,fy:me.fy,reach:w?30:22}'),
  'capture player position, direction and weapon reach at swing input');
assert(resolve.includes('if(!strikeHitsTarget(strike,m))continue;'),
  'delayed damage must use original strike rather than movement during animation');
assert(source.includes('me.pend=0;pendingStrike=null;me.swing=-99999;'),
  'death must clear pending damage');
assert(source.includes('const SWING_IV=900'),'attack cooldown must not be accelerated by kiting');
console.log('PASS: strike snapshot enables responsive kiting without extra range or attack speed');
