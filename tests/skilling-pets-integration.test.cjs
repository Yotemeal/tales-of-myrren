const assert=require('node:assert/strict'),createGame=require('./game-runtime.cjs');
const fixture={v:3,name:'Pet QA',xp:{melee:0,mining:100,woodcutting:200,fishing:300,cooking:400},inv:{coins:1000,bread:10},eq:{},bag:[],bank:{logs:50},notes:{iron:5},pets:{woodcutting:1,mining:1,fishing:1},tokens:17,x:800,y:844};
async function make(preview=true){const result=await createGame({},preview?{search:'?craterPreview=1'}:{});result.game.adoptSave(JSON.parse(JSON.stringify(fixture)));return result}
(async()=>{
 let {game:g,memory,elements}=await make();assert.equal(g.PETS.fishing.name,'River Otter');assert.deepEqual(g.save.pets,fixture.pets,'old fishing ownership carries forward without re-unlock');assert.equal(g.pets.length,3,'existing multiple followers are preserved');
 const html=element=>String(element?.innerHTML||'')+(element?.children||[]).map(html).join('');g.openModal('skills');assert(html(elements.get('mBody')).includes('River Otter'));assert(html(elements.get('mBody')).includes('+3% Fishing XP'));g.closeModal();
 const findButton=element=>(element?.textContent==='Preview all three pets'||element?.innerHTML==='Preview all three pets')?element:(element?.children||[]).map(findButton).find(Boolean);g.openModal('skills');const demo=findButton(elements.get('mBody'));assert(demo);for(const sk of Object.keys(g.save.pets))g.save.pets[sk]=0;demo.click();assert.deepEqual(g.save.pets,fixture.pets);g.closeModal();
 const base=g.save.xp.woodcutting;g.addXp('woodcutting',25);assert.equal(g.save.xp.woodcutting,base+25);assert.equal(g.save.petXpRemainders.woodcutting,75);g.persist(true);
 const exported=JSON.parse(JSON.stringify(g.snap()));assert.equal(exported.petXpRemainders.woodcutting,75);g.adoptSave(exported);for(let i=0;i<3;i++)g.addXp('woodcutting',25);assert.equal(g.save.xp.woodcutting,base+103);assert.equal(g.save.petXpRemainders.woodcutting,0);
 g.save.pets.woodcutting=2;g.syncPets();const paused=g.save.xp.woodcutting;g.addXp('woodcutting',100);assert.equal(g.save.xp.woodcutting,paused+100,'resting earns no bonus');assert(!g.pets.some(p=>p.sk==='woodcutting'));
 g.save.pets.woodcutting=1;g.syncPets();g.addXp('woodcutting',100);assert.equal(g.save.xp.woodcutting,paused+203,'summoned bonus resumes');
 for(const skill of ['mining','fishing']){const before=g.save.xp[skill];g.addXp(skill,100);assert.equal(g.save.xp[skill],before+103)}
 for(const skill of ['melee','cooking']){const before=g.save.xp[skill];g.addXp(skill,100);assert.equal(g.save.xp[skill],before+100)}
 assert.deepEqual(g.save.bank,fixture.bank);assert.deepEqual(g.save.notes,fixture.notes);assert.equal(g.save.inv.coins,fixture.inv.coins);assert.equal(g.save.tokens,fixture.tokens);
 g.persist(true);const preview=JSON.parse(memory.get('myrren-crater-preview-v1'));assert.deepEqual(preview.petXpRemainders,g.save.petXpRemainders);assert(!memory.has('ember-reach-v2'));
 const old=await make(false);const oldBefore=old.game.save.xp.fishing;old.game.addXp('fishing',100);assert.equal(old.game.save.xp.fishing,oldBefore+100,'default game XP remains unchanged until activation is approved');assert.equal(old.game.PETS.fishing.name,'Mossback Terrapin');
 const fallback=await createGame({}, {search:'?craterPreview=1',skipPetModule:true});fallback.game.adoptSave({...fixture,petXpRemainders:{mining:54}});assert.equal(fallback.game.save.petXpRemainders.mining,54);const fallbackXp=fallback.game.save.xp.mining;fallback.game.addXp('mining',100);assert.equal(fallback.game.save.xp.mining,fallbackXp+100,'missing pet module degrades safely without stopping save restoration');
 g.adoptSave({...fixture,petXpRemainders:{mining:200,fishing:-4,woodcutting:'75'}});assert.deepEqual(g.save.petXpRemainders,{woodcutting:0,mining:0,fishing:0});
 // Real node awards, discovery ordering and failed gathers use the same boundary.
 const random=Math.random;
 try{
  Math.random=()=>0;
  ({game:g}=await make());g.save.bag.push('bronze_axe');g.save.eq.weapon='bronze_axe';g.me.x=800;g.me.y=844;g.me.fx=0;g.me.fy=-1;
  const node={k:'tree',x:800,y:833,back:0};const beforeXp=g.save.xp.woodcutting,beforeLogs=g.save.inv.logs;g.beginAct('node',node);g.doAction(2,5000);
  assert.equal(g.save.inv.logs,beforeLogs+1);assert.equal(g.save.xp.woodcutting,beforeXp+25);assert.equal(g.save.petXpRemainders.woodcutting,75);
  g.save.pets.woodcutting=0;g.syncPets();const beforeDiscovery=g.save.xp.woodcutting,remainder=g.save.petXpRemainders.woodcutting;node.back=0;g.beginAct('node',node);g.doAction(2,6000);
  assert.equal(g.save.pets.woodcutting,1);assert.equal(g.save.xp.woodcutting,beforeDiscovery+25,'newly discovered pet does not retroactively boost its discovery gather');assert.equal(g.save.petXpRemainders.woodcutting,remainder);
  Math.random=()=>.99999;node.back=0;const failedXp=g.save.xp.woodcutting,failedRemainder=g.save.petXpRemainders.woodcutting;g.beginAct('node',node);g.doAction(2,7000);assert.equal(g.save.xp.woodcutting,failedXp);assert.equal(g.save.petXpRemainders.woodcutting,failedRemainder);
 }finally{Math.random=random}
 ({game:g}=await make());g.save.inv.copper=1;g.save.inv.tin=1;const mineStart=g.save.xp.mining,smeltXp=g.SMELT[0].xp;g.smelt(g.SMELT[0]);assert.equal(g.save.xp.mining,mineStart+Math.floor(smeltXp*103/100));assert.equal(g.save.petXpRemainders.mining,smeltXp*3%100);
 g.save.inv.ing_bronze=4;g.setForgeMat(2);const forgeBefore=g.save.xp.mining,forgeR=g.save.petXpRemainders.mining,forgeBase=4*Math.round(smeltXp/2);g.forge('sword');assert.equal(g.save.xp.mining,forgeBefore+forgeBase+Math.floor((forgeR+forgeBase*3)/100));
 const jobBefore=g.save.xp.fishing;g.save.jobs=[{id:'pet-job',done:true,tokens:1,xp:{fishing:100},objs:[]}];g.claimJob('pet-job');assert.equal(g.save.xp.fishing,jobBefore+103);g.claimJob('pet-job');assert.equal(g.save.xp.fishing,jobBefore+103,'job bonus cannot be claimed twice');
 g.addXp('mining',NaN);g.addXp('mining',-5);assert(Number.isFinite(g.save.xp.mining));
 ({game:g}=await make());const mole=g.pets.find(p=>p.sk==='mining');g.me.moving=true;g.petsUpdate(.05,1000);assert.equal(mole.previewState,'burrow');assert(mole.underground);g.me.moving=false;g.petsUpdate(.05,1100);assert.equal(mole.previewState,'surface');
 const otter=g.pets.find(p=>p.sk==='fishing');otter.previewState='dive';otter.catchUntil=999999;g.enterBuilding(g.BLD.find(b=>!b.open),2000);assert.equal(otter.catchUntil,0);assert.notEqual(otter.previewState,'dive');
 mole.previewState='dig';g.die();assert.equal(mole.previewState,'burrow');assert.equal(mole.trail.length,0);
 console.log('PASS: real game XP/gathering/discovery ordering; persisted exact remainder and legacy pet ownership; resting/default XP; failed gathers; death/interior resets; unrelated progress retained.');
})().catch(e=>{console.error(e);process.exitCode=1});
