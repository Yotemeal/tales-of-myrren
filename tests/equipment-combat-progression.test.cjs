'use strict';
// Actual equipment definitions versus the two existing bear encounters.
// Uses the shipped damage and mitigation functions, not hand-copied armour
// tables. DPS/TTK figures are deterministic stationary expectations, not a
// substitute for dodge, food, networked players or movement playtests.
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const slotKind={head:'helm',body:'body',hands:'gloves',legs:'legs',boots:'boots',shield:'shield'};
const tiers=[
  {id:'bronze',name:'Bronze',level:1,def:13,atk:1},
  {id:'iron',name:'Iron',level:10,def:26,atk:3},
  {id:'steel',name:'Steel',level:20,def:47,atk:6},
  {id:'cobalt',name:'Black Iron',level:30,def:75,atk:12},
  {id:'obsidianite',name:'Obsidianite',level:40,def:94,atk:17},
  {id:'aether',name:'Myrrenite',level:55,def:118,atk:22},
  {id:'starsteel',name:'Starsteel',level:70,def:145,atk:30}
];

(async()=>{
  const {game:g}=await createGame();
  const slots=Object.entries(slotKind);
  const gear=(id,level)=>{
    g.save.xp.melee=g.xpTable[level];
    for(const [slot,kind] of slots)g.save.eq[slot]=id+'_'+kind;
    g.save.eq.weapon=id+'_sword';
    g.save.eq.ring=null;g.save.eq.neck=null;
  };
  const hitChance=(level,monster,attack)=>
    clamp(.55+(level-monster.def)*.03+attack*.01,.25,.95);
  const expectedTTK=(level,monster,attack)=>{
    const averageDamage=(3+Math.floor(level/4)+attack)/2;
    const dps=hitChance(level,monster,attack)*averageDamage/.9;
    return monster.hp/dps;
  };
  const expectedIncoming=(level,monster,defence,mitigation)=>{
    const chance=clamp(.75+(monster.lv-level)*.008-defence*.0012,.35,.9);
    // Raw attacks roll uniformly from 1 through the configured max hit.
    return chance*(1+monster.max)/2*(1-mitigation);
  };
  const oldByTier={};
  for(const t of tiers){
    gear(t.id,t.level);
    const allDef=slots.map(([slot])=>g.activeDef(slot));
    assert(allDef.every(Boolean),t.name+' full armour must be usable at its Combat level');
    for(let i=0;i<slots.length;i++){
      const [slot,kind]=slots[i],piece=allDef[i];
      assert.equal(piece.id,t.id+'_'+kind);
      assert.equal(piece.req,t.level,t.name+' armour combat requirement');
      assert.equal(piece.slot,slot,'worn item must occupy the correct paperdoll slot');
    }
    assert.equal(g.activeDef('weapon').id,t.id+'_sword');
    assert.equal(g.defTotal(),t.def,t.name+' expected full armour defence');
    assert.equal(g.atkBonus(),t.atk,t.name+' sword attack bonus');
    assert(g.defRed()>0&&g.defRed()<.45,'real defence is positive but cannot block all attacks');
    oldByTier[t.id]={D:g.defTotal(),reduction:g.defRed()};
    g.save.xp.melee=g.xpTable[Math.max(1,t.level-1)];
    if(t.level>1){
      assert.equal(g.defTotal(),0,'locked '+t.name+' armour must not grant defence');
      assert.equal(g.atkBonus(),0,'locked '+t.name+' sword must not grant attack');
    }
  }
  for(let i=1;i<tiers.length;i++){
    assert(oldByTier[tiers[i].id].D>oldByTier[tiers[i-1].id].D,
      'higher full-set armour always increases defence');
    assert(oldByTier[tiers[i].id].reduction>oldByTier[tiers[i-1].id].reduction,
      'higher full-set armour increases damage reduction');
  }
  const myrren=tiers.find(t=>t.id==='aether');
  const star=tiers.find(t=>t.id==='starsteel');
  const obs=tiers.find(t=>t.id==='obsidianite');
  const aetherBear=g.MT.abear,caveBear=g.MT.cave;
  assert.equal(aetherBear.hp,520,'do not silently change high-tier boss health');
  assert.equal(caveBear.hp,150,'do not silently change mid-game boss health');
  assert.equal(g.combatKillXp(aetherBear),3120,'boss XP remains unchanged');
  assert.equal(g.combatKillXp(caveBear),1050,'cave boss XP remains unchanged');

  const damage=(level,defence)=>expectedIncoming(level,aetherBear,defence,
    Math.min(.45,.5*defence/(defence+70)));
  const ob55=damage(55,obs.def),my55=damage(55,myrren.def),
    my70=damage(70,myrren.def),st70=damage(70,star.def);
  const myrrenGain=1-my55/ob55,starGain=1-st70/my70;
  assert(myrrenGain>=.07&&myrrenGain<=.10,
    'the costly Obsidianite → Myrrenite set should save 7–10% incoming Aether-bear damage');
  assert(starGain>=.075&&starGain<=.11,
    'the Myrrenite → Starsteel set should still save 7.5–11% incoming Aether-bear damage');

  // Check the production engine applies the armour rules, not just a model.
  const savedRandom=Math.random;
  const bear={t:'abear',lunge:0};
  try{
    Math.random=()=>.5;
    gear('obsidianite',55);g.me.hp=g.hpMax();
    const beforeOb=g.me.hp;
    g.damagePlayerFromMonster(bear,aetherBear,10_000);
    const obsHit=beforeOb-g.me.hp;
    gear('aether',55);g.me.hp=g.hpMax();
    const beforeMy=g.me.hp;
    g.damagePlayerFromMonster(bear,aetherBear,12_000);
    const myHit=beforeMy-g.me.hp;
    assert(myHit>0&&obsHit>myHit,
      'identical live Aether-bear attack does less actual HP damage with Myrrenite');
  }finally{Math.random=savedRandom}

  // Matching-gear bosses are valuable challenges. Under-tier solo fighting
  // remains inefficient while the matching Starsteel tier remains soloable,
  // assuming one enemy at a time, no food, no dodging, and steady attacks.
  const scenarios=[
    {mob:caveBear,level:30,tier:'cobalt',min:20,max:45},
    {mob:caveBear,level:40,tier:'obsidianite',min:8,max:25},
    {mob:aetherBear,level:55,tier:'aether',min:40,max:100},
    {mob:aetherBear,level:70,tier:'starsteel',min:15,max:40}
  ];
  const outcomes=[];
  for(const s of scenarios){
    gear(s.tier,s.level);
    const ttk=expectedTTK(s.level,s.mob,g.atkBonus());
    const incoming=expectedIncoming(s.level,s.mob,g.defTotal(),g.defRed());
    const stationaryHpLost=ttk/s.mob.iv*incoming;
    assert(ttk>=s.min&&ttk<=s.max,
      'boss damage/HP pacing regressed at Combat '+s.level+': '+ttk.toFixed(1)+'s');
    assert(Number.isFinite(stationaryHpLost)&&stationaryHpLost>0);
    if(s.level===55)assert(stationaryHpLost>g.hpMax(),
      'an under-tier Aether-bear fight requires food, avoidance or help');
    if(s.level===70)assert(stationaryHpLost<g.hpMax()*.4,
      'a suitably equipped level-70 character should be able to solo with smart play');
    if(s.level===30)assert(stationaryHpLost<g.hpMax(),
      'a well-geared Combat-30 player should be able to attempt Cave bear solo');
    outcomes.push({mob:s.mob.name,level:s.level,gear:s.tier,ttk:+ttk.toFixed(1),
      stationaryHpLost:+stationaryHpLost.toFixed(1)});
  }
  assert(outcomes[0].ttk>outcomes[1].ttk*1.6,
    'Cave bear rewards an upgraded sword and Combat levels without becoming an early XP exploit');
  assert(outcomes[2].ttk>outcomes[3].ttk*2.5,
    'under-tier Aether bear combat remains far slower than the intended high-tier approach');
  console.log('Expected solo boss pace (steady attack, no dodge/heal): '+JSON.stringify(outcomes));
  console.log('Myrrenite survival improvement '+(myrrenGain*100).toFixed(1)+
    '%; Starsteel follow-up '+(starGain*100).toFixed(1)+'%');
  console.log('PASS: all seven equipment tiers, level gates, armour resilience, actual incoming damage, boss TTK and XP parity');
})().catch(err=>{console.error(err);process.exitCode=1});
