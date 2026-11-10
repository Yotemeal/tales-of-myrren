'use strict';
// Mining must give clear visual feedback without changing ore economy or XP.
// Run: node tests/mining-feedback-respawn.test.cjs
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
 const {game:g,rectCount}=await createGame();
 const previous={
   copper:[8,14],tin:[8,14],iron:[12,20],coal:[14,22],
   cobalt:[18,28],obsidianite:[22,32],aether:[24,36],meteorite:[30,45]
 };
 const current={
   copper:[6,10],tin:[6,10],iron:[9,14],coal:[11,17],
   cobalt:[16,24],obsidianite:[19,29],aether:[22,33],meteorite:[28,42]
 };
 const expectedXP={copper:18,tin:18,iron:45,coal:75,cobalt:190,obsidianite:300,aether:650,meteorite:900};
 const chances={copper:.32,tin:.32,iron:.2,coal:.2,cobalt:.15,obsidianite:.12,aether:.1,meteorite:.08};
 for(const [name,timers] of Object.entries(current)){
   const def=g.NT[name],old=previous[name];
   assert.equal(def.skill,'mining');
   assert.deepEqual(Array.from(def.rt),timers,name+' respawn window');
   assert.equal(def.dep,1,'successful mine depletes one rock: '+name);
   assert.equal(def.base,chances[name],'mining rarity unchanged for '+name);
   assert.equal(def.xp,expectedXP[name],'Delving XP unchanged for '+name);
   assert(timers[0]<old[0]&&timers[1]<old[1],'respawn is shorter for '+name);
   assert(timers[0]>=old[0]*.7&&timers[1]>=old[1]*.7,
      'respawn must not inflate '+name+' supply too aggressively');
   const pal=g.miningDustColors({k:name,mineSucceeded:true});
   assert.equal(pal.length,3,'each ore needs a distinct hit palette');
 }

 // Both successful and failed swings produce a brief rock reaction, but only
 // a successful hit awards ore and XP.
 const originalRandom=Math.random;
 g.me.x=g.CX;g.me.y=g.CY;g.me.fx=1;g.me.fy=0;
 g.save.eq.weapon='bronze_pick';g.save.pets.mining=1;
 const copper={k:'copper',x:g.me.x+12,y:g.me.y+2,back:0};
 try{
   Math.random=()=>.999; // guaranteed failed ore roll at level one
   const xp0=g.save.xp.mining,ore0=g.save.inv.copper||0;
   g.beginAct('node',copper);g.doAction(.9,1000);
   assert.equal(copper.mineHitAt,1000,'rock reacts on the pickaxe contact frame');
   assert.equal(copper.mineSucceeded,false,'failed hit uses subdued fragments');
   assert.equal(copper.back,0,'failed attempt must not deplete the rock');
   assert.equal(g.save.xp.mining,xp0,'no XP for a missed ore roll');
   assert.equal(g.save.inv.copper,ore0,'no free ore on a missed roll');
   assert(g.getAct(),'mining continues after failed ore roll');

   Math.random=()=>0;
   g.doAction(1.8,3000);
   assert.equal(copper.mineHitAt,3000);
   assert.equal(copper.mineSucceeded,true);
   assert.equal(g.save.inv.copper,ore0+1,'one real ore per success');
   assert.equal(g.save.xp.mining,xp0+g.NT.copper.xp,'award the original mining XP');
   assert.equal(copper.back,9000,'lowest copper respawn equals six seconds');
   assert.equal(g.getAct(),null,'depleted rock stops ongoing mining');
   assert.equal(g.miningNodeCaption(copper,3000),'Depleted · 6s');
   assert.equal(g.miningNodeCaption(copper,8500),'Depleted · 1s');
   assert.equal(g.miningNodeCaption(copper,9000),'Copper rock (Lv 1)');
   assert(!JSON.stringify(g.snap()).includes('mineHitAt'),'short-lived mining effects must not enter saves');
   assert(!JSON.stringify(g.snap()).includes('mineSucceeded'),'visual success state must not enter saves');

   // Draw feedback on native pixel canvas without altering gameplay values.
   const origin=[copper.x,copper.y,copper.back,g.save.xp.mining,g.save.inv.copper];
   g.drawRock(copper,45,55,3020);
   const on=rectCount();
   g.drawRock(copper,45,55,3360);
   assert.equal(rectCount(),on,'fragments disappear after the 360ms window');
   g.drawRock(copper,45,55,9001);
   assert(rectCount()>on,'a short glint marks the rock returning');
   assert.deepEqual([copper.x,copper.y,copper.back,g.save.xp.mining,g.save.inv.copper],origin,
     'rendering cannot mutate ore, time, XP or position');
   const dormant=g.miningNodeCaption({k:'iron',back:9000},9500);
   assert.equal(dormant,'Iron rock (Lv 10)');
 }finally{Math.random=originalRandom}

 // Other skill nodes retain their existing respawn timers and labels.
 assert.deepEqual(Array.from(g.NT.tree.rt),[12,20]);
 assert.deepEqual(Array.from(g.NT.spot1.rt),[8,14]);
 assert.equal(g.miningNodeCaption({k:'tree',back:99999},1000),'Tree (Lv 1)');
 console.log('PASS: mining cooldown tuning, exact ore and XP, success/miss response, depleted timer, respawn glint, visual expiry and save compatibility.');
})().catch(e=>{console.error(e);process.exitCode=1});
