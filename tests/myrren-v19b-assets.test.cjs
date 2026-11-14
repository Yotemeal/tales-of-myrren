'use strict';
/** Asset lock: no dependencies, no runtime changes. Run: node --test tests/myrren-v19b-assets.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../public/assets/myrren-v19b');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'),'utf8'));
function readLocked(info) {
  const bytes=fs.readFileSync(path.join(root,info.file));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');
  assert.equal(bytes.readUInt32BE(16),info.width,'width');
  assert.equal(bytes.readUInt32BE(20),info.height,'height');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256,'locked asset SHA-256');
}
test('V19B native sheets are byte-identical to accepted candidate',()=>{
  assert.deepEqual(manifest.native_frame,[24,32]);
  assert.equal(manifest.walk_atlas.milliseconds_per_frame,110);
  assert.deepEqual(manifest.walk_atlas.rows,['front','left','right','back']);
  assert.equal(Object.keys(manifest.v5_approved_side_sha256).length,12);
  readLocked(manifest.walk_atlas);readLocked(manifest.idle_atlas);readLocked(manifest.approved_front_master);
});
test('new character baseline is staged, not enabled in production runtime',()=>{
  const runtime=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
  assert(!runtime.includes('/assets/myrren-v19b/myrren_walk_4x6_native.png'),'do not hot-swap untested atlas');
  assert(runtime.includes('/kez-v2-atlas.js'),'live Kez V2 renderer retained');
});
