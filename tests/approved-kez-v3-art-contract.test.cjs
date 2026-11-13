'use strict';
// Approved artwork ≠ complete game assets. Do not silently ship partial art.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const c=JSON.parse(fs.readFileSync('docs/approved-kez-v3-production-contract.json','utf8'));
const expected=[['bronze',2],['iron',3],['steel',4],['black_iron',5],
  ['obsidianite',7],['myrrenite',6],['starsteel',8]];
assert.equal(c.schemaVersion,1);
assert.equal(c.approvedCharacter.referenceFilename,'a_clean_professional_pixel_art_game_asset_sheet_i.png');
assert.match(c.approvedCharacter.sha256,/^[a-f0-9]{64}$/);
assert.deepEqual(c.armour.materialOrder.map(t=>[t.name,t.id]),expected);
assert.equal(c.armour.visualApproval,true);
assert.equal(c.approvedCharacter.sourceMasterIsProductionAtlas,false);
assert.equal(c.armour.separateWearableSlotArtCompleted,false);
assert.equal(c.armour.directionalArmourArtworkCompleted,false);
assert.deepEqual(c.armour.slots,['helmet','body','legs','boots','gloves','shield']);
assert.deepEqual(c.production.directions,['front','right','back','left']);
assert.deepEqual(Object.keys(c.production.baseActions),['idle','walk','punch','sword','hurt','death']);
for(const [action,frames] of Object.entries(c.production.baseActions)){
  assert(Number.isInteger(frames)&&frames>=2&&frames<=8,'required frames: '+action);
}
assert.equal(c.production.nativeFrameSize,null,'do not lock sprite resolution without real-game review');
assert.equal(c.production.worldDrawScale,null,'do not lock gameplay size without real-game review');
assert.equal(c.production.transparentPngsRequired,true);
assert.equal(c.production.sourceAlignedToSharedFootPivot,true);
assert.equal(c.weapons.swordAndShieldSameHandForbidden,true);
assert.match(c.weapons.previousReferenceSha256,/^[a-f0-9]{64}$/);
assert.equal(c.bronzeCompositeProof.referenceSha256,'efaf7a296bb7b9aeb321193c8ac53daa02909719f91efa1fb456d387f5f90029');
assert.equal(c.bronzeCompositeProof.materialId,2);
assert.equal(c.bronzeCompositeProof.sourceDerivedFrames,64);
assert.deepEqual(c.bronzeCompositeProof.directions,['front','right','back','left']);
assert.deepEqual(c.bronzeCompositeProof.actions,['idle','walk','attack','death']);
assert.equal(c.bronzeCompositeProof.readyToMerge,false);
assert.equal(c.bronzeCompositeProof.qa.atlasReconstruction,true);
assert.equal(c.bronzeCompositeProof.qa.mobileBrowserIntegrated,false);
assert.equal(c.releaseGate.readyForDefaultGame,false,'do not publish unreviewed sprite assets');
assert(c.releaseGate.reasons.length>=5,'incomplete source art must list release blockers');
assert.equal(c.releaseGate.existingGameBuildOnMainAtLock,88);
const game=fs.readFileSync('public/myrren-game.js','utf8');
assert(game.includes('window.MyrrenBuild=88;'),'production game must stay untouched in reference branch');
const legacyGear=fs.readFileSync('public/kez-v2-equipment.js','utf8');
assert(legacyGear.includes('const ORDER=[2,3,4,5,7,6,8];'));
console.log('PASS: approved Kez reference SHA, seven material IDs, art/readiness gates and unchanged build 88');
