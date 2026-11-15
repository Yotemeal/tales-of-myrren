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
test('production V19F native artwork is guarded by existing Kez V2 fallback',()=>{
  const runtime=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
  assert(runtime.includes('/kez-v2-atlas.js'),'legacy Kez V2 renderer must remain available');
  assert(runtime.includes('/myrren-v19f-atlas.js'),'approved V19F native atlas must be loaded');
  assert(runtime.includes('window.MyrrenV19BAtlas=window.MyrrenV19FAtlas;'),
    'existing compositor must receive V19F through compatible native interface');
  assert(runtime.includes('/myrren-v19b-optin-game-bridge.js'),'guarded fallback bridge must be loaded');
  assert(runtime.indexOf('/kez-v2-atlas.js')<runtime.indexOf('/myrren-v19f-atlas.js'));
  assert(runtime.indexOf('/myrren-v19f-atlas.js')<
    runtime.indexOf('window.MyrrenV19BAtlas=window.MyrrenV19FAtlas;'));
  assert(runtime.indexOf('window.MyrrenV19BAtlas=window.MyrrenV19FAtlas;')<
    runtime.indexOf('/myrren-v19b-optin-game-bridge.js'));
  // The approved bridge must run before the single, cache-versioned game bundle.
  // Versions may advance for unrelated art updates; do not pin to build 94.
  const matches=[...runtime.matchAll(/<script\s+src="(\/myrren-game\.js\?v=\d+)"\s*><\/script>/g)];
  assert.equal(matches.length,1,'exactly one numeric-versioned game bundle');
  assert(runtime.indexOf('/myrren-v19b-optin-game-bridge.js')<
    runtime.indexOf(matches[0][1]),'guarded bridge must load before the game');
});
