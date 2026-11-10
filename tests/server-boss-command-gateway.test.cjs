'use strict';
const assert = require('node:assert/strict');

(async () => {
  const { createBossCommandGateway, createBossHttpCommandHandler } =
    await import('../src/server-boss-command-gateway.mjs');
  const verified = new Map([
    ['Bearer alice-access-token', 'alice'],
    ['Bearer bob-access-token', 'bob']
  ]);
  const auth = {
    async verifyBearer(value) {
      const id = verified.get(value);
      return id ? { ok: true, accountId: id } :
        { ok: false, reason: 'unauthorized' };
    }
  };
  const actions = [], factories = [];
  const roomFactory = async accountId => {
    factories.push(accountId);
    const sessionKey = 'private-session-for-' + accountId;
    const check = provided => {
      assert.equal(provided, sessionKey,
        'room operations may only use a trusted server session');
      return accountId;
    };
    return {
      sessionKey,
      room: {
        async join(session) {
          const id = check(session);
          actions.push({ type: 'join', id });
          return { ok: true, accountId: id, x: 200, y: 200 };
        },
        async snapshot(session) {
          const id = check(session);
          actions.push({ type: 'snapshot', id });
          return { ok: true, me: { hp: 100 }, boss: { hp: 150 } };
        },
        async move(session, intent) {
          const id = check(session);
          actions.push({ type: 'move', id, intent });
          return { ok: true, moved: 9 };
        },
        async attack(session) {
          const id = check(session);
          actions.push({ type: 'attack', id });
          return { ok: true, hit: true, damage: 4 };
        },
        async updates(session, afterSequence) {
          const id = check(session);
          actions.push({ type: 'updates', id, afterSequence });
          return { ok: true, events: [], latestSequence: 2 };
        }
      }
    };
  };
  const gateway = createBossCommandGateway({
    authenticator: auth, createTrustedRoom: roomFactory
  });
  const dispatch = (authorization, command) =>
    gateway({ authorization, command });
  assert.deepEqual(await dispatch(null, { type: 'join' }),
    { ok: false, reason: 'unauthorized' });
  assert.equal(factories.length, 0,
    'no private room allocated before authentication');
  assert.deepEqual(await dispatch('Bearer alice-access-token', { type: 'join' }),
    { ok: true, accountId: 'alice', x: 200, y: 200 });
  assert.deepEqual(await dispatch('Bearer bob-access-token', { type: 'join' }),
    { ok: true, accountId: 'bob', x: 200, y: 200 });
  assert.equal((await dispatch('Bearer alice-access-token',
    { type: 'attack' })).damage, 4);
  assert.equal((await dispatch('Bearer alice-access-token',
    { type: 'snapshot' })).me.hp, 100);
  assert.equal((await dispatch('Bearer alice-access-token',
    { type: 'move', dx: 1, dy: 0 })).moved, 9);
  assert.equal((await dispatch('Bearer alice-access-token',
    { type: 'updates', afterSequence: 1 })).latestSequence, 2);
  assert.deepEqual(actions, [
    { type: 'join', id: 'alice' },
    { type: 'join', id: 'bob' },
    { type: 'attack', id: 'alice' },
    { type: 'snapshot', id: 'alice' },
    { type: 'move', id: 'alice', intent: { dx: 1, dy: 0 } },
    { type: 'updates', id: 'alice', afterSequence: 1 }
  ]);

  // No client-chosen level, equipment, time, coordinates, damage,
  // boss identity, arbitrary death/reward or privileged tick commands.
  const invalid = [
    { type: 'attack', damage: 1e9 },
    { type: 'attack', accountId: 'bob' },
    { type: 'join', roomId: 'different-room' },
    { type: 'join', level: 100 },
    { type: 'join', defenseTotal: 1e9 },
    { type: 'snapshot', sessionKey: 'other-account' },
    { type: 'move', x: 1500, y: 1500 },
    { type: 'move', dx: 3, dy: 0 },
    { type: 'move', dx: Number.NaN, dy: 0 },
    { type: 'move', dx: 0, dy: 0, dt: 1000 },
    { type: 'updates', afterSequence: -1 },
    { type: 'updates', afterSequence: 1.5 },
    { type: 'tick' },
    { type: 'respawn' },
    { type: 'claimRewards' },
    { type: 'acknowledgeAward' },
    { type: 'admin' },
    null, [], {}, 'join'
  ];
  const before = actions.length;
  for (const payload of invalid) {
    assert.deepEqual(await dispatch('Bearer alice-access-token', payload),
      { ok: false, reason: 'invalid-command' },
      'unsafe player request rejected: ' + JSON.stringify(payload));
  }
  assert.equal(actions.length, before,
    'invalid commands must not touch mutable room state');

  const handler = createBossHttpCommandHandler({
    authenticator: auth, createTrustedRoom: roomFactory
  });
  const request = (value, options = {}) => new Request(
    'https://game.example/internal/boss/command',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer alice-access-token',
        ...(options.headers || {})
      },
      body: JSON.stringify(value)
    });
  const good = await handler(request({ type: 'move', dx: 0, dy: 1 }));
  assert.equal(good.status, 200);
  assert.equal(good.headers.get('cache-control'), 'no-store');
  assert.equal(good.headers.get('access-control-allow-origin'), null,
    'must not enable cross-site access by default');
  assert.equal((await good.json()).moved, 9);

  const oversized = await handler(request({
    type: 'attack', padding: 'a'.repeat(1024)
  }));
  assert.equal(oversized.status, 400,
    'oversized command bodies rejected before parsing');
  assert.equal((await oversized.json()).reason, 'invalid-command');

  const unauth = await handler(request({ type: 'attack' }, {
    headers: { Authorization: 'Bearer forged-token' }
  }));
  assert.equal(unauth.status, 401);
  assert.deepEqual(await unauth.json(),
    { ok: false, reason: 'unauthorized' });
  const wrongMethod = await handler(new Request(
    'https://game.example/internal/boss/command',
    { method: 'GET' }));
  assert.equal(wrongMethod.status, 405);
  const wrongRoute = await handler(new Request(
    'https://game.example/anything-else',
    { method: 'POST' }));
  assert.equal(wrongRoute.status, 404);

  const badContext = createBossHttpCommandHandler({
    authenticator: auth,
    createTrustedRoom: async () => {
      throw new Error('PRIVATE DATABASE API KEY must never leak');
    }
  });
  const unavailable = await badContext(request({ type: 'join' }));
  assert.equal(unavailable.status, 503);
  assert.equal(JSON.stringify(await unavailable.json()).includes('PRIVATE'), false);
  assert.throws(() => createBossCommandGateway({
    authenticator: null, createTrustedRoom: roomFactory
  }), /Verified login/);

  console.log('PASS: authenticated gameplay command allowlist, spoofed damage/position rejection, bounded HTTP, private sessions, no public data leaks');
})().catch(error => { console.error(error); process.exitCode = 1; });
