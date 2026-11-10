'use strict';
// Dedicated cooking queue and purely visual fishing feedback.
// Run: node tests/cooking-fishing-workflow.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g,elements,rectCount,renderedText}=await createGame();
  const oldNow=Date.now,oldRandom=Math.random;
  let clock=1_000_000;Date.now=()=>clock;
  try {
    const fire={x:g.CX+176,y:g.CY-90};
    g.me.x=fire.x;g.me.y=fire.y;
    g.save.xp.cooking=g.xpTable[70]; // all five recipes available
    g.save.inv.rshrimp=5;g.save.inv.shrimp=0;
    assert.equal(g.openCooking('fire'),true);
    assert.equal(g.getTab(),'cook','the campfire opens a dedicated cooking window');
    assert.equal(elements.get('modal').dataset.screen,'cook');
    assert.equal(elements.get('mTitle').textContent,'Campfire · Cooking');
    assert(!g.curShop(),'campfire is not a merchant');
    assert(elements.get('mBody').children.some(x=>x.className==='smith-work'),'cooking recipe start controls exist');
    assert.equal(g.cookingChance('rshrimp'),.97,'original cooking success cap is unchanged');
    assert.equal(g.cookingChance('invalid'),0);

    g.setCookQuantity(5);
    const xp0=g.save.xp.cooking;
    assert.equal(g.startCooking('rshrimp'),true);
    assert.equal(g.getCookJob().total,5);
    clock+=1499;g.cookTick(clock);
    assert.equal(g.save.inv.rshrimp,5,'no fish consumed before 1.5-second interval');
    Math.random=()=>0;
    clock++;g.cookTick(clock);
    assert.equal(g.save.inv.rshrimp,4);
    assert.equal(g.save.inv.shrimp,1);
    assert.equal(g.save.xp.cooking,xp0+35,'one cooked shrimp awards exactly original XP');
    Math.random=()=>.999;
    clock+=1500;g.cookTick(clock);
    assert.equal(g.save.inv.rshrimp,3,'a burnt fish is consumed');
    assert.equal(g.save.inv.shrimp,1,'a burnt fish produces no food');
    assert.equal(g.save.xp.cooking,xp0+35,'a burnt fish awards no XP');
    Math.random=()=>0;
    for(let i=0;i<3;i++){clock+=1500;g.cookTick(clock)}
    assert.equal(g.save.inv.rshrimp,0);
    assert.equal(g.save.inv.shrimp,4);
    assert.equal(g.save.xp.cooking,xp0+4*35);
    assert.equal(g.getCookJob(),null,'batch ends at chosen count');
    assert(!JSON.stringify(g.snap()).includes('cookJob'),'queue never enters a save');
    assert(g.xpPopups.some(p=>p.skill==='cooking'),'cooking XP uses existing transient drops');

    // Recipe selection chooses one species; All never switches to a different
    // fish automatically and no action creates food without an input.
    g.save.inv.rshrimp=2;g.save.inv.rtrout=3;
    g.setCookQuantity('all');
    assert(g.startCooking('rshrimp'));
    assert.equal(g.getCookJob().total,2);
    Math.random=()=>0;
    for(let i=0;i<2;i++){clock+=1500;g.cookTick(clock)}
    assert.equal(g.getCookJob(),null);
    assert.equal(g.save.inv.rtrout,3,'batch does not silently use a different fish');

    // Cancel on menu switch, no offscreen progress, no supplies consumed.
    g.save.inv.rshrimp=3;g.setCookQuantity(10);
    assert(g.startCooking('rshrimp'));
    const rawBefore=g.save.inv.rshrimp;
    g.openModal('pack');
    assert.equal(g.getCookJob(),null);
    clock+=9000;g.cookTick(clock);
    assert.equal(g.save.inv.rshrimp,rawBefore);
    g.openCooking('fire');
    assert(g.startCooking('rshrimp'));
    g.me.x+=55;clock+=1500;g.cookTick(clock);
    assert.equal(g.getCookJob(),null,'leaving fire cancels queue');
    assert.equal(g.save.inv.rshrimp,rawBefore,'no cooking at a distance');
    assert.equal(g.startCooking('rshrimp'),false,'cannot start from a distance');
    g.me.x=fire.x;g.me.y=fire.y;
    g.openCooking('fire');g.save.xp.cooking=0;g.save.inv.reel=2;
    assert.equal(g.startCooking('reel'),false,'locked cooking tier cannot start');

    const css=fs.readFileSync('public/myrren-ui.css','utf8');
    assert(css.includes('[data-screen="cook"]'));
    assert(css.includes('.window-footer { display:none; }'),'campfire menu hides merchant footer');
    const source=fs.readFileSync('public/myrren-game.js','utf8');
    assert(source.includes('if(best){best.tipAt=now;return}'),'resource taps must only inspect');
    assert(!source.includes('tapMineRock'),'no resource tapping starts gathering');

    // Fishing retains the original rod/net, bait, success and XP rules; splash
    // effects only change drawings, not catch probabilities or inventory.
    g.closeModal();
    g.me.x=g.CX;g.me.y=g.CY;g.me.fx=1;g.me.fy=0;
    g.save.xp.fishing=g.xpTable[12];
    g.save.eq.weapon='bronze_rod';
    g.save.inv.bait=2;g.save.inv.rtrout=0;
    const spot={k:'spot2',x:g.me.x+11,y:g.me.y,back:0};
    g.beginAct('node',spot);
    Math.random=()=>0;
    g.doAction(.3,2000);
    assert.equal(spot.fishCastAt,2000,'rod cast creates a visual ripple');
    assert.equal(g.save.inv.bait,1,'one bait is spent on the rod cast');
    const beforeRects=rectCount();
    g.drawSpot(spot,45,50,2100);
    assert(rectCount()>beforeRects,'cast displays short water pixels');
    const xpFish=g.save.xp.fishing;
    g.doAction(2.4,4500);
    assert.equal(spot.fishHitAt,4500);
    assert.equal(spot.fishSucceeded,true);
    assert.equal(g.save.inv.rtrout,1,'a caught fish enters inventory exactly once');
    assert.equal(g.save.xp.fishing,xpFish+g.NT.spot2.xp);
    const beforeHit=rectCount();
    g.drawSpot(spot,45,50,4520);
    assert(rectCount()>beforeHit,'caught fish has a brighter brief splash');

    // Another rod cast with a failed catch consumes bait but awards no XP.
    spot.back=0;g.beginAct('node',spot);
    Math.random=()=>.999;
    g.doAction(.3,6000);
    assert.equal(g.save.inv.bait,0);
    const beforeMiss=g.save.xp.fishing;
    g.doAction(2.4,8400);
    assert.equal(spot.fishSucceeded,false);
    assert.equal(g.save.xp.fishing,beforeMiss,'an escaped fish awards no XP');
    assert.equal(g.save.inv.rtrout,1,'escaped fish creates no inventory reward');
    const baseStart=rectCount();
    g.drawSpot({k:'spot2',x:spot.x,y:spot.y,back:spot.back},45,50,8900);
    const baselinePixels=rectCount()-baseStart;
    const afterMiss=rectCount();
    g.drawSpot(spot,45,50,8900);
    assert.equal(rectCount()-afterMiss,baselinePixels,
      'expired splash draws no extra pixels beyond the normal animated fishing spot');

    // Tapping a fishing spot (including a depleted one) only draws its name
    // and level; it never triggers a cast.
    const inspect={k:'spot2',back:9500,tipAt:9000};
    const textBefore=renderedText.length;
    g.nodeTip(inspect,45,50,9100);
    assert.deepEqual(renderedText.slice(textBefore),Array(5).fill('Deep fishing spot (Lv 12)'));

    console.log('PASS: cooking recipe batches, burn rates, exact XP, supplies, stop/cancel, fishing bait, visual effects and inspect-only taps.');
  }finally{Date.now=oldNow;Math.random=oldRandom}
})().catch(e=>{console.error(e);process.exitCode=1});
