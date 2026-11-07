const assert = require('node:assert/strict');

(async () => {
  const { createJewelheartEncounter, applyJewelheartStrike, resetJewelheartEncounter } =
    await import('../src/jewelheart-encounter.mjs');
  const initial = createJewelheartEncounter('arena/1', 450);
  const strike = (state, playerId, sequence, damage, encounterId = 'arena/1') =>
    applyJewelheartStrike(state, { playerId, sequence, damage, encounterId });

  const first = strike(initial, 'lead', 1, 200);
  assert.equal(first.state.hp, 250);
  assert.equal(initial.hp, 450);
  assert.deepEqual(initial.contributions, []);
  assert.equal(strike(first.state, 'lead', 1, 200).state, first.state);

  // A reconnect restores the same health and replay protection.
  const restored = JSON.parse(JSON.stringify(first.state));
  const second = strike(restored, 'ally', 1, 180);
  assert.equal(second.state.hp, 70);
  assert.equal(strike(second.state, 'lead', 1, 200).appliedDamage, 0);

  const missed = strike(second.state, 'spectator', 1, 0);
  assert.equal(missed.state.hp, 70);
  assert.equal(strike(missed.state, 'spectator', 1, 70).appliedDamage, 0);

  const final = strike(missed.state, 'lead', 2, 200);
  assert.equal(final.appliedDamage, 70);
  assert.equal(final.defeated, true);
  assert.deepEqual(final.state.contributions, [
    { playerId: 'lead', sequence: 2, damage: 270 },
    { playerId: 'ally', sequence: 1, damage: 180 },
    { playerId: 'spectator', sequence: 1, damage: 0 }
  ]);
  const late = strike(final.state, 'ally', 2, 100);
  assert.equal(late.state, final.state);
  assert.equal(late.defeated, false);

  assert.throws(() => resetJewelheartEncounter(final.state, 'arena/1'), TypeError);
  const reset = resetJewelheartEncounter(final.state, 'arena/2');
  assert.equal(reset.hp, 450);
  assert.deepEqual(reset.contributions, []);
  assert.equal(strike(reset, 'lead', 3, 100).state, reset);
  assert.equal(strike(reset, 'lead', 1, 100, 'arena/2').state.hp, 350);
  assert.throws(() => strike(reset, 'lead', 1, -1, 'arena/2'), TypeError);
  console.log('PASS: shared HP, actual contribution, replay handling, one defeat, snapshot restore and clean reset.');
})().catch(error => { console.error(error); process.exitCode = 1; });
