'use strict';
// Mining should keep XP per ore and visual feedback while letting veins yield
// multiple successful gathers before depletion.
// Run: node tests/mining-feedback-respawn.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

(async()=>{
 const {game:g,rectCount,renderedText,elements}=await createGame();
 const recentChat=()=>elements.get('chat').children.slice(-2).map(e=>e.textContent).join('\n');
 const previous={
   copper:[8,14],tin:[8,14],iron:[12,20],coal:[14,22],
   cobalt:[18,28],obsidianite:[22,32],aether:[24,36],meteorite:[30,45]
 };
 const current={
   copper:[6,10],tin:[6,10],iron:[9,14],coal:[11,17],
   cobalt:[16,24],obsidianite:[19,29],aether:[22,33],meteorite:[28,42]
 };
 const expectedXP={copper:18,tin:18,iron:45,coal:75,cobalt:190,obsidianite:300,aether:650,meteorite:900};
 const chances={copper:.42,tin:.42,iron:.26,coal:.26,cobalt:.15,obsidianite:.12,aether:.1,meteorite:.08};
 const veins={copper:6,tin:6,iron:5,coal:5,cobalt:4,obsidianite:3,aether:3,meteorite:2};
 for(const [name,timers] of Object.entries(current)){
   const def=g.NT[name],old=previous[name];
   assert.equal(def.skill,'mining');
   assert.deepEqual(Array.from(def.rt),timers,name+' respawn window');
   assert.equal(def.dep,1,'vein exhaustion triggers the existing cooldown: '+name);
   assert.equal(def.vein,veins[name],'durability should scale with ore tier: '+name);
   assert.equal(def.base,chances[name],'mining success tuning for '+name);
   assert.equal(def.xp,expectedXP[name],'Delving XP unchanged for '+name);
   assert(timers[0]<old[0]&&timers[1]<old[1],'respawn is shorter for '+name);
   assert(timers[0]>=old[0]*.7&&timers[1]>=old[1]*.7,
      'respawn must not inflate '+name+' supply too aggressively');
   const pal=g.miningDustColors({k:name,mineSucceeded:true});
   assert.equal(pal.length,3,'each ore needs a distinct hit palette');
 }

 // Upgraded pickaxes must become noticeably quicker without boosting XP
 // per ore. This follows the long-term tool progression feel of Curse of Aros.
 for(const [id,seconds] of [
   ['bronze_pick',1.8],['iron_pick',1.65],['steel_pick',1.5],
   ['cobalt_pick',1.35],['aether_pick',1.2]
 ]){
   assert.equal(g.miningInterval(g.DEFS[id]),seconds,id+' action interval');
 }
 assert.equal(g.miningInterval(null),1.8,'legacy missing tool uses safe timing');

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
   assert.equal(copper.oreLeft,undefined,'failed attempt must not consume any charges');
   assert.equal(g.save.xp.mining,xp0,'no XP for a missed ore roll');
   assert.equal(g.save.inv.copper,ore0,'no free ore on a missed roll');
   assert(g.getAct(),'mining continues after failed ore roll');

   Math.random=()=>0;
   g.doAction(1.8,3000);
   assert.equal(copper.mineHitAt,3000);
   assert.equal(copper.mineSucceeded,true);
   assert.equal(g.save.inv.copper,ore0+1,'one real ore per success');
   assert.equal(g.save.xp.mining,xp0+g.NT.copper.xp,'award the original mining XP');
   assert.equal(copper.oreLeft,5,'six-gather vein should have five charges remaining');
   assert.match(recentChat(),
     /5 ores left in this vein/,
     'the running game must show remaining ore charges after a real gather');
   assert.equal(copper.back,0,'one successful gather should not deplete a full vein');
   assert(g.getAct(),'continue mining the same rock without reselecting it');

   for(let success=2;success<=6;success++){
     const now=3000+(success-1)*1800;
     g.doAction(1.8,now);
     assert.equal(copper.oreLeft,6-success,'one charge per real success');
     assert.equal(g.save.inv.copper,ore0+success,'one ore per success');
     if(success<6){
       assert.match(recentChat(),
         new RegExp((6-success)+' ores left in this vein'),
         'remaining charges must update after every successful ore');
     }else{
       assert.match(recentChat(),
         /vein is exhausted/i,
         'only the last successful ore announces depletion');
     }
     assert.equal(g.save.xp.mining,xp0+success*g.NT.copper.xp,
       'original XP per successful ore, no extra XP for vein exhaustion');
     if(success<6){
       assert.equal(copper.back,0,'remaining ore keeps the rock available');
       assert(g.getAct(),'continuous mining does not restart between swings');
     }else{
       assert.equal(copper.back,now+6000,'sixth ore triggers original six-second cooldown');
       assert.equal(g.getAct(),null,'only exhausted veins stop mining');
     }
   }
   // Tap-to-inspect remains exactly name + level, even during depletion.
   const inspect=(node,now,expected)=>{
     node.tipAt=now-100;
     const before=renderedText.length;
     g.nodeTip(node,45,55,now);
     assert.equal(renderedText.length-before,5,'one outlined tooltip is drawn');
     assert.deepEqual(renderedText.slice(-5),Array(5).fill(expected),'the tooltip only shows name and level');
     assert.equal(g.getAct(),null,'inspect never starts gathering');
   };
   inspect(copper,3000,'Copper rock (Lv 1)');
   inspect(copper,17500,'Copper rock (Lv 1)');
   inspect(copper,18000,'Copper rock (Lv 1)');
   inspect({k:'tree',back:99999},4000,'Pine tree (Lv 1)');
   inspect({k:'spot1',back:99999},4000,'Shallow fishing spot (Lv 1)');
   assert(!JSON.stringify(g.snap()).includes('mineHitAt'),'short-lived mining effects must not enter saves');
   assert(!JSON.stringify(g.snap()).includes('mineSucceeded'),'visual success state must not enter saves');
   assert(!JSON.stringify(g.snap()).includes('oreLeft'),'world vein charges must not modify player saves');

   // Draw feedback on native pixel canvas without altering gameplay values.
   const origin=[copper.x,copper.y,copper.back,g.save.xp.mining,g.save.inv.copper];
   g.drawRock(copper,45,55,12020);
   const on=rectCount();
   g.drawRock(copper,45,55,12360);
   assert.equal(rectCount(),on,'fragments disappear after the 360ms window');
   g.drawRock(copper,45,55,18001);
   assert(rectCount()>on,'a short glint marks the rock returning');
   assert.deepEqual([copper.x,copper.y,copper.back,g.save.xp.mining,g.save.inv.copper],origin,
     'rendering cannot mutate ore, time, XP or position');
   inspect({k:'iron',back:9000},9500,'Iron rock (Lv 10)');

   // A depleted vein recharges on the first successful gather after respawn.
   g.beginAct('node',copper);
   g.doAction(.9,18000);
   assert.equal(copper.oreLeft,5,'expired vein restarts with full durability');
   assert.match(recentChat(),
     /5 ores left in this vein/,
     'respawned rock visibly resets charge count');
   assert.equal(g.save.inv.copper,ore0+7);
   assert.equal(g.save.xp.mining,xp0+7*g.NT.copper.xp);

   // A real equipped upgraded pickaxe should finish a swing earlier than
   // Bronze without giving double items or XP.
   const beforeIronXp=g.save.xp.mining,beforeIronOre=g.save.inv.iron||0;
   const oldWeapon=g.save.eq.weapon,oldMiningXp=g.save.xp.mining;
   g.save.eq.weapon='iron_pick';
   g.save.xp.mining=Math.max(g.save.xp.mining,g.xpTable[15]);
   const iron={k:'iron',x:g.me.x+12,y:g.me.y+2,back:0};
   g.beginAct('node',iron);
   g.doAction(.74,22000);
   assert.equal(iron.oreLeft,undefined,'one iron swing takes more than 1.64 seconds');
   g.doAction(.01,22010);
   assert.equal(iron.oreLeft,4,'iron pickaxe completes one 1.65s gather');
   assert.equal(g.save.inv.iron,beforeIronOre+1,'faster tools still give only one ore');
   assert.equal(g.save.xp.mining,Math.max(beforeIronXp,g.xpTable[15])+g.NT.iron.xp,
     'faster pickaxe earns one normal XP drop');
   g.save.eq.weapon=oldWeapon;
   g.save.xp.mining=oldMiningXp;

   // Every ore tier consumes exactly its declared charges. Failures only
   // occur in doAction; this helper is called after a verified success.
   for(const [kind,limit] of Object.entries(veins)){
     const node={k:kind,x:0,y:0,back:0};
     for(let hit=1;hit<=limit;hit++){
       const empty=g.consumeOreVein(node,g.NT[kind],25000);
       assert.equal(empty,hit===limit,kind+' exhausts at the right success');
       assert.equal(node.oreLeft,limit-hit);
       assert.equal(node.back,hit===limit?25000+g.NT[kind].rt[0]*1000:0);
     }
     assert.equal(g.consumeOreVein(node,g.NT[kind],25001),false,
       kind+' unavailable until respawn');
     assert.equal(node.oreLeft,0,'cooldown does not grant free ore');
   }

 }finally{Math.random=originalRandom}

 // Forestry regrowth is tuned independently; fishing respawn stays unchanged.
 assert.deepEqual(Array.from(g.NT.tree.rt),[10,16]);
 assert.deepEqual(Array.from(g.NT.spot1.rt),[8,14]);
 const source=fs.readFileSync('public/myrren-game.js','utf8');
 assert(source.includes('if(best){best.tipAt=now;return}'),'canvas tapping resources must inspect only');
 assert(!source.includes('tapMineRock'),'tapping never initiates mining');
 console.log('PASS: multi-ore vein durability, XP per ore, continuous swings, depletion/respawn, strike effects, and save safety.');
})().catch(e=>{console.error(e);process.exitCode=1});
