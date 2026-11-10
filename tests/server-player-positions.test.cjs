'use strict';
const assert = require('node:assert/strict');

(async () => {
  const { ServerPlayerPositions } = await import('../src/server-player-positions.mjs');
  const { ServerBossEncounter } = await import('../src/boss-encounter.mjs');
  let now = 1000;
  const sessions = new Map([
    ['a', { accountId: 'alice', roomId: 'grove' }],
    ['a-reconnect', { accountId: 'alice', roomId: 'grove' }],
    ['b', { accountId: 'bob', roomId: 'grove' }],
    ['outside', { accountId: 'outsider', roomId: 'elsewhere' }]
  ]);
  const character = new Map([
    ['alice', { level: 100, attackBonus: 16,
      weaponKind: 'sword', alive: true, indoors: false }],
    ['bob', { level: 70, attackBonus: 5,
      weaponKind: 'fist', alive: true, indoors: false }]
  ]);
  const options = {
    roomId: 'grove', authenticateSession: session => sessions.get(session),
    getCharacter: id => character.get(id),
    getSpawn: id => id === 'alice' ? { x: 300, y: 304 } : { x: 400, y: 404 },
    isWalkable: (x, y) => x < 330 || x > 340,
    clock: () => now
  };
  const positions = new ServerPlayerPositions(options);
  assert.deepEqual(positions.join('invalid'), { ok: false, reason: 'unauthorized' });
  assert.deepEqual(positions.join('outside'), { ok: false, reason: 'unauthorized' });
  assert.deepEqual(positions.move('a', { dx: 1, dy: 0 }),
    { ok: false, reason: 'not-joined' });
  assert.deepEqual(positions.join('a'),
    { ok: true, accountId: 'alice', x: 300, y: 304 });
  assert.equal(positions.resolveVerifiedPlayer('a').x, 300);
  assert.equal(positions.resolveVerifiedPlayer('outside'), null);
  assert.equal(positions.resolveVerifiedPlayer('b'), null);

  const noSpoof = [
    { dx: 0, dy: 0, x: 1000 },
    { dx: 1, dy: 0, speed: 1000 },
    { dx: 2, dy: 0 }, { dx: Infinity, dy: 0 },
    { dx: NaN, dy: 0 }, { dx: 0, dy: 0, level: 100 },
    null, { dx: 1 }, [1, 0]
  ];
  for (const intent of noSpoof) {
    assert.equal(positions.move('a', intent).reason, 'invalid-input');
    assert.equal(positions.resolveVerifiedPlayer('a').x, 300,
      'untrusted move data must never modify server position');
  }
  now += 100;
  const step = positions.move('a', { dx: 1, dy: 0 });
  assert(step.ok);
  assert(Math.abs(step.x - 309) < 1e-9,
    '90 pixels per second and 100ms server elapsed time');
  now += 10_000;
  const capped = positions.move('a', { dx: 1, dy: 0 });
  assert(Math.abs(capped.x - 318) < 1e-9,
    'large network delay must not turn into an instant teleport');
  now += 100;
  const wall = positions.move('a', { dx: 1, dy: 0 });
  assert(wall.ok && wall.x < 330,
    'small collision steps cannot jump the impassable 330-340 strip');
  for (let i = 0; i < 10; i++) {
    now += 100;
    assert(positions.move('a', { dx: 1, dy: 0 }).x < 330,
      'repeated movement packets must not cross a wall');
  }
  now += 100;
  const diagonal = positions.move('a', { dx: 1, dy: 1 });
  assert(diagonal.ok && diagonal.moved <= 9 + 1e-9,
    'diagonal movement must be normalized and capped');
  const previous = positions.resolveVerifiedPlayer('a');
  now += 10_000;
  assert.deepEqual(positions.join('a-reconnect'), {
    ok: true, accountId: 'alice', x: previous.x, y: previous.y
  }, 'reconnect must not teleport or reset position');
  assert.equal(positions.move('a-reconnect', { dx: 0, dy: 0 }).moved, 0);
  assert(positions.resolveVerifiedPlayer('a-reconnect').x < 330);

  character.get('alice').alive = false;
  assert.equal(positions.move('a', { dx: 1, dy: 0 }).reason, 'cannot-move');
  assert.equal(positions.resolveVerifiedPlayer('a').alive, false);
  character.get('alice').alive = true;
  character.get('alice').indoors = true;
  assert.equal(positions.move('a', { dx: 1, dy: 0 }).reason, 'cannot-move');
  character.get('alice').indoors = false;
  character.get('alice').level = 200;
  assert.equal(positions.resolveVerifiedPlayer('a'), null,
    'invalid trusted combat stats fail closed');
  character.get('alice').level = 100;

  const saved = structuredClone(positions.exportDurableState());
  const restored = ServerPlayerPositions.fromDurableState(saved, options);
  assert.deepEqual(restored.exportDurableState(), saved,
    'room position snapshot must survive server restart');
  assert.equal(restored.resolveVerifiedPlayer('a').accountId, 'alice');
  const duplicate = structuredClone(saved);
  duplicate.players.push(structuredClone(duplicate.players[0]));
  assert.throws(() => ServerPlayerPositions.fromDurableState(duplicate, options),
    /persisted player/);
  const tampered = structuredClone(saved);
  tampered.players[0].x = Infinity;
  assert.throws(() => ServerPlayerPositions.fromDurableState(tampered, options),
    /persisted player/);
  const wrongRoom = { ...saved, roomId: 'wrong' };
  assert.throws(() => ServerPlayerPositions.fromDurableState(wrongRoom, options),
    /movement snapshot/);
  const originalTime = now;
  now -= 100;
  assert.equal(restored.move('a', { dx: 1, dy: 0 }).reason, 'clock-regressed');
  now = originalTime;

  // Integrates with the existing server combat core: client cannot directly
  // claim proximity, equipment or damage. The server resolver supplies them.
  const boss = new ServerBossEncounter({
    roomId: 'grove', bossId: 'cave-1', spawnId: 'life-1',
    type: 'cave', x: 300, y: 300,
    resolveVerifiedPlayer: session => restored.resolveVerifiedPlayer(session),
    clock: () => now, random: () => 0
  });
  // Alice is now safely stopped by the x=330 collider but still within 30px
  // of the boss's x=300 position.
  const distance = Math.hypot(
    restored.resolveVerifiedPlayer('a').x - 300,
    restored.resolveVerifiedPlayer('a').y - 304
  );
  assert(distance < 30);
  const hit = boss.attack('a');
  assert.equal(hit.ok, true);
  assert(hit.damage > 0);
  assert.equal(boss.attack('outside').reason, 'unauthorized');
  assert.equal(boss.attack('a-reconnect').reason, 'cooldown');
  assert.equal(boss.state.hp, 150 - hit.damage);

  // Isolated module is deliberately not a substitute for actual Durable
  // Object storage, authenticated login or full world collision geometry.
  console.log('PASS: server movement bounds/collision, no speedhack/teleport, cross-session identity, restart, dead player, and boss reach authority');
})().catch(error => { console.error(error); process.exitCode = 1; });
