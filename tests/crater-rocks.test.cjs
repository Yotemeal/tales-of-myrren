const assert=require('node:assert/strict'),fs=require('node:fs');
const window={};for(const file of ['crater-definitions.js','crater-rocks.js'])new Function('window',fs.readFileSync('public/'+file,'utf8'))(window);
const roster=window.MyrrenCrater;
assert.deepEqual(roster.hostiles.map(m=>[m.name,m.level]),[['Forest Rat',1],['Goblin Miner',5],['Wild Boar',8],['Dire Wolf',12],['Goblin Guard',16],['Cave Guardian',18],['Forest Troll',22],['Jewelheart Guardian',30]]);
assert.equal(roster.wildlife.length,5);assert(roster.wildlife.every(m=>m.passive&&m.atlas===null));assert.equal(roster.pets.length,3);assert(roster.pets.every(p=>p.bonusPercent===3&&p.bonusRequiresSummoned));
assert.equal(roster.hostiles.find(m=>m.id==='dire_wolf').reference,'R6');assert(roster.hostiles.every(m=>m.atlas===null&&m.balance===null));assert(Object.isFrozen(roster.hostiles[0]));
for(const query of ['', '?craterPreview=0','?x=craterPreview=1','?craterPreview=10'])assert(!roster.previewEnabled(query));assert(roster.previewEnabled('?x=1&craterPreview=1'));
const create=window.MyrrenCraterRocks.create,shot={x:0,y:0,targetX:100,targetY:0,speed:100,maxDistance:100,owner:'goblin'};
{
 const rocks=create();let hits=0;rocks.launch(shot);rocks.update(1,{target:{x:50,y:0,radius:5},onHit:r=>{assert.equal(r.owner,'goblin');hits++}});rocks.update(1,{target:{x:50,y:0,radius:5},onHit:()=>hits++});assert.equal(hits,1,'swept hit occurs once');assert.equal(rocks.rocks.length,0);
}
{
 const rocks=create();let hits=0;rocks.launch(shot);rocks.update(1,{target:{x:50,y:20,radius:5},onHit:()=>hits++});assert.equal(hits,0,'player can dodge the aimed trajectory');assert.equal(rocks.rocks.length,0,'range is finite');
 rocks.launch({...shot,maxDistance:30});rocks.update(2,{target:{x:50,y:0,radius:5},onHit:()=>hits++});assert.equal(hits,0,'cannot hit beyond range');
}
for(const wallX of [25,80]){
 const rocks=create();let hits=0;rocks.launch(shot);rocks.update(1,{target:{x:50,y:0,radius:5},isBlocked:x=>x>=wallX,onHit:()=>hits++});assert.equal(hits,wallX===25?0:1,'nearest contact wins');assert.equal(rocks.rocks.length,0);
}
{
 const rocks=create({capacity:2});assert(rocks.launch(shot));assert(rocks.launch(shot));assert(!rocks.launch(shot));let hits=0;rocks.update(1,{target:{x:50,y:0,radius:5},onHit:()=>{hits++;rocks.clear()}});assert.equal(hits,1,'death/scene clear is safe inside impact callback');assert.equal(rocks.rocks.length,0);
 assert(!rocks.launch({...shot,speed:NaN}));assert(!rocks.launch({...shot,targetX:0}));assert(!rocks.launch({...shot,maxDistance:Infinity}));assert(!rocks.launch({...shot,speed:-1}));
 rocks.launch(shot);rocks.update(NaN);assert.equal(rocks.rocks[0].x,0);rocks.clear();assert.equal(rocks.rocks.length,0);
}
console.log('PASS: approved 8/5/3 design registry; opt-in only; swept/dodgeable damaging-rock contacts, obstruction order, finite range and bounded lifecycle.');
