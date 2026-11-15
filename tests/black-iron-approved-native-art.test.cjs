'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const manifest=require('../docs/black-iron-approved-native-v1.json');
function hash(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
test('Approved source mapping: original V19F hero remains byte-identical',()=>{
 assert.equal(hash(path.join(root,manifest.hero_reference)),manifest.hero_sha256);
});
test('Black Iron native asset is transparent RGBA 28x20 and locked by SHA-256',()=>{
 const sprite=fs.readFileSync(path.join(root,manifest.sprite));
 assert.deepEqual([...sprite.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(sprite.toString('ascii',12,16),'IHDR');
 assert.equal(sprite.readUInt32BE(16),28);
 assert.equal(sprite.readUInt32BE(20),20);
 assert.equal(sprite[24],8);
 assert.equal(sprite[25],6);
 assert.equal(hash(path.join(root,manifest.sprite)),manifest.sprite_sha256);
 assert.equal(manifest.camera_zoom,2);
 assert.equal(manifest.world_target_width,28);
});
test('Review is isolated: only candidate asset, no runtime rename or existing asset swap',()=>{
 assert.ok(manifest.legacy_art_untouched && manifest.gameplay_untouched);
 assert.equal(manifest.safe_resource_id,'cobalt');
 assert.ok(fs.existsSync(path.join(root,'public/assets/resources/ore_black_iron.png')));
 const page=fs.readFileSync(path.join(root,'public/black-iron-approved-native-review.html'),'utf8');
 assert.match(page,/ore_black_iron_v1_28x20\.png/);
 assert.match(page,/myrren_front_game_ready_24x32\.png/);
});
