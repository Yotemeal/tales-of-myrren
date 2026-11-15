'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=require('../docs/mining-ore-native-review-v1.json');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
test('eight native 28x20 RGBA ores remain pixel-perfect and checksum-locked',()=>{
 assert.equal(manifest.assets.length,8);
 const seen=new Set();
 for(const asset of manifest.assets){
  assert.ok(!seen.has(asset.name),'duplicate material');
  seen.add(asset.name);
  const p=path.join(root,asset.path);
  const b=fs.readFileSync(p);
  assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(b.toString('ascii',12,16),'IHDR',asset.name);
  assert.equal(b.readUInt32BE(16),28,asset.name+' width');
  assert.equal(b.readUInt32BE(20),20,asset.name+' height');
  assert.equal(b[24],8,asset.name+' 8-bit');
  assert.equal(b[25],6,asset.name+' RGBA');
  assert.equal(sha(p),asset.sha256,asset.name+' exact source');
 }
 assert.equal(new Set(manifest.assets.map(x=>x.sha256)).size,8,'not recolour duplicates');
});
test('the previously approved Black Iron file is preserved byte for byte',()=>{
 const original=path.join(root,'public/assets/art-review/black-iron/ore_black_iron_v1_28x20.png');
 const review=path.join(root,'public/assets/art-review/mining-ores-v1/ore_black_iron.png');
 assert.ok(fs.readFileSync(original).equals(fs.readFileSync(review)));
});
test('approved V19F hero is locked; the art pack does not change runtime handling',()=>{
 const hero=path.join(root,'public/assets/myrren-v19f/myrren_front_game_ready_24x32.png');
 assert.equal(sha(hero),manifest.hero_sha256);
 const game=fs.readFileSync(path.join(root,'public/myrren-game.js'),'utf8');
 const env=fs.readFileSync(path.join(root,'public/myrren-environment.js'),'utf8');
 assert.match(game,/ctx\.scale\(\.72,\.72\)/);
 assert.match(env,/const w=isTree\?144:24/);
 assert.equal(manifest.production_integration,false);
});
test('isolated preview references exact native sprites and approved character',()=>{
 const src=fs.readFileSync(path.join(root,'public/mining-ore-native-review-v1.html'),'utf8');
 for(const x of manifest.assets) assert.ok(src.includes('ore_'+x.name+'.png'),x.name+' preview');
 assert.ok(src.includes('myrren_front_game_ready_24x32.png'));
});
