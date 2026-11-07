const assert=require('node:assert/strict'),fs=require('node:fs');
const window={};new Function('window',fs.readFileSync('public/skilling-pets.js','utf8'))(window);const P=window.MyrrenSkillingPets;
const following={woodcutting:1,mining:1,fishing:1};
{
 let remainders=P.normalizeRemainders(),total=0;
 for(let i=0;i<4;i++){const r=P.award('woodcutting',25,following,remainders);total+=r.amount;remainders=r.remainders}
 assert.equal(total,103);assert.equal(remainders.woodcutting,0);
 for(const skill of Object.keys(following))assert.equal(P.award(skill,100,following,{}).amount,103);
 for(const skill of ['melee','cooking'])assert.equal(P.award(skill,100,following,{}).amount,100);
 for(const status of [0,2,'1',true])assert.equal(P.award('mining',100,{mining:status},{}).amount,100);
 let r=P.award('mining',18,following,{});assert.equal(r.amount,18);assert.equal(r.remainders.mining,54);
 const paused=P.award('mining',18,{mining:2},r.remainders);assert.equal(paused.remainders.mining,54);
 r=P.award('mining',18,following,JSON.parse(JSON.stringify(paused.remainders)));assert.equal(r.amount,19);assert.equal(r.remainders.mining,8);
 assert.deepEqual(P.normalizeRemainders({mining:100,woodcutting:-1,fishing:2.5}),{woodcutting:0,mining:0,fishing:0});
 assert.equal(P.award('fishing',1_000_000_000,following,{}).amount,1_030_000_000);
 assert.equal(P.award('fishing',Number.MAX_SAFE_INTEGER,following,{}).amount,Number.MAX_SAFE_INTEGER);
 assert.throws(()=>P.award('mining',-1,following,{}));assert.throws(()=>P.award('mining',NaN,following,{}));
}
const make=(sk,x=0,y=0)=>({sk,x,y,face:1,trail:[]});
const ctx=(now,extra={})=>({now,dt:.05,player:{moving:false,dead:false,inside:false},anchor:{x:0,y:0},inWater:()=>false,canMove:()=>true,...extra});
{
 const mole=make('mining');P.reset(mole,0);P.update(mole,ctx(100,{player:{moving:true}}));assert.equal(mole.previewState,'burrow');assert.equal(mole.underground,true,'mole stays hidden even when already beside a moving player');
 P.update(mole,ctx(150));assert.equal(mole.previewState,'surface');P.update(mole,ctx(800));assert.equal(mole.previewState,'idle');
 P.update(mole,ctx(850,{action:{skill:'mining',key:'ore1',target:{x:0,y:0}}}));assert.equal(mole.previewState,'dig');
 P.update(mole,ctx(900));assert.equal(mole.previewState,'idle','cancelled mining cancels digging');
 mole.x=-80;for(let i=0;i<100;i++)P.update(mole,ctx(1000+i*80,{player:{moving:true},anchor:{x:0,y:0}}));assert(mole.trail.length<=24);P.update(mole,ctx(20000));assert.equal(mole.trail.length,0,'trail expires');
}
{
 const glider=make('woodcutting',-15);P.update(glider,ctx(0));assert.equal(glider.previewState,'walk','near following uses ground locomotion');
 glider.x=-100;P.reset(glider,100);P.update(glider,ctx(100));assert.equal(glider.previewState,'takeoff');P.update(glider,ctx(300));assert.equal(glider.previewState,'glide');
 const following=make('woodcutting',-60);let playerX=0;for(let i=0;i<80;i++){playerX+=4.5;P.update(following,ctx(i*50,{player:{moving:true},anchor:{x:playerX,y:0}}));assert(playerX-following.x<100,'gliding actually catches up to the 90px/s player')}
 glider.x=0;P.update(glider,ctx(350));assert.equal(glider.previewState,'land');P.update(glider,ctx(550));assert.equal(glider.previewState,'idle');
 P.update(glider,ctx(600,{action:{skill:'woodcutting',key:'tree1',target:{x:0,y:0}}}));assert.equal(glider.previewState,'climb');P.update(glider,ctx(650,{player:{moving:true},anchor:{x:15,y:0}}));assert.notEqual(glider.previewState,'climb');
}
{
 const otter=make('fishing',-10);P.update(otter,ctx(0));assert.equal(otter.previewState,'walk');P.update(otter,ctx(50,{inWater:()=>true}));assert.equal(otter.previewState,'swim');
 otter.x=0;const action={skill:'fishing',key:'spot1',target:{x:0,y:0}};P.update(otter,ctx(100,{inWater:()=>true,action}));assert.equal(otter.previewState,'dive');
 const success={skill:'fishing',at:150,key:'catch1'};P.update(otter,ctx(150,{inWater:()=>true,action,success}));assert.equal(otter.previewState,'catch');
 P.update(otter,ctx(175,{activeSkill:'mining',inWater:()=>true}));assert.notEqual(otter.previewState,'catch','switching skill cancels fishing interaction');
 P.update(otter,ctx(200,{player:{moving:true},inWater:()=>true,anchor:{x:10,y:0},success}));assert.notEqual(otter.previewState,'catch','moving cancels displayed catch');
 P.update(otter,ctx(250,{inWater:()=>false,success}));assert.notEqual(otter.previewState,'dive');assert.notEqual(otter.previewState,'catch','same success cannot restart a cancelled catch');
 P.update(otter,ctx(300,{player:{inside:true},inWater:()=>true,action}));assert(!['swim','water-idle','dive','catch'].includes(otter.previewState),'no water interaction indoors');
}
{
 const p=make('woodcutting');P.update(p,ctx(0,{anchor:{x:100,y:0},canMove:()=>false}));assert.equal(p.x,0);assert.equal(p.y,0,'cannot walk through obstacles');
 P.reset(p,100,{dead:true});assert.equal(p.previewState,'idle');assert.equal(p.trail.length,0);assert.equal(p.catchUntil,0);
}
console.log('PASS: exact +3% matching/summoned XP with saved hundredths; glider walk/glide/climb, mole hidden travel/surface/dig, otter land/water/dive/catch, cancellation and bounded trails.');
