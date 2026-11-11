'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const spec=JSON.parse(fs.readFileSync('public/art-scale-targets.json','utf8'));
const env=fs.readFileSync('public/myrren-environment.js','utf8');
const game=fs.readFileSync('public/myrren-game.js','utf8');
const world=fs.readFileSync('public/myrren-world.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const lab=fs.readFileSync('public/asset-scale-lab.js','utf8');
const labHTML=fs.readFileSync('public/asset-scale-lab.html','utf8');
assert.equal(spec.status,'review-only-not-production-approved');
assert.equal(spec.tileSize,16);
assert.deepEqual(spec.character.frame,[21,27]);
assert.equal(spec.world.width,1600);
assert.equal(spec.world.height,1600);
assert.equal(spec.world.tilesWide,100);
assert.equal(spec.world.tilesHigh,100);
assert.equal(spec.world.change,false);
assert.equal(spec.buildings.change,false);
assert.equal(spec.paths.change,false);
assert.equal(spec.resources.trees.physicalFootprintChange,false);
assert.equal(spec.resources.ores.physicalFootprintChange,false);
assert(/const T=16,WW=1600,WH=1600/.test(game));
assert(/const w=isTree\?144:24;/.test(env));
assert(/ctx\.scale\(\.72,\.72\)/.test(game));
assert(/const lake=\{x:1250,y:1055/.test(world));
assert.equal(spec.resources.ores.currentSourceDrawWidth,24);
assert.equal(spec.resources.ores.outerDrawScale,.72);
assert(Math.abs(spec.resources.ores.currentEffectiveDisplayWidth-17.28)<.001);
const ores=spec.resources.ores.previewWidths;
assert.equal(Object.keys(ores).length,8);
for(const [name,w] of Object.entries(ores)) {
 assert(w>=20&&w<=28,'unexpected ore '+name+' '+w);
}
const trees=spec.resources.trees.species;
assert.equal(Object.keys(trees).length,7);
for(const [name,obj] of Object.entries(trees)) {
 const [w,h]=obj.targetAuthoredSize;
 assert(w<=128&&w>=44,'tree width out of scope: '+name);
 assert(h<=140&&h>=60,'tree height out of scope: '+name);
 assert(h>w,'all approved native tree shapes should be taller than wide');
 assert(obj.previewWidth===w,'native target width and lab width must agree');
 assert(obj.previewWidth<spec.resources.trees.currentDisplay[0],
  'ordinary tree larger than current without justification');
}
assert(trees.elderthorn.targetAuthoredSize[1]>trees.bramblewood.targetAuthoredSize[1]);
assert(trees.starroot.targetAuthoredSize[1]>trees.alder.targetAuthoredSize[1]);
const b=spec.monsters.targetBounds;
assert.deepEqual(Object.keys(b).sort(),
 ['bear','boar','eliteBoss','goblin','pets','slime','smallWildlife','wolf'].sort());
for(const [name,env] of Object.entries(b)) {
 assert.equal(env.length,4);
 const [minW,minH,maxW,maxH]=env;
 assert(minW>0&&minH>0&&maxW>=minW&&maxH>=minH,
  'invalid monster envelope '+name);
}
assert(b.eliteBoss[1]>spec.character.frame[1],
 'Boss height should be visually larger than player');
assert(b.pets[3]<spec.character.frame[1],
 'Pet must be visually smaller than player');
assert(spec.buildings.currentFootprintWidths.arms===88);
assert(spec.paths.proposedMainVisualWidth>spec.paths.currentTotalWidthApprox);
for(const s of ['myrren-game.js','myrren-environment.js'])assert(!labHTML.includes('/'+s),
 'Lab must not bootstrap live simulation');
assert(labHTML.includes('/myrren-world.js'));
assert(labHTML.includes('/kez-v2-atlas.js'));
assert(labHTML.includes('/myrren-environment.js'));
assert(!index.includes('/asset-scale-lab.js'),
 'Lab should not load in live game');
assert(!/localStorage|indexedDB|sessionStorage|document\.cookie/.test(lab));
new Function(lab);
console.log('PASS world scale contract: 7 native tree targets, 8 ore sizes, 8 creature envelopes, map/saves and live-game isolation');