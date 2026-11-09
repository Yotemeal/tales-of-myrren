'use strict';
// Crowd readability: overlays and damage numbers are screen-space only.
// Run: node tests/combat-overlay-layout.test.cjs
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,rectCount}=await createGame();
  g.mons.length=0;g.splats.length=0;
  g.me.x=g.CX;g.me.y=g.CY;
  const cx=g.me.x-200,cy=g.me.y-200,now=1050;
  const make=(dx,dy=4)=>({t:'slime',state:'chase',x:g.me.x+dx,y:g.me.y+dy,hp:4,face:1,cd:0});
  const focus=make(0),group=[focus,make(5),make(10),make(15),make(20),make(25)];
  g.mons.push(...group);g.me.tgt=focus;g.me.tgtUntil=2000;
  const original=group.map(m=>[m.x,m.y,m.hp,m.state]);
  const xp=g.save.xp.melee;
  const bars=g.layoutMonsterOverlays(cx,cy,now);
  assert(bars.length>1,'crowded wounded monsters retain useful secondary health bars');
  assert.equal(bars[0].m,focus,'the current target receives first screen-space priority');
  assert.equal(bars[0].showBar,true,'focused target keeps a bar even when healthy');
  assert(bars[0].name.includes('Slime'),'focused target keeps its identity label');
  assert(bars.slice(1).every(b=>!b.name),'secondary names disappear in a crowd');
  for(let i=0;i<bars.length;i++)for(let j=0;j<i;j++)
    assert(!g.combatRectOverlaps(bars[i].rect,bars[j].rect),'monster overhead panels never overlap');

  // Small encounters still display names for discovery when nothing is locked.
  g.me.tgt=null;g.mons.splice(2);
  const pair=g.layoutMonsterOverlays(cx,cy,now);
  assert.equal(pair.length,2,'both monsters remain identifiable when the area is quiet');
  assert(pair.every(p=>p.name.includes('Slime')),'names remain available outside crowded fights');
  assert(!g.combatRectOverlaps(pair[0].rect,pair[1].rect),'pair labels must stagger apart');

  g.mons.length=0;g.mons.push(...group);g.me.tgt=focus;
  g.splats.length=0;
  for(let i=0;i<60;i++)g.splat(g.me.x+5,g.me.y-16,i%8?i+1:0);
  assert.equal(g.splats.length,40,'the number pool is bounded under heavy combat');
  const p=g.layoutDamagePopups(1020,cx,cy,bars);
  assert(p.length>=4,'multiple recent hits stay separately readable');
  assert(p.some(e=>e.value==='MISS'),'misses use a distinct text label');
  for(const hit of p){
    assert(hit.rect.x>=0&&hit.rect.y>=0,'popup stays within screen bounds');
    for(const overlay of bars)assert(!g.combatRectOverlaps(hit.rect,overlay.rect),'popup must not hide a health bar or target name');
  }
  for(let i=0;i<p.length;i++)for(let j=0;j<i;j++)
    assert(!g.combatRectOverlaps(p[i].rect,p[j].rect),'multiple damage popups cannot stack on top of each other');

  const before=rectCount();
  g.drawDamagePopups(1030,cx,cy,bars);
  g.drawMonsterOverlays(bars);
  assert(rectCount()>before,'damage popups and health bars produce actual pixel art');
  assert.deepEqual(group.map(m=>[m.x,m.y,m.hp,m.state]),original,'overlay drawing cannot move or damage enemies');
  assert.equal(g.save.xp.melee,xp,'visual layout must not affect combat rewards');

  const expired=g.layoutDamagePopups(2000,cx,cy,bars);
  assert.equal(expired.length,0,'old numbers are no longer shown');
  assert.equal(g.splats.length,0,'expired numbers are removed from memory');
  console.log('PASS: crowded target priority, staggered health bars, readable hit/miss numbers, bounds, effect caps, expiry and unchanged gameplay.');
})().catch(e=>{console.error(e);process.exitCode=1});
