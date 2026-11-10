'use strict';
const assert = require('node:assert/strict');
const createGame = require('./game-runtime.cjs');

(async () => {
  const { ServerPlayerHealth, playerHpAt, BOSS_STRIKE_DAMAGE } =
    await import('../src/server-player-health.mjs');
  const { game } = await createGame();
  for (const level of [1, 5, 10, 30, 40, 55, 70, 100])
    assert.equal(playerHpAt(level), game.hpAt(level),
      'server and browser HP must match at level ' + level);
  for (const type of ['cave', 'abear']) {
    assert.equal(BOSS_STRIKE_DAMAGE[type].level, game.MT[type].lv);
    assert.equal(BOSS_STRIKE_DAMAGE[type].maxHit, game.MT[type].max);
  }

  const people = new Map([
    ['alice', { roomId: 'r1', level: 40, defenseTotal: 0 }],
    ['bob', { roomId: 'r1', level: 70, defenseTotal: 150 }]
  ]);
  const positions = new Map([
    ['alice', { roomId: 'r1', x: 200, y: 200 }],
    ['bob', { roomId: 'r1', x: 203, y: 200 }]
  ]);
  let rng = [0, .99999, 0, 0], roll = 0;
  const options = {
    roomId: 'r1',
    getVerifiedCharacter: id => people.get(id),
    getVerifiedPosition: id => positions.get(id),
    random: () => rng[roll++ % rng.length]
  };
  const health = new ServerPlayerHealth(options);
  assert.equal(health.join('alice').maxHp, playerHpAt(40));
  assert.equal(health.join('bob').maxHp, playerHpAt(70));
  assert.equal(health.member('unknown'), null);
  const first = {
    kind: 'strike',
    key: JSON.stringify(['r1', 'boss', 'life-1', 'strike', 1]),
    sequence: 1, type: 'cave', x: 200, y: 200, radius: 16,
    targets: ['alice', 'bob']
  };
  const hit = health.applyVerifiedStrike(first);
  assert.equal(hit.applied, true);
  assert.deepEqual(hit.hits.map(h => h.accountId), ['alice', 'bob']);
  // Alice: hit=0 roll, raw 13, zero defence. Bob: hit=0 roll,
  // raw 1, positive armour reduction floors at min 1.
  assert.equal(hit.hits[0].damage, BOSS_STRIKE_DAMAGE.cave.maxHit);
  assert.equal(hit.hits[1].damage, 1);
  const after = health.member('alice').hp;
  assert.deepEqual(health.applyVerifiedStrike(first),
    { applied: false, reason: 'already-processed', hits: [] });
  assert.equal(health.member('alice').hp, after);

  const second = { ...first,
    key: JSON.stringify(['r1', 'boss', 'life-1', 'strike', 2]),
    sequence: 2, targets: [] };
  assert.equal(health.applyVerifiedStrike(second).applied, true,
    'missed warning still advances sequence and cannot replay');
  assert.throws(() => health.applyVerifiedStrike({ ...first,
    key: JSON.stringify(['r1', 'boss', 'life-1', 'strike', 4]),
    sequence: 4
  }), /Noncontiguous/);
  const otherSpawn = { ...first,
    key: JSON.stringify(['r1', 'boss', 'life-2', 'strike', 1]),
    targets: [], sequence: 1 };
  assert.equal(health.applyVerifiedStrike(otherSpawn).applied, true,
    'new boss life starts independent replay protection');
  const differentBoss = { ...first,
    key: JSON.stringify(['r1', 'other-boss', 'life-1', 'strike', 1]),
    targets: [], sequence: 1 };
  assert.equal(health.applyVerifiedStrike(differentBoss).applied, true);

  positions.get('alice').x = 300;
  const poison = { ...first,
    key: JSON.stringify(['r1', 'boss', 'life-1', 'strike', 3]),
    sequence: 3, targets: ['alice', 'bob'] };
  assert.throws(() => health.applyVerifiedStrike(poison),
    /Unverified strike target position/,
    'cannot damage outside server-confirmed warning radius');
  assert.equal(health.member('alice').hp, after,
    'reject must not partially mutate HP on invalid target');
  positions.get('alice').x = 200;
  people.delete('bob');
  assert.throws(() => health.applyVerifiedStrike(poison),
    /Invalid trusted character stats/,
    'all recipients validated before mutating any player');
  assert.equal(health.member('alice').hp, after);
  people.set('bob', { roomId: 'r1', level: 70, defenseTotal: 150 });
  assert.equal(health.applyVerifiedStrike(poison).applied, true);

  const saved = structuredClone(health.exportDurableState());
  const restored = ServerPlayerHealth.fromDurableState(saved, options);
  assert.deepEqual(restored.exportDurableState(), saved,
    'health and per-spawn strike cursors survive restarts');
  assert.equal(restored.applyVerifiedStrike(poison).applied, false);
  assert.throws(() => ServerPlayerHealth.fromDurableState({
    ...saved, members: [['alice', { hp: -1, maxHp: 100 }]]
  }, options), /player HP/);
  assert.throws(() => ServerPlayerHealth.fromDurableState({
    ...saved, cursors: [['not-valid-json', 1]]
  }, options), /strike source/);

  // Reconnection can never revive or refill a character.
  const lethal = new ServerPlayerHealth({
    ...options, random: () => 0
  });
  lethal.join('alice');
  let seq = 0;
  while (lethal.isAlive('alice')) {
    seq++;
    assert(seq <= playerHpAt(40), 'lethal sequence terminates');
    lethal.applyVerifiedStrike({
      ...first, sequence: seq, targets: ['alice'],
      key: JSON.stringify(['r1', 'boss', 'final', 'strike', seq])
    });
  }
  assert.equal(lethal.member('alice').hp, 0);
  assert.equal(lethal.join('alice').hp, 0,
    'rejoining must not silently heal a defeated combatant');
  const deadSaved = lethal.exportDurableState();
  const stillDead = ServerPlayerHealth.fromDurableState(deadSaved, options);
  assert.equal(stillDead.isAlive('alice'), false);
  assert.equal(stillDead.respawnVerified('alice'), true);
  assert.equal(stillDead.member('alice').hp, playerHpAt(40));
  assert.equal(stillDead.respawnVerified('alice'), false);
  assert.equal(stillDead.applyVerifiedStrike({
    ...first, sequence: seq, targets: ['alice'],
    key: JSON.stringify(['r1', 'boss', 'final', 'strike', seq])
  }).applied, false, 'respawning never resets an old boss strike cursor');

  assert.throws(() => new ServerPlayerHealth({
    ...options, roomId: ' '
  }), /Trusted room/);
  assert.throws(() => restored.applyVerifiedStrike({
    ...first, targets: ['bob', 'alice'],
    key: JSON.stringify(['r1', 'boss', 'life-1', 'strike', 4]),
    sequence: 4
  }), /unique and sorted/);
  assert.throws(() => restored.applyVerifiedStrike({
    ...first, key: JSON.stringify(['wrong', 'boss', 'life-1', 'strike', 4]),
    sequence: 4
  }), /identity mismatch/);

  console.log('PASS: live HP/damage parity, verified defence, dodges, ordered strike replay protection, partial-write rejection, death, respawn and save integrity');
})().catch(error => { console.error(error); process.exitCode = 1; });
