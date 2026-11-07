const assert = require('node:assert/strict');

(async () => {
  const { createJewelheartRewardPolicy } = await import('../src/jewelheart-rewards.mjs');
  const rolls = [49, 50, 49, 50, 19, 20];
  const rollRewards = createJewelheartRewardPolicy({
    coinsPerContributor: 25,
    rares: [
      { itemId: 'fixture_ring', contributorChance: 20, topChance: 50 },
      { itemId: 'fixture_necklace', contributorChance: 20, topChance: 50 }
    ],
    rollBasisPoints: () => rolls.shift()
  });
  const state = {
    id: 'arena/1',
    hp: 0,
    contributions: [
      { playerId: 'lead', damage: 180 },
      { playerId: 'tied', damage: 180 },
      { playerId: 'ally', damage: 90 },
      { playerId: 'spectator', damage: 0 }
    ]
  };

  assert.throws(() => rollRewards({ ...state, hp: 1 }), /defeated/);
  assert.deepEqual(rollRewards(state), {
    encounterId: 'arena/1',
    awards: [
      { playerId: 'lead', coins: 25, items: ['fixture_ring'], topContributor: true },
      { playerId: 'tied', coins: 25, items: ['fixture_ring'], topContributor: true },
      { playerId: 'ally', coins: 25, items: ['fixture_ring'], topContributor: false }
    ]
  });
  assert.equal(rolls.length, 0);
  console.log('PASS: top odds, tied leaders, coin credit, roll thresholds and spectator exclusion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
