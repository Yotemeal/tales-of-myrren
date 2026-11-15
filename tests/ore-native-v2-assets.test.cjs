'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'../public/assets/resources');
const manifest=require('../docs/ore-native-v2-manifest.json');
const sig=Buffer.from([137,80,78,71,13,10,26,10]);
test('V2 ore sprites are native 24x20 RGBA pixel files with exact approved-candidate hashes',()=>{
 const hashes=[];
 for(const [key,expected] of Object.entries(manifest.sprites)){
  const data=fs.readFileSync(path.join(root,'ore_'+key+'.png'));
  assert.ok(data.subarray(0,8).equals(sig),key+' PNG signature');
  assert.equal(data.toString('ascii',12,16),'IHDR',key);
  assert.equal(data.readUInt32BE(16),24,key+' width');
  assert.equal(data.readUInt32BE(20),20,key+' height');
  assert.equal(data[24],8,key+' PNG depth');
  assert.equal(data[25],6,key+' RGBA');
  const hash=crypto.createHash('sha256').update(data).digest('hex');
  assert.equal(hash,expected,key+' fingerprint');
  hashes.push(hash);
 }
 assert.equal(hashes.length,8);
 assert.equal(new Set(hashes).size,8);
});
test('native world render footprint is kept: no resizing of ores',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../public/myrren-environment.js'),'utf8');
 assert.match(source,/const w=isTree\?144:24;/);
 assert.equal(manifest.world_render_size[0],24);
 assert.equal(manifest.fixed_camera_scale,2);
});
