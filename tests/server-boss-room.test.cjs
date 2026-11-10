'use strict';
const assert = require('node:assert/strict');
const clone = value => value === undefined ? undefined : structuredClone(value);
class TransactionalMemory {
  constructor() { this.data = new Map(); this.tail = Promise.resolve(); this.failNextCommit = false; }
  async transaction(fn) {
    let unlock;
    const current = new Promise(resolve => { unlock = resolve; });
    const previous = this.tail; this.tail = current;
    await previous;
    const staged = new Map([...this.data].map(([k, v]) => [k, clone(v)]));
    const tx = {
      get: async key => clone(staged.get(key)),
      put: async (key, value) => { staged.set(key, clone(value)); },
      list: async ({ prefix }) => new Map([...staged].filter(([key]) =>
        key.startsWith(prefix)).map(([key, value]) => [key, clone(value)]))
    };
    try {
      const result = await fn(tx);
      if (this.failNextCommit) {
        this.failNextCommit = false;
        throw Error('simulated atomic storage failure');
      }
      this.data = staged;
      return result;
    } finally { unlock(); }
  }
}

(async () => {
  const { ServerBossRoom } = await import('../src/server-boss-room.mjs');
  const { BossAccountRewardLedger } = await import('../src/boss-account-ledger.mjs');
  const { deliverBossOutbox } = await import('../src/boss-reward-delivery.mjs');
  let now = 0, rolls = 0;
  const store = new TransactionalMemory();
  const sessions = new Map([
    ['a', { accountId: 'alice', roomId: 'grove' }],
    ['a2', { accountId: 'alice', roomId: 'grove' }],
    ['b', { accountId: 'bob', roomId: 'grove' }],
    ['fake', { accountId: 'intruder', roomId: 'other-room' }]
  ]);
  const chars = new Map(
    ['alice', 'bob'].map(id => [id, {
      roomId: 'grove', level: 100, attackBonus: 16, defenseTotal: 0,
      weaponKind: 'sword', indoors: false
    }])
  );
  const config = {
    storage: store, roomId: 'grove', bossId: 'bear',
    spawnId: 'bear-life-1', type: 'cave', x: 200, y: 200,
    authenticateSession: key => sessions.get(key),
    getVerifiedCharacter: id => chars.get(id),
    getSpawn: id => ({ x: id === 'alice' ? 200 : 202, y: 204 }),
    isWalkable: () => true, clock: () => now,
    random: () => rolls++ % 2 ? .99 : 0
  };
  const build = overrides => new ServerBossRoom({ ...config, ...overrides });
  const room = build();
  assert.deepEqual(await room.attack({ damage: 9999, sessionKey: 'a' }),
    { ok: false, reason: 'unauthorized' });
  assert.equal((await room.snapshot('a')).reason, 'unauthorized');
  assert.equal((await room.join('fake')).reason, 'unauthorized');
  assert.equal((await room.join('a')).health.hp, 410);
  assert.equal((await room.join('b')).health.hp, 410);
  assert.equal((await room.join('a2')).health.hp, 410,
    'reconnecting cannot create a duplicate character');
  assert.equal((await room.snapshot('fake')).reason, 'unauthorized');
  assert.equal((await room.move('a', { x: 999, dx: 1, dy: 0 })).reason,
    'invalid-input');
  assert.equal((await room.snapshot('a')).me.hp, 410);

  assert.deepEqual(await room.tick(), []);
  now = 500;
  const warning = await room.tick();
  assert.equal(warning.length, 1);
  assert.equal(warning[0].kind, 'warning');
  assert.equal(warning[0].endsAt, 1200);

  // A real server-validated dodge moves Alice beyond the warning radius.
  now = 600;
  assert(Math.abs((await room.move('a', { dx: 1, dy: 0 })).x - 209) < 1e-8);
  now = 700;
  assert(Math.abs((await room.move('a2', { dx: 1, dy: 0 })).x - 218) < 1e-8);
  now = 1200;
  const strike = await room.tick();
  assert.equal(strike.length, 1);
  assert.equal(strike[0].kind, 'strike');
  assert.deepEqual(strike[0].hits.map(hit => hit.accountId), ['bob']);
  assert.equal(strike[0].hits[0].damage, 13,
    'server boss damage rolls obey existing Cave Bear maximum');
  assert.equal((await room.snapshot('a')).me.hp, 410);
  assert.equal((await room.snapshot('b')).me.hp, 397);
  assert.deepEqual(await room.tick(), [], 'a repeated tick cannot double-strike');
  assert.equal((await room.snapshot('b')).me.hp, 397);

  // Complete reload from shared transactional storage retains boss AI,
  // cooldown, HP and hit sequence. Nothing came from browser health fields.
  const restarted = build();
  assert.equal((await restarted.snapshot('b')).me.hp, 397);
  assert.equal((await restarted.snapshot('a')).behavior.mode, 'chase');
  assert.deepEqual(await restarted.tick(), [], 'restart cannot replay strike');
  now = 1300;
  assert(Math.abs((await restarted.move('a', { dx: -1, dy: 0 })).x - 209) < 1e-8);
  now = 1400;
  assert(Math.abs((await restarted.move('a', { dx: -1, dy: 0 })).x - 200) < 1e-8);

  const first = await room.attack('a');
  assert.equal(first.ok, true);
  assert.equal(first.damage, 43);
  assert.equal(first.hp, 107);
  assert.equal((await restarted.attack('a2')).reason, 'cooldown');
  const second = await restarted.attack('b');
  assert.equal(second.damage, 43);
  assert.equal(second.hp, 64);
  assert.equal((await room.snapshot('a')).boss.hp, 64);
  now = 2300;
  assert.equal((await room.attack('a')).damage, 43);
  assert.equal((await room.snapshot('a')).boss.hp, 21);

  // Fatal hit and BOTH player awards must commit together. Simulate a crash
  // before transaction commit and verify zero ghost deaths or payouts.
  store.failNextCommit = true;
  await assert.rejects(() => restarted.attack('b'), /simulated atomic/);
  assert.equal((await restarted.snapshot('a')).boss.hp, 21);
  assert.deepEqual(await room.pendingAwards(), []);
  const kill = await room.attack('b');
  assert.equal(kill.damage, 21);
  assert.equal(kill.boss.defeated, true);
  assert.equal((await restarted.snapshot('a')).behavior.mode, 'dead');
  assert.equal((await restarted.attack('a')).reason, 'defeated');
  assert.deepEqual(await restarted.tick(), [], 'a dead boss cannot attack');

  const awards = await room.pendingAwards();
  assert.equal(awards.length, 2);
  assert.equal(new Set(awards.map(p => p.key)).size, 2);
  assert.deepEqual(awards.map(p => p.reward.damage), [86, 64]);
  const total = awards.reduce((sum, p) => sum + p.reward.coins, 0);
  assert(total >= 30 && total <= 70,
    'players divide exactly one original boss coin budget');

  const accounts = new TransactionalMemory();
  const ledgers = new Map(
    ['alice','bob'].map(accountId => [accountId,
      new BossAccountRewardLedger({
        storage: accounts, accountId, random: () => 0
      })
    ])
  );
  const one = await deliverBossOutbox({
    room, getAccountLedger: id => ledgers.get(id)
  });
  assert.equal(one.length, 2);
  assert(one.every(x => x.status === 'delivered'));
  assert.deepEqual(await restarted.pendingAwards(), []);
  assert.deepEqual(await deliverBossOutbox({
    room, getAccountLedger: id => ledgers.get(id)
  }), []);
  assert.equal((await ledgers.get('alice').snapshot()).combatXp, 1050);
  assert.equal((await ledgers.get('bob').snapshot()).combatXp, 1050);
  assert.equal(
    (await ledgers.get('alice').snapshot()).coins +
    (await ledgers.get('bob').snapshot()).coins, total
  );

  // Reject persisted disagreement between boss physical location, death
  // state and AI position; a corrupt save must never create a payout.
  const raw = clone(store.data.get(room.stateKey));
  store.data.get(room.stateKey).behavior.x += 1;
  await assert.rejects(() => room.snapshot('a'), /disagree/);
  store.data.set(room.stateKey, raw);
  assert.equal((await room.snapshot('a')).boss.hp, 0);
  await assert.rejects(() => build({
    spawnId: 'fake-new-life'
  }).snapshot('a'), /Incompatible durable boss room state/);

  console.log('PASS: atomic shared boss room, authenticated positions, server HP/dodges, restart, one death and reward delivery, fatal-hit rollback, tamper rejection');
})().catch(error => { console.error(error); process.exitCode = 1; });
