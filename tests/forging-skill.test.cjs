'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../public/myrren-game.js'),'utf8');
new vm.Script(src,{filename:'myrren-game.js'});
const has=x=>assert.ok(src.includes(x),'Missing runtime contract: '+x);
has("forging:'Forging'");
has("'cooking','forging']");
has("forging:'ingot'");
has("addXp('forging',r.xp)");
has("addXp('forging',forgeXp(r,cost))");
has("lvlFor(save.xp.forging)<r.req");
has("lvlFor(save.xp.forging)<forgeReq(r,kind)");
has("const forgeXp=(r,cost)=>cost*r.xp*2");
has("const PRODUCTION_MS={smelt:1500,forge:2500}");
has("markProduction('smelt')");
has("markProduction('forge')");
has("if(!productionReady('smelt'))return");
has("if(!productionReady('forge'))return");
const section=src.slice(src.indexOf('const ingName=id=>'),src.indexOf('function rForge(){'));
assert.ok(!section.includes("addXp('mining'"),'Production must not award Delving XP');
const skill=src.match(/const SK=\[([^\]]+)\]/);
assert.ok(skill&&skill[1].split(',').length===6,'Expected six skills');
const requirements={pick:0,axe:1,helm:2,boots:3,gloves:3,sword:4,shield:5,legs:7,body:8};
const tiers=[1,10,20,30,40,55,70];
for(const base of tiers)for(const [kind,offset] of Object.entries(requirements)){
 const level=base+offset;
 assert.ok(level>=base&&level<=base+8,kind+' unlock invalid');
}

/* Execute the real production functions in isolation with deterministic mocks. */
const runtime=fs.readFileSync(require('node:path').join(__dirname,'../public/myrren-game.js'),'utf8');
function extract(start,end){const a=runtime.indexOf(start),b=runtime.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,'Cannot extract '+start);return runtime.slice(a,b)}
const production=extract('const ingName=id=>','function rSmelt()')+ '\n'+extract('function forge(kind){','function rForge(){');
let now=10000;
const ctx={
 Date:{now:()=>now},save:{xp:{forging:0,mining:12345},inv:{copper:2,tin:2,ing_bronze:0},eq:{weapon:null},bag:[]},
 SMELT:[{id:'bronze',mat:2,req:1,xp:12,in:{copper:1,tin:1}}],
 MATS:{2:{k:'bronze'}},DEFS:{bronze_sword:{id:'bronze_sword',name:'Bronze sword',slot:'weapon',kind:'sword'}},
 FORGE:{sword:4},FORGE_UNLOCK:{sword:4},forgeReq:(r,kind)=>r.req+4,forgeXp:(r,cost)=>cost*r.xp*2,ITEMS:{ing_bronze:{name:'Bronze Ingot'}},
 NAMES:{forging:'Forging'},lvlFor:xp=>xp>=100?5:1,
 canFitInventory:()=>true,usable:()=>true,inside:false,me:{x:0,y:0},
 say:()=>{},burst:()=>{},persist:()=>{},renderModal:()=>{},uiHud:()=>{},onGearChange:()=>{},
 addXp:(skill,xp)=>{ctx.save.xp[skill]+=xp},Math
};
vm.createContext(ctx);
vm.runInContext('const ingName=id=>ITEMS[\'ing_\'+id].name;\n'+production.slice(production.indexOf('/* Production cooldowns')),ctx);
vm.runInContext('smelt(SMELT[0])',ctx);
assert.equal(ctx.save.inv.ing_bronze,1);
assert.equal(ctx.save.inv.copper,1);
assert.equal(ctx.save.xp.forging,12);
assert.equal(ctx.save.xp.mining,12345);
vm.runInContext('smelt(SMELT[0])',ctx);
assert.equal(ctx.save.inv.ing_bronze,1,'Rapid smelt must not duplicate items');
now+=1500;
vm.runInContext('smelt(SMELT[0])',ctx);
assert.equal(ctx.save.inv.ing_bronze,2);
ctx.save.inv.ing_bronze=4;
ctx.save.xp.forging=100;
now+=1500;
vm.runInContext('forge("sword")',ctx);
assert.equal(ctx.save.inv.ing_bronze,0);
assert.equal(ctx.save.xp.forging,196);
assert.equal(ctx.save.xp.mining,12345);
assert.equal(ctx.save.eq.weapon,'bronze_sword');
vm.runInContext('forge("sword")',ctx);
assert.equal(ctx.save.bag.length,0,'Rapid forging must not create duplicate gear');


// Failed actions must not consume materials, grant XP, or start cooldowns.
now+=2500;
ctx.save.xp.forging=0;
ctx.save.inv.ing_bronze=4;
const before={xp:ctx.save.xp.forging,ingots:ctx.save.inv.ing_bronze};
vm.runInContext('forge("sword")',ctx);
assert.equal(ctx.save.xp.forging,before.xp,'Locked recipe must not award XP');
assert.equal(ctx.save.inv.ing_bronze,before.ingots,'Locked recipe must not consume ingots');
ctx.save.xp.forging=100;
vm.runInContext('forge("sword")',ctx);
assert.equal(ctx.save.bag.length,1,'Valid crafting should work immediately after rejected attempt');
assert.equal(ctx.save.xp.forging,196);
now+=2500;
ctx.save.inv.ing_bronze=0;
vm.runInContext('forge("sword")',ctx);
assert.equal(ctx.save.bag.length,1,'Insufficient materials must not create equipment');
ctx.save.inv.copper=0;
ctx.save.inv.tin=0;
now+=2500;
const xpBefore=ctx.save.xp.forging;
vm.runInContext('smelt(SMELT[0])',ctx);
assert.equal(ctx.save.xp.forging,xpBefore,'Insufficient ore must not award XP');
assert.equal(ctx.save.inv.ing_bronze,0,'Insufficient ore must not create ingots');

console.log('Forging syntax, contracts and isolated production behavior passed');
