'use strict';
const assert = require('node:assert/strict');
const createGame = require('./game-runtime.cjs');

(async () => {
  const { ServerBossBehavior, BOSS_AI_PROFILES } =
    await import('../src/server-boss-behavior.mjs');
  const { game } = await createGame();
  for (const type of ['cave', 'abear']) {
    const a = BOSS_AI_PROFILES[type], live = game.MT[type];
    assert.equal(a.speed, live.sp, type + ' pursuit speed');
    assert.equal(a.aggro, live.ag, type + ' aggro distance');
    assert.equal(a.attackIntervalMs, live.iv * 1000, type + ' strike interval');
    assert.equal(a.warningMs, live.telegraph.ms, type + ' warning duration');
    assert.equal(a.radius, live.telegraph.radius, type + ' telegraph radius');
  }

  let now = 0;
  let players = [
    { accountId: 'alice', roomId: 'grove', x: 200, y: 204, alive: true },
    { accountId: 'bob', roomId: 'grove', x: 250, y: 204, alive: true }
  ];
  const build = options => new ServerBossBehavior({
    roomId: 'grove', bossId: 'cave-bear', spawnId: 'life-1',
    type: 'cave', homeX: 200, homeY: 200,
    getVerifiedPlayers: () => players,
    isWalkable: () => true,
    clock: () => now,
    ...options
  });
  const ai = build();
  assert.deepEqual(ai.tick(), []);
  assert.equal(ai.mode, 'chase');
  assert.equal(ai.targetId, 'alice');
  assert.deepEqual(ai.tick(), [], 'same timestamp cannot advance AI attacks');
  now = 499;
  assert.deepEqual(ai.tick(), []);
  now = 500;
  const warning = ai.tick();
  assert.equal(warning.length, 1);
  assert.equal(warning[0].kind, 'warning');
  assert.equal(warning[0].endsAt, 1200);
  assert.equal(warning[0].radius, 16);
  assert.equal(ai.state.x, 200, 'warning freezes boss position');
  assert.deepEqual(ai.tick(), [], 'same frame cannot duplicate warning');

  // Server-verified dodge after warning starts prevents a hit even if the
  // player was initially within melee reach.
  players[0].x = 225;
  now = 1200;
  const dodged = ai.tick();
  assert.equal(dodged.length, 1);
  assert.equal(dodged[0].kind, 'strike');
  assert.deepEqual(dodged[0].targets, []);
  assert.equal(dodged[0].sequence, 1);
  assert.equal(ai.sequence, 1);
  assert.deepEqual(ai.tick(), [], 'replayed tick cannot produce another strike');

  players[0].x = 200;
  now = 2899;
  assert.deepEqual(ai.tick(), []);
  now = 2900;
  assert.equal(ai.tick()[0].kind, 'warning');
  now = 3600;
  const second = ai.tick()[0];
  assert.equal(second.kind, 'strike');
  assert.deepEqual(second.targets, ['alice']);
  assert.equal(second.sequence, 2);
  assert.notEqual(second.key, dodged[0].key,
    'every verified strike must use a unique durable key');
  assert.equal(ai.sequence, 2);

  const saved = structuredClone(ai.exportDurableState());
  const restarted = ServerBossBehavior.restore(saved, {
    roomId: 'grove', bossId: 'cave-bear', spawnId: 'life-1',
    type: 'cave', homeX: 200, homeY: 200,
    getVerifiedPlayers: () => players,
    isWalkable: () => true, clock: () => now
  });
  assert.deepEqual(restarted.exportDurableState(), saved);
  assert.deepEqual(restarted.tick(), [],
    'restarting from committed state must not repeat the last strike');
  now = 3700;
  players[0].x = 500; players[1].x = 500;
  const returned = restarted.tick();
  assert.equal(returned.length, 1);
  assert.equal(returned[0].kind, 'leash-reset');
  assert.equal(restarted.mode, 'idle');
  assert.equal(restarted.resetSequence, 1);
  const firstResetKey = returned[0].key;

  // Same spawn may retreat repeatedly without replaying one reset event.
  players[0].x = 200;
  now = 3800;
  assert.deepEqual(restarted.tick(), []);
  assert.equal(restarted.mode, 'chase');
  players[0].x = 500;
  now = 3900;
  const anotherReset = restarted.tick();
  assert.equal(anotherReset[0].kind, 'leash-reset');
  assert.notEqual(anotherReset[0].key, firstResetKey);
  assert.equal(restarted.resetSequence, 2);

  // Chase is server-timed and bounded, including a huge paused-tick gap.
  now = 0;
  players = [{ accountId: 'runner', roomId: 'grove',
    x: 328, y: 300, alive: true }];
  const pursuer = build({
    homeX: 300, homeY: 300,
    isWalkable: (x, y) => x < 309
  });
  pursuer.tick();
  now = 100;
  pursuer.tick();
  assert(Math.abs(pursuer.x - 303.2) < 1e-7);
  now = 10_100;
  pursuer.tick();
  assert(Math.abs(pursuer.x - 306.4) < 1e-7,
    'long pauses cannot grant 10 seconds of instant pursuit');
  for (let i = 0; i < 20; i++) {
    now += 100;
    pursuer.tick();
    assert(pursuer.x < 309, 'server collider prevents walking through a wall');
  }
  // Target disappear initiates return; idle state restores at spawn.
  players = [];
  now += 100;
  pursuer.tick();
  assert.equal(pursuer.mode, 'return');
  for (let i = 0; i < 10 && pursuer.mode === 'return'; i++) {
    now += 100; pursuer.tick();
  }
  assert.equal(pursuer.mode, 'idle');
  assert.equal(pursuer.x, 300);
  assert.equal(pursuer.y, 300);

  // Any defeated instance stays terminal, even after server restart.
  const defeated = build({ homeX: 300, homeY: 300 });
  assert.equal(defeated.defeat(), true);
  assert.equal(defeated.defeat(), false);
  const deadState = structuredClone(defeated.exportDurableState());
  const deadAgain = ServerBossBehavior.restore(deadState, {
    roomId: 'grove', bossId: 'cave-bear', spawnId: 'life-1',
    type: 'cave', homeX: 300, homeY: 300,
    getVerifiedPlayers: () => players, isWalkable: () => true,
    clock: () => now
  });
  assert.deepEqual(deadAgain.tick(), []);
  assert.equal(deadAgain.mode, 'dead');

  // Stored snapshots and public callbacks reject spoofed/invalid identities.
  assert.throws(() => ServerBossBehavior.restore({
    ...saved, roomId: 'other'
  }, {
    roomId: 'grove', bossId: 'cave-bear', spawnId: 'life-1', type: 'cave',
    homeX: 200, homeY: 200,
    getVerifiedPlayers: () => players, isWalkable: () => true,
    clock: () => now
  }), /snapshot/);
  players = [
    { accountId: 'a', roomId: 'grove', x: 200, y: 200, alive: true },
    { accountId: 'a', roomId: 'grove', x: 201, y: 200, alive: true }
  ];
  const invalid = build();
  assert.throws(() => invalid.tick(), /Duplicate authoritative/);
  players = [];
  now = -1;
  assert.throws(() => invalid.tick(), /clock/);

  console.log('PASS: server boss aggro, bounded chase, walls, immutable telegraphs, dodge, unique hits, leash resets, persistence, dead spawns and stats parity');
})().catch(err => { console.error(err); process.exitCode = 1; });
