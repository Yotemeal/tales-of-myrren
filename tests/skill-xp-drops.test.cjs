'use strict';
// OSRS-style earned XP notifications: one transient UI for all skill sources.
// Run: node tests/skill-xp-drops.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,elements,timers}=await createGame();
  const skills=['melee','woodcutting','mining','fishing','cooking','forging'];
  const amounts=[5,25,18,30,40,50];
  const layer=elements.get('xpDrops');
  assert(layer,'XP UI layer must exist');
  for(let i=0;i<skills.length;i++){
    const before=g.save.xp[skills[i]];
    g.addXp(skills[i],amounts[i]);
    assert.equal(g.save.xp[skills[i]],before+amounts[i],'XP gains must preserve the existing progression maths');
    const drop=g.xpPopups[0];
    assert.equal(drop.skill,skills[i]);
    assert.equal(drop.amount,amounts[i]);
    assert.equal(drop.label.textContent,'+'+amounts[i]);
    assert(drop.element.children[0].innerHTML.includes('<svg'),'each skill gain must include its authored skill icon');
  }
  assert.equal(g.xpPopups.length,5,'notification pool stays bounded');
  assert.equal(layer.children.length,5,'overflow drops are removed from the DOM');
  assert.equal(g.xpPopups[0].skill,'forging','newest gain appears first');
  assert(!g.xpPopups.some(p=>p.skill==='melee'),'oldest drop is evicted under heavy action');

  // Rapid same-skill rewards combine visually but each still awards full XP.
  const initial=g.save.xp.mining;
  const a=g.queueXpDrop('mining',3,2000);
  const b=g.queueXpDrop('mining',7,2075);
  assert.equal(a,b,'rapid same-skill drops coalesce');
  assert.equal(b.amount,10);
  assert.equal(b.label.textContent,'+10');
  assert.equal(g.save.xp.mining,initial,'visual-only helper never awards XP');
  assert.equal(g.queueXpDrop('mining',0,2100),null,'no popup for zero XP');
  assert.equal(g.queueXpDrop('invalid',25,2100),null,'reject unknown skills');
  assert.equal(g.queueXpDrop('mining',Infinity,2100),null,'invalid values cannot create a popup');
  const beforeExpiry=layer.children.length;
  const lastTimer=timers.filter(p=>p.delay===1200).at(-1);
  assert(lastTimer,'transient entry schedules cleanup');
  lastTimer.fn();
  assert.equal(b.element.removed,true,'expired popup is detached from the DOM');
  assert(!g.xpPopups.includes(b),'expired popup is also removed from the pool');
  assert.equal(layer.children.length,beforeExpiry-1);

  // Forging pets can increase actual XP; the popup must show that bonus.
  const boosted=(await createGame()).game;
  boosted.save.pets.forging=1;
  boosted.addXp('forging',100);
  assert.equal(boosted.save.xp.forging,103,'existing 3% pet bonus remains unchanged');
  assert.equal(boosted.xpPopups[0].amount,103,'drop shows awarded XP, including pet bonuses');

  // Monster kills award XP once; ordinary nonlethal swings should not pop XP.
  const {game:t}=await createGame();
  t.mons.length=0;t.me.x=t.CX;t.me.y=t.CY;t.me.tgt=null;t.me.pend=0;
  const m={t:'slime',state:'idle',x:t.me.x,y:t.me.y+4,hx:t.me.x,hy:t.me.y+4,hp:5,back:0,cd:0,prov:false};
  t.mons.push(m);
  const originalRandom=Math.random;
  try{
    Math.random=()=>0;
    t.beginSwing(1000);t.resolveSwing(1110);
    assert.equal(m.hp,4);
    assert.equal(t.xpPopups.length,0,'nonlethal attacks do not grant fake XP');
    m.hp=1;t.me.pend=0;
    t.beginSwing(2000);t.resolveSwing(2110);
    assert.equal(m.state,'dead');
    assert.equal(t.save.xp.melee,5,'monster awards its fixed kill XP');
    assert.equal(t.xpPopups.length,1);
    assert.equal(t.xpPopups[0].skill,'melee');
    assert.equal(t.xpPopups[0].label.textContent,'+5');
    t.killMon(m,2120);
    assert.equal(t.xpPopups.length,1,'repeat kill cannot duplicate XP notifications');
  }finally{Math.random=originalRandom}

  const page=fs.readFileSync('public/index.html','utf8');
  const css=fs.readFileSync('public/myrren-ui.css','utf8');
  assert(page.includes('id="xpDrops" aria-hidden="true"'),'XP drops must be decorative and invisible to screen readers');
  assert(css.includes('#xpDrops .xp-drop')&&css.includes('myrren-xp-rise'),'animated XP overlay must be styled');
  assert(css.includes('pointer-events: none'),'XP layer must never block mobile movement or attacks');
  assert(!JSON.stringify(t.snap()).includes('xpPopups'),'transient XP UI never persists in saves');

  console.log('PASS: six skill icons, actual awarded XP, pet bonuses, kills only, stacking, fade lifecycle, cap, touch safety and save integrity.');
})().catch(e=>{console.error(e);process.exitCode=1});
