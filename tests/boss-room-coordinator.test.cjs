'use strict';
const assert = require('node:assert/strict');
const clone = v => v === undefined ? undefined : structuredClone(v);

// Concurrent test model of DO storage.transaction(): serial read-modify-write,
// atomic commit and simulated crash before a commit.
class FakeDurableStorage {
  constructor() { this.data = new Map(); this.queue = Promise.resolve(); this.failNextCommit = false; }
  async transaction(callback) {
    let unlock;
    const mine = new Promise(resolve => { unlock = resolve; });
    const previous = this.queue;
    this.queue = mine;
    await previous;
    const draft = new Map([...this.data].map(([key, value]) => [key, clone(value)]));
    const txn = {
      get: async key => clone(draft.get(key)),
      put: async (key, value) => { draft.set(key, clone(value)); },
      list: async ({ prefix }) => new Map(
        [...draft].filter(([key]) => key.startsWith(prefix))
          .map(([key, value]) => [key, clone(value)])
      )
    };
    try {
      const answer = await callback(txn);
      if (this.failNextCommit) {
        this.failNextCommit = false;
        throw new Error('Simulated durable commit failure');
      }
      this.data = draft;
      return answer;
    } finally { unlock(); }
  }
}

(async () => {
  const { BossRoomCoordinator } = await import('../src/boss-room-coordinator.mjs');
  const store = new FakeDurableStorage();
  let now = 1000;
  const directory = new Map([
    ['s1', { accountId: 'leader', roomId: 'r1', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['s1-reconnect', { accountId: 'leader', roomId: 'r1', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['s2', { accountId: 'support', roomId: 'r1', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['stranger', { accountId: 'stranger', roomId: 'r2', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }]
  ]);
  const config = { roomId: 'r1', bossId: 'cave-1', spawnId: 'spawn-1',
    type: 'cave', x: 100, y: 100,
    resolveVerifiedPlayer: sessionKey => directory.get(sessionKey),
    clock: () => now, random: () => .9
  };
  const build = overrides => new BossRoomCoordinator({
    storage: store, ...config, ...overrides
  });
  const room = build();

  assert.deepEqual(await room.snapshot(), {
    roomId: 'r1', bossId: 'cave-1', spawnId: 'spawn-1',
    type: 'cave', x: 100, y: 100, hp: 150, maxHp: 150, defeated: false
  });
  assert.deepEqual(await room.attack('stranger'), {
    ok: false, reason: 'unauthorized', boss: await room.snapshot()
  });
  assert.deepEqual(await room.attack({ damage: 9999, sessionKey: 's1' }),
    { ok: false, reason: 'unauthorized' });
  assert.equal(store.data.size, 0, 'unauthorized actions cannot create a boss');
  assert.deepEqual(await room.pendingAwards(), []);
  directory.get('s1').x = 300;
  assert.equal((await room.attack('s1')).reason, 'out-of-range');
  directory.get('s1').x = 100;

  // In-flight attacks are serialized. Two sessions from the SAME account
  // cannot bypass the account cooldown or double-credit by racing requests.
  const [a, b] = await Promise.all([
    room.attack('s1'), room.attack('s1-reconnect')
  ]);
  assert.equal(a.damage, 39);
  assert.equal(b.reason, 'cooldown');
  assert.equal((await room.snapshot()).hp, 111);
  assert.equal(store.data.size, 1);

  const s2first = await room.attack('s2');
  assert.equal(s2first.damage, 39);
  assert.equal((await room.snapshot()).hp, 72);

  // Mid-encounter restart loads identical HP and cooldown from storage.
  const afterRestart = build();
  assert.equal((await afterRestart.snapshot()).hp, 72);
  assert.equal((await afterRestart.attack('s1')).reason, 'cooldown');
  now += 900;
  assert.equal((await afterRestart.attack('s1')).damage, 39);
  assert.equal((await room.snapshot()).hp, 33);

  // A server/storage error on fatal hit must roll back BOTH death and outbox;
  // retry can produce the same one death, never a ghost payout.
  store.failNextCommit = true;
  await assert.rejects(() => afterRestart.attack('s2'), /Simulated durable/);
  assert.equal((await room.snapshot()).hp, 33);
  assert.deepEqual(await room.pendingAwards(), []);

  const death = await room.attack('s2');
  assert.equal(death.damage, 33, 'effective damage excludes overkill');
  assert.equal(death.hp, 0);
  assert.equal(death.boss.defeated, true);
  assert.deepEqual(await room.attack('s1'), {
    ok: false, reason: 'defeated', boss: death.boss
  });
  assert.equal((await room.snapshot()).hp, 0);

  const awards = await room.pendingAwards();
  assert.equal(awards.length, 2);
  assert.deepEqual(awards.map(a => [a.reward.accountId, a.reward.damage]),
    [['leader', 78], ['support', 72]]);
  assert.equal(awards.reduce((sum, a) => sum + a.reward.coins, 0), 66);
  assert(awards[0].reward.coins > awards[1].reward.coins);
  assert.equal(new Set(awards.map(a => a.key)).size, 2);
  assert(awards.every(a => a.status === 'pending' && a.receipt === null));
  assert(awards.every(a => a.reward.combatXp === 1050));
  assert.equal((await build().pendingAwards()).length, 2,
    'undelivered rewards survive another server restart');

  // A payment service must persist an account reward receipt itself before
  // calling acknowledgeAward. An ack does not mint currency or alter saves.
  const firstKey = awards[0].key;
  store.failNextCommit = true;
  await assert.rejects(() => room.acknowledgeAward(firstKey, 'account-receipt-1'),
    /Simulated durable/);
  assert.equal((await room.pendingAwards()).length, 2);
  assert.equal(await room.acknowledgeAward(firstKey, 'account-receipt-1'), true);
  assert.equal(await room.acknowledgeAward(firstKey, 'account-receipt-1'), false,
    'same receipt is idempotent');
  await assert.rejects(() => room.acknowledgeAward(firstKey, 'different-receipt'),
    /different receipt/, 'conflicting receipts cannot erase settlement history');
  assert.equal(await room.acknowledgeAward('["unrecognized"]', 'receipt-2'), false);
  assert.deepEqual((await room.pendingAwards()).map(p => p.reward.accountId), ['support']);
  assert.equal((await build().pendingAwards()).length, 1);
  assert.deepEqual(await room.pendingAwards(1), await room.pendingAwards());
  await assert.rejects(() => room.pendingAwards(101), /page size/);

  // A new spawn cannot silently replace an existing life or its pending loot.
  const wrongSpawn = build({ spawnId: 'spawn-2' });
  await assert.rejects(() => wrongSpawn.attack('s1'), /mismatches coordinator/);
  assert.equal((await room.snapshot()).spawnId, 'spawn-1');
  assert.equal(await room.resetAfterLeash(), false,
    'a defeated spawn is terminal even after reconnect');

  // Fresh storage can initialize a new independent spawn.
  const anotherStorage = new FakeDurableStorage();
  const another = build({ storage: anotherStorage, spawnId: 'spawn-2' });
  assert.equal((await another.attack('s1')).damage, 39);
  assert.equal((await another.snapshot()).hp, 111);
  assert.equal(await another.resetAfterLeash(), true);
  assert.equal((await another.snapshot()).hp, 150);
  assert.deepEqual(await another.pendingAwards(), []);

  console.log('PASS: durable room serial attacks, restart, cooldown, verified identity, atomic fatal-hit outbox, retry, receipts, and spawn safety');
})().catch(err => { console.error(err); process.exitCode = 1; });
