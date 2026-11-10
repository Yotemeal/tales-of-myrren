'use strict';
// Real-game progression data: availability, supply-limited gathering ceilings,
// material chain arithmetic, inventory flow and accessible action targets.
// Run: node tests/skilling-loop-audit.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g}=await createGame();
  const milestones=[1,10,20,30,40,55,60,70,85,95,100];
  const skills=['woodcutting','mining','fishing'];
  const toolAt=(type,level)=>{
    const candidates=Object.values(g.DEFS).filter(d=>
      d.tool&&d.req<=level&&(d.kind===type||(type==='net'&&d.kind==='rod')));
    return candidates.sort((a,b)=>b.mat-a.mat)[0]||null;
  };
  const successChance=(node,level,mat)=>
    Math.max(.05,Math.min(.92,node.base+(level-node.req)*.025+Math.max(0,mat-2)*.06));
  const gatherInterval=(skill)=>skill==='fishing'?3.3:1.8;
  const resourceRate=(name,node,level)=>{
    const tool=toolAt(node.tool,level);
    assert(tool,'no usable '+node.tool+' at level '+level);
    const chance=successChance(node,level,tool.mat);
    const actionSeconds=gatherInterval(node.skill);
    const cooldownSeconds=(node.rt[0]+node.rt[1])/2*node.dep;
    const actionLimited=3600*chance/actionSeconds;
    const oneNode=3600/(actionSeconds/chance+cooldownSeconds);
    assert(oneNode<=actionLimited+1e-7,'cooldowns must not increase XP/hour');
    return {name,tool:tool.id,chance,actionLimited,oneNode,
      idealXpHour:actionLimited*node.xp,oneNodeXpHour:oneNode*node.xp};
  };

  const rateTable=[];
  for(const level of milestones){
    const row={level};
    for(const skill of skills){
      const options=Object.entries(g.NT).filter(([,n])=>n.skill===skill&&n.req<=level)
        .map(([name,n])=>resourceRate(name,n,level));
      assert(options.length,'all gathering skills need progression content at '+level);
      options.sort((a,b)=>b.idealXpHour-a.idealXpHour);
      const best=options[0];
      assert(best.idealXpHour>0&&Number.isFinite(best.idealXpHour));
      row[skill]=best;
    }
    rateTable.push(row);
  }
  // This is an upper-bound model, not measured gameplay. It excludes walking,
  // the time spent reselecting depleted resources, banking and competition.
  const headings='Level | Best Forestry | Best Delving | Best Fishing';
  console.log(headings);
  for(const row of rateTable){
    const entry=skill=>row[skill].name+' '+Math.round(row[skill].idealXpHour/1000)+'k/hr ideal, '+Math.round(row[skill].oneNodeXpHour/1000)+'k/hr single-node';
    console.log(row.level+' | '+entry('woodcutting')+' | '+entry('mining')+' | '+entry('fishing'));
  }
  assert.equal(g.xpTable[100],249604271,'the level-100 XP curve cannot change silently');
  for(let L=1;L<100;L++)assert(g.xpTable[L+1]>g.xpTable[L],'XP requirements increase');
  const growth=g.xpTable[100]-g.xpTable[85];
  assert(growth>200000000,'late-game requirements remain steep and should not be balanced from one-tick XP');
  const nodeCounts={};
  for(const n of g.nodes)nodeCounts[n.k]=(nodeCounts[n.k]||0)+1;
  for(const [name,n] of Object.entries(g.NT)){
    assert(nodeCounts[name]>0,name+' has no spawned gatherable world nodes');
    assert(n.rt[0]>0&&n.rt[1]>=n.rt[0],'respawn range invalid for '+name);
    assert(n.base>0&&n.base<=1&&n.dep>0&&n.dep<=1,'invalid supply rate for '+name);
  }
  // Ingredient chains must actually be accessible when the ingot unlocks;
  // no crafted metal is allowed to require ore unlocked at a later level.
  const metalCosts={};
  for(const recipe of g.SMELT){
    const requirements={};
    for(const [ore,amount] of Object.entries(recipe.in)){
      assert(g.NT[ore],'missing ore source for '+recipe.id+': '+ore);
      assert(g.NT[ore].req<=recipe.req,
        recipe.id+' smelting unlock precedes access to '+ore);
      requirements[ore]=amount*g.FORGE.sword;
    }
    const rawXp=g.FORGE.sword*recipe.xp;
    const finishedXp=g.forgeXp(recipe,g.FORGE.sword);
    assert(finishedXp>rawXp,'gear must award more XP than its component bars');
    metalCosts[recipe.id]={req:recipe.req,swordOre:requirements,
      ingots:g.FORGE.sword,smeltingXp:rawXp,forgingXp:finishedXp};
  }
  console.log('Per-sword material cost (four bars each): '+JSON.stringify(metalCosts));
  for(const [raw,recipe] of Object.entries(g.COOK)){
    const source=Object.values(g.NT).find(n=>n.item===raw);
    assert(source&&source.skill==='fishing','missing fish source for '+raw);
    assert(source.req<=recipe.req,'cooking fish unlocks before it can be caught');
  }

  // Unit/regression: action key picks the closest *available* target rather
  // than repeatedly hitting a closer locked rock or needing the wrong tool.
  g.nodes.length=0;
  g.me.x=g.CX;g.me.y=g.CY;g.me.fx=1;g.me.fy=0;
  const pos=(k,d)=>({k,x:g.me.x+d,y:g.me.y+2,back:0});
  g.save.eq.weapon='bronze_pick';
  g.save.xp.mining=0;
  const lockedIron=pos('iron',9),usableCopper=pos('copper',14);
  g.nodes.push(lockedIron,usableCopper);
  assert(g.nodeOK(lockedIron)&&g.nodeOK(usableCopper));
  assert.equal(g.readyToGather(lockedIron),false,'level requirement must be checked');
  assert.equal(g.readyToGather(usableCopper),true);
  assert.equal(g.facingNode(1000),usableCopper,'skip closer locked mining resource');
  usableCopper.back=2000;
  assert.equal(g.facingNode(1000),lockedIron,
    'with no usable resource the nearest candidate remains for an explanatory warning');
  usableCopper.back=0;

  g.save.eq.weapon='bronze_axe';
  const tree=pos('tree',14),otherCopper=pos('copper',9);
  g.nodes.splice(0,g.nodes.length,otherCopper,tree);
  assert.equal(g.facingNode(1000),tree,
    'skip closer ore when holding an axe and a valid tree is within reach');
  g.save.eq.weapon='bronze_pick';
  assert.equal(g.facingNode(1000),otherCopper,
    'with a pick equipped, prefer a gatherable ore to a nearby tree');

  // Full bag: select already-stacked material instead of an unavailable new
  // stack. Banknotes and the 36-slot policy are not changed.
  g.save.bag=Array(35).fill('bronze_pick');
  g.save.inv.copper=1;g.save.inv.tin=0;
  assert.equal(g.slotsUsed(),36);
  const tin=pos('tin',9),copper=pos('copper',14);
  g.nodes.splice(0,g.nodes.length,tin,copper);
  assert.equal(g.readyToGather(tin),false,'no new stack in a full pack');
  assert.equal(g.readyToGather(copper),true,'existing stack remains usable');
  assert.equal(g.facingNode(1000),copper,'do not dead-end gathering on an unavailable inventory slot');
  g.save.bag.length=0;

  // Rod fishing consumes bait even on shallow net-compatible water. Select
  // another target when one is inaccessible, and keep normal missing-bait
  // feedback if no targets can be fished.
  g.save.eq.weapon='bronze_rod';g.save.xp.fishing=g.xpTable[12];
  const deep=pos('spot2',9),shallow=pos('spot1',14);
  g.nodes.splice(0,g.nodes.length,deep,shallow);
  g.save.inv.bait=0;
  assert.equal(g.readyToGather(deep),false);
  assert.equal(g.readyToGather(shallow),false);
  assert.equal(g.facingNode(1000),deep,'nearest target remains available for bait warning');
  g.save.inv.bait=1;
  assert.equal(g.readyToGather(deep),true);
  assert.equal(g.facingNode(1000),deep);

  const source=fs.readFileSync('public/myrren-game.js','utf8');
  assert(source.includes('if(best){best.tipAt=now;return}'),
    'tapping all resources remains inspection-only');
  assert(!source.includes('tapMineRock')&&!source.includes('tapChopTree'),
    'resource taps must never initiate gathering');
  assert(!Object.hasOwn(g.snap(),'resourceSelection'),
    'targeting preference cannot change the save format');
  console.log('PASS: level 1–100 resource and XP model, seven metal input chains, 36-slot flow, accessible target priority, bait and inspect-only taps');
})().catch(e=>{console.error(e);process.exitCode=1});
