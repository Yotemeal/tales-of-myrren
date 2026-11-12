'use strict';
// Planning contract only. Does not import game runtime, rewrite assets, or change saves.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const design = JSON.parse(fs.readFileSync(path.join(__dirname, 'starter-region-v1.json'), 'utf8'));
const resPath = path.join(root, 'public', 'assets', 'resources');
function pngHeader(file) {
  const b = fs.readFileSync(file);
  assert(b.length >= 33, 'PNG too small: ' + file);
  assert(b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'PNG signature invalid: ' + file);
  assert.equal(b.toString('ascii',12,16), 'IHDR', 'missing IHDR: ' + file);
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20);
  const depth=b[24], colourType=b[25];
  assert(width > 0 && width <= 4096 && height > 0 && height <= 4096,
    'unexpected source image size: ' + file);
  assert.equal(depth, 8, '8-bit source PNG required: ' + file);
  assert([2,3,4,6].includes(colourType), 'unsupported image colour type: '+ file);
  return {width,height,colourType,bytes:b.length};
}
assert.equal(design.schema, 'myrren.starter-region.design.v1');
assert.equal(design.status, 'planning-reference-only');
assert.equal(design.productionSafe, false);
assert.equal(design.coordinateSystem.tileSize, 16);
assert.equal(design.coordinateSystem.mapWidth, 1600);
assert.equal(design.coordinateSystem.mapHeight, 1600);
assert.deepEqual(design.coordinateSystem.craterCenter,{x:800,y:800});
assert.deepEqual(design.coordinateSystem.playerNativeFrame,{width:21,height:27});
assert.equal(design.preservedRuntime.source,'public/myrren-world.js');
assert.equal(design.preservedRuntime.existingBridge,false);
assert.equal(design.preservedRuntime.saveAndCollisionMustRemainUnchanged,true);
const liveWorld=fs.readFileSync(path.join(root,'public','myrren-world.js'),'utf8');
assert(liveWorld.includes('const CX=800,CY=800'), 'check plan against actual map center');
const idSet=new Set(design.zones.map(z=>z.id));
assert.equal(idSet.size,design.zones.length,'duplicate region ID');
assert.deepEqual([...idSet].sort(), [
  'bramblewood','crater_camp','direwood','goblin_route',
  'northern_ruins','river_fishing','southern_gate','travellers_bridge'
].sort(),'Unexpected or missing zone');
const zone=id=>design.zones.find(z=>z.id===id);
const camp=zone('crater_camp');
assert.equal(camp.position,'centre');
for(const forbidden of ['house','residence','enclosed_store','river','bridge'])
  assert(camp.forbidden.includes(forbidden),'Crater Camp must prohibit '+forbidden);
assert.deepEqual(camp.structures.slice().sort(),design.campFeatures.map(x=>x.id).sort());
assert.equal(new Set(design.campFeatures.map(f=>f.id)).size, design.campFeatures.length);
const edges=design.connections;
assert.equal(new Set(edges.map(e=>e.slice().sort().join('~'))).size,edges.length,'duplicate path');
for(const edge of edges){
  assert(Array.isArray(edge)&&edge.length===2,'invalid connection');
  assert(idSet.has(edge[0])&&idSet.has(edge[1]),'path references missing zone');
  assert.notEqual(edge[0],edge[1]);
}
const neighbors=new Map([...idSet].map(x=>[x,[]]));
for(const [a,b] of edges){neighbors.get(a).push(b);neighbors.get(b).push(a)}
const seen=new Set(['crater_camp']),todo=['crater_camp'];
while(todo.length){
  const a=todo.shift();
  for(const b of neighbors.get(a))if(!seen.has(b)){seen.add(b);todo.push(b)}
}
assert.equal(seen.size,idSet.size,'some region disconnected from camp');
const link=(a,b)=>neighbors.get(a).includes(b);
for(const [a,b] of [
  ['crater_camp','southern_gate'],['southern_gate','bramblewood'],
  ['bramblewood','northern_ruins'],['bramblewood','goblin_route'],
  ['bramblewood','river_fishing'],['river_fishing','travellers_bridge'],
  ['travellers_bridge','direwood']])assert(link(a,b),'missing critical region path '+a+' -> '+b);
assert.equal(zone('goblin_route').position,'northeast');
assert(zone('direwood').position.includes('south'));
assert(zone('river_fishing').structures.includes('broken_usable_bridge'));
assert(zone('travellers_bridge').forbidden.includes('impassable_bridge'));
assert.equal(design.approvedArtReferences.baseCharacter.mustNotRedesign,true);
const trees=design.approvedArtReferences.trees,ores=design.approvedArtReferences.ores;
assert.deepEqual(trees.map(x=>x.name).sort(),
  ['Bramblewood','Alder','Ironbark','Elderthorn','Starroot'].sort());
assert.deepEqual(ores.map(x=>x.name).sort(),
  ['Copper','Tin','Iron','Coal','Black Iron','Obsidianite','Myrrenite','Meteorite'].sort());
assert.equal(ores.find(x=>x.name==='Meteorite').producesEquipmentTier,'Starsteel');
assert.deepEqual(ores.filter(x=>x.beginner).map(x=>x.name).sort(),
  ['Copper','Tin','Iron','Coal'].sort());
const sourceIndex=[];
for(const [group,assets,prefix] of [['tree',trees,'tree_'],['ore',ores,'ore_']]){
  const seenFile=new Set();
  for(const art of assets){
    assert(art.file.startsWith(prefix) && art.file.endsWith('.png'), 'invalid '+group+' filename');
    assert(!seenFile.has(art.file),'duplicate resource '+art.file);
    seenFile.add(art.file);
    const filename=path.join(resPath,art.file);
    assert(fs.existsSync(filename),'missing existing source PNG '+art.file);
    const meta=pngHeader(filename);
    sourceIndex.push({name:art.name,filename:art.file,...meta});
  }
}
const liveEnv=fs.readFileSync(path.join(root,'public','myrren-environment.js'),'utf8');
assert(liveEnv.includes("isTree?'tree_':'ore_'"),'game loader key mapping changed: review assets');
const invalid=design.implementationStages.filter(x=>x.canShip!==false);
assert.equal(invalid.length,0,'design stages cannot be treated as shipped content');
console.log('PASS: starter region planning only; '+
  design.zones.length+' connected zones, '+trees.length+' trees, '+
  ores.length+' ore sources, 16px grid and untouched live map.');
console.log('Source images: '+sourceIndex.map(x=>x.filename+' '+x.width+'x'+x.height).join(', '));
