'use strict';
// Obsidianite source-lock QA. Visual concepts are NOT production equipment or animations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'docs/obsidianite-canonical-source-lock.json'), 'utf8'));
const SHA = '1acec039f713f3d1e7bdb4c06c63f1f5bc287b3df506ec29d29cfc70b56149ea';
assert.equal(lock.materialId, 7, 'Obsidianite item ID must stay 7');
assert.equal(lock.forgingLevel, 40, 'Obsidianite Forging requirement stays 40');
assert.equal(lock.canonicalFront.sha256, SHA, 'approved source front cannot be replaced');
assert.deepEqual([lock.canonicalFront.width, lock.canonicalFront.height, lock.canonicalFront.mode], [142, 239, 'RGBA']);
assert.equal(lock.canonicalFront.immutable, true);
assert.equal(lock.canonicalFront.visuallyApproved, true);
assert.equal(lock.lockedAppearance.visibleEyes, false);
assert.match(lock.lockedAppearance.lowerFaceSkinOpening, /skin.coloured lower.face opening/);
assert.deepEqual(Object.keys(lock.directionStudies), ['right', 'back', 'left']);
for (const [name, pose] of Object.entries(lock.directionStudies)) {
  assert.match(pose.sha256, /^[a-f0-9]{64}$/, name + ' needs a traceable source');
  assert(pose.width > 0 && pose.height > 0);
  assert.equal(pose.visuallyApproved, false, name + ' is still a direction STUDY');
}
const anim = lock.animationTarget;
assert.deepEqual(anim.directions, ['front', 'right', 'back', 'left']);
assert.deepEqual(anim.actions, ['idle', 'walk', 'attack', 'death']);
assert.equal(anim.plannedCompositeFrames, anim.directions.length * anim.actions.length * anim.framesPerAction);
assert.equal(anim.nativeGridLocked, false, 'native grid cannot be guessed from mixed-size samples');
assert.equal(anim.commonFootAnchorVerified, false);
assert.equal(anim.separableWearablesComplete, false);
assert.equal(lock.acceptance.canMerge, false, 'unreviewed character art must not ship');
if (lock.canonicalFront.assetPathInRepository !== null) {
  const rel = lock.canonicalFront.assetPathInRepository;
  assert.equal(typeof rel, 'string');
  assert(rel.length > 0 && !path.isAbsolute(rel) && !rel.split(/[\/\\]/).includes('..'));
  const binary = fs.readFileSync(path.resolve(root, rel));
  assert.equal(crypto.createHash('sha256').update(binary).digest('hex'), SHA);
  assert.equal(binary.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(binary.subarray(12, 16).toString(), 'IHDR');
  assert.equal(binary.readUInt32BE(16), 142);
  assert.equal(binary.readUInt32BE(20), 239);
  assert.equal(binary[25], 6, 'approved source must remain RGBA');
}
console.log('PASS: canonical Obsidianite front, existing item tier, and draft-only art QA gates');
