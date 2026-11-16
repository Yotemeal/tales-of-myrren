'use strict';
// Short, readable woodcutting contact feedback with unchanged gathering odds,
// item/XP economy and inspect-only resource taps.
// Run: node tests/forestry-feedback-regrowth.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,rectCount,renderedText}=await createGame();
  const trees={
    tree:{old:[12,20],next:[10,16],xp:25,req:1,base:.34,dep:.5},
    oak:{old:[16,26],next:[14,22],xp:55,req:10,base:.22,dep:.65},
    maple:{old:[20,30],next:[18,27],xp:120,req:30,base:.2,dep:.7},
    elder:{old:[24,36],next:[22,34],xp:520,req:60,base:.15,dep:.75},
    myrren:{old:[30,45],next:[28,42],xp:1900,req:85,base:.1,dep:.8}
  };
  const leafColors=new Set();
  for(const [k,e] of Object.entries(trees)){
    const n=g.NT[k],p=g.forestryHitPalette({k});
    assert.equal(n.skill,'woodcutting');
    assert.equal(n.tool,'axe','hatchet remains required');
    assert.deepEqual(Array.from(n.rt),e.next,'shorter '+k+' regrowth window');
    assert(n.rt[0]<e.old[0]&&n.rt[1]<e.old[1],'both regrowth bounds improve');
    assert(n.rt[0]>=e.old[0]*.8&&n.rt[1]>=e.old[1]*.8,
      k+' must not suddenly oversupply timber');
    assert.equal(n.xp,e.xp,'unchanged Forestry XP for '+k);
    assert.equal(n.req,e.req,'unchanged Forestry unlock for '+k);
    assert.equal(n.base,e.base,'unchanged chop success chance for '+k);
    assert.equal(n.dep,e.dep,'unchanged tree depletion chance for '+k);
    assert.deepEqual([p.bark.length,p.leaf.length],[2,2]);
    leafColors.add(p.leaf[0]);
  }
  assert.equal(leafColors.size,5,'woodcutting leaves reflect all five tree species');

  const random=Math.random;
  g.me.x=g.CX;g.me.y=g.CY;g.me.fx=1;g.me.fy=0;
  g.save.eq.weapon='bronze_axe';
  g.save.pets.woodcutting=1; // avoid unrelated pet unlocks
  const tree={k:'tree',x:g.me.x+12,y:g.me.y+2,back:0};
  try{
    const xp0=g.save.xp.woodcutting,logs0=g.save.inv.logs||0;
    Math.random=()=>.999;
    g.beginAct('node',tree);g.doAction(.9,1000);
    assert.equal(tree.chopHitAt,1000);
    assert.equal(tree.chopSucceeded,false,'a failed chop has muted bark feedback');
    assert.equal(tree.fellAt,undefined,'failed chops do not fell trees');
    assert.equal(tree.back,0);
    assert.equal(g.save.xp.woodcutting,xp0,'failed chops never grant XP');
    assert.equal(g.save.inv.logs,logs0,'failed chops never give timber');
    assert(g.getAct(),'players may keep chopping after an unsuccessful hit');

    const missStart=rectCount();
    g.drawForestryImpact(tree,45,55,1030);
    const missPixels=rectCount()-missStart;
    assert.equal(missPixels,2,'a missed swing leaves two small bark chips');
    const missExpired=rectCount();
    g.drawForestryImpact(tree,45,55,1400);
    assert.equal(rectCount(),missExpired,'miss particles expire on schedule');

    Math.random=()=>0;
    g.doAction(1.8,3000);
    assert.equal(tree.chopHitAt,3000);
    assert.equal(tree.chopSucceeded,true);
    assert.equal(tree.fellAt,3000,'depleted tree marks the fall once');
    assert.equal(tree.back,13000,'earliest starter-tree regrowth is ten seconds');
    assert.equal(g.getAct(),null,'woodcutting stops when a tree becomes a stump');
    assert.equal(g.save.inv.logs,logs0+1,'one log awarded per successful chop');
    assert.equal(g.save.xp.woodcutting,xp0+25,'normal Forestry XP only');
    assert.equal(g.xpPopups[0].skill,'woodcutting');
    assert.equal(g.xpPopups[0].amount,25);

    const successStart=rectCount();
    g.drawForestryImpact(tree,45,55,3030);
    const successPixels=rectCount()-successStart;
    assert(successPixels>missPixels,'fell trees shed bark and canopy leaves');
    const fellLate=rectCount();
    g.drawForestryImpact(tree,45,55,3840);
    assert(rectCount()>fellLate,'some leaves remain briefly after the trunk falls');
    const expired=rectCount();
    g.drawForestryImpact(tree,45,55,3970);
    assert.equal(rectCount(),expired,'tree leaves stop rendering after 960ms');

    const beforeRestore=rectCount();
    g.drawForestryImpact(tree,45,55,13001);
    assert.equal(rectCount()-beforeRestore,2,'brief regrowth glint is two native pixels');
    const afterGlint=rectCount();
    g.drawForestryImpact(tree,45,55,13650);
    assert.equal(rectCount(),afterGlint,'glint is gone after 600ms');
    const original=[tree.x,tree.y,tree.back,g.save.inv.logs,g.save.xp.woodcutting];
    g.drawTree(tree,45,55,3030); // real tree draw path must not throw or alter resources
    assert.deepEqual([tree.x,tree.y,tree.back,g.save.inv.logs,g.save.xp.woodcutting],original,
      'forest drawing is never allowed to modify progression or spawn positions');
    const snapshot=JSON.stringify(g.snap());
    for(const transient of ['chopHitAt','chopSucceeded','fellAt'])
      assert(!snapshot.includes(transient),'ephemeral effects must not persist: '+transient);

    const labelBefore=renderedText.length;
    tree.tipAt=4000;g.nodeTip(tree,45,55,4100);
    assert.deepEqual(renderedText.slice(labelBefore),Array(5).fill('Pine tree (Lv 1)'),
      'tapping a depleted tree still only shows its name and level');
    const other={k:'elder',back:24000,tipAt:5000};
    const otherBefore=renderedText.length;
    g.nodeTip(other,45,55,5100);
    assert.deepEqual(renderedText.slice(otherBefore),Array(5).fill('Willow tree (Lv 60)'));
    assert.equal(g.getAct(),null,'inspection cannot start woodcutting');

    const source=fs.readFileSync('public/myrren-game.js','utf8');
    assert(source.includes('if(best){best.tipAt=now;return}'),'resource tapping is still inspect-only');
    assert(!source.includes('tapMineRock')&&!source.includes('tapChopTree'),
      'no tap-to-gather shortcut was introduced');
    console.log('PASS: five tree tiers, modest regrowth, axe contact, failed/successful chops, fall leaves, expiry, exact XP/logs, saves and inspect-only taps.');
  }finally{Math.random=random}
})().catch(e=>{console.error(e);process.exitCode=1});
