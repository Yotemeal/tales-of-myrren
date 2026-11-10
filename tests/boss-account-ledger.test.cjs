'use strict';
const assert = require('node:assert/strict');
const createGame = require('./game-runtime.cjs');
const copy = value => value === undefined ? undefined : structuredClone(value);
class Storage {
  constructor() { this.items = new Map(); this.tail = Promise.resolve(); this.fail = false; }
  async transaction(callback) {
    let release;
    const lock = new Promise(done => { release = done; });
    const previous = this.tail; this.tail = lock;
    await previous;
    const work = new Map([...this.items].map(([k, v]) => [k, copy(v)]));
    try {
      const result = await callback({
        get: async k => copy(work.get(k)),
        put: async (k, v) => { work.set(k, copy(v)); },
        list: async ({ prefix }) => new Map([...work].filter(([k]) =>
          k.startsWith(prefix)).map(([k, v]) => [k, copy(v)]))
      });
      if (this.fail) { this.fail = false; throw Error('injected account commit error'); }
      this.items = work;
      return result;
    } finally { release(); }
  }
}
(async () => {
  const { BossAccountRewardLedger, BOSS_RARE_ITEM_POOLS } =
    await import('../src/boss-account-ledger.mjs');
  const { ServerBossEncounter } = await import('../src/boss-encounter.mjs');
  const { BossRoomCoordinator } = await import('../src/boss-room-coordinator.mjs');
  const { game: g } = await createGame();

  for (const [material, info] of Object.entries(BOSS_RARE_ITEM_POOLS)) {
    for (const kind of info.kinds) {
      const id = info.prefix + '_' + kind;
      assert(g.DEFS[id], 'every server roll must be a real live item: ' + id);
      assert.equal(g.DEFS[id].mat, Number(material));
    }
    const liveIds = Object.values(g.DEFS)
      .filter(d => d.mat === Number(material) &&
        ['sword','axe','pick','net','rod','ring','amulet',
          'helm','body','gloves','legs','boots','shield'].includes(d.kind))
      .map(d => d.id).sort();
    const serverIds = info.kinds.map(k => info.prefix + '_' + k).sort();
    assert.deepEqual(serverIds, liveIds,
      'server and live game must use the same boss-eligible item pools');
  }

  const roomStore = new Storage();
  let now = 1000;
  const people = new Map([
    ['p1', { accountId: 'leader', roomId: 'area',
      x: 10, y: 14, level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['p2', { accountId: 'support', roomId: 'area',
      x: 10, y: 14, level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }]
  ]);
  const room = new BossRoomCoordinator({
    storage: roomStore, roomId: 'area', bossId: 'bear',
    spawnId: 'life-1', type: 'cave', x: 10, y: 10,
    resolveVerifiedPlayer: session => people.get(session),
    clock: () => now, random: () => .9
  });
  await room.attack('p1'); await room.attack('p2');
  now += 900;
  await room.attack('p1'); await room.attack('p2');
  const outbox = await room.pendingAwards();
  assert.equal(outbox.length, 2);

  // Simulated independent authenticated account store. Two concurrent delivery
  // attempts for the same reward key must credit exactly once.
  const accountStore = new Storage();
  const leader = new BossAccountRewardLedger({
    storage: accountStore, accountId: 'leader', random: () => 0
  });
  const support = new BossAccountRewardLedger({
    storage: accountStore, accountId: 'support', random: () => 0
  });
  const a = outbox.find(p => p.reward.accountId === 'leader');
  const b = outbox.find(p => p.reward.accountId === 'support');
  await assert.rejects(() => support.settleTrustedAward(a), /wrong-account/);

  accountStore.fail = true;
  await assert.rejects(() => leader.settleTrustedAward(a), /injected account/);
  assert.deepEqual(await leader.snapshot(), {
    schema: 1, accountId: 'leader', coins: 0, combatXp: 0, gear: [], overflow: []
  });
  const [one, duplicate] = await Promise.all([
    leader.settleTrustedAward(a), leader.settleTrustedAward(a)
  ]);
  assert.equal(one.applied, true);
  assert.equal(duplicate.applied, false);
  assert.equal(one.receipt, duplicate.receipt);
  assert.equal(one.itemId, null);
  assert.equal((await leader.snapshot()).combatXp, 1050);
  assert.equal((await leader.snapshot()).coins, a.reward.coins);

  const other = await support.settleTrustedAward(b);
  assert(other.applied);
  const sum = (await leader.snapshot()).coins + (await support.snapshot()).coins;
  assert.equal(sum, 66, 'both accounts together get exactly ONE boss coin pool');
  assert.equal((await support.snapshot()).combatXp, 1050);

  const mutated = copy(a);
  mutated.reward.coins++;
  await assert.rejects(() => leader.settleTrustedAward(mutated),
    /Conflicting duplicate/, 'an altered retry cannot mint extra coins');
  assert.equal(await room.acknowledgeAward(a.key, one.receipt), true);
  assert.equal(await room.acknowledgeAward(b.key, other.receipt), true);
  assert.deepEqual(await room.pendingAwards(), []);

  // Genuine independent rare drops are not de-duplicated; identical valid
  // item IDs from different spawn IDs must both survive in account storage.
  const solo = (spawnId) => {
    let time = 0;
    const boss = new ServerBossEncounter({
      roomId: 'area', bossId: 'bear', spawnId, type: 'cave', x: 10, y: 10,
      resolveVerifiedPlayer: () => ({
        accountId: 'rare-looter', roomId: 'area', x: 10, y: 14,
        level: 1, attackBonus: 0, weaponKind: null, alive: true
      }),
      clock: () => time, random: () => 0
    });
    for (let i = 0; i < 150; i++) {
      time += 900;
      assert.equal(boss.attack('verified').damage, 1);
    }
    const reward = boss.defeatEvent.rewards[0];
    assert.equal(reward.rare, true);
    return { schema: 1, status: 'pending', key: reward.key,
      type: 'cave', roomId: 'area', bossId: 'bear', spawnId,
      reward, receipt: null };
  };
  const rareStore = new Storage();
  const rareLedger = new BossAccountRewardLedger({
    storage: rareStore, accountId: 'rare-looter', random: () => 0
  });
  const rareA = solo('rare-1'), rareB = solo('rare-2');
  const rareOne = await rareLedger.settleTrustedAward(rareA);
  const rareTwo = await rareLedger.settleTrustedAward(rareB);
  assert.equal(rareOne.itemId, 'steel_sword');
  assert.equal(rareTwo.itemId, 'steel_sword');
  assert.deepEqual((await rareLedger.snapshot()).gear,
    ['steel_sword', 'steel_sword']);
  assert.equal((await rareLedger.snapshot()).coins, 60);
  assert.equal((await rareLedger.snapshot()).combatXp, 2100);

  // Full backpack redirects rare gear to a bounded, persistent overflow queue.
  const fullStore = new Storage();
  const full = new BossAccountRewardLedger({
    storage: fullStore, accountId: 'rare-looter', random: () => 0
  });
  fullStore.items.set(full.accountKey, {
    schema: 1, accountId: 'rare-looter',
    coins: 0, combatXp: 0,
    gear: Array(36).fill('bronze_helm'), overflow: []
  });
  assert.equal((await full.settleTrustedAward(rareA)).itemId, 'steel_sword');
  assert.equal((await full.snapshot()).gear.length, 36);
  assert.deepEqual((await full.snapshot()).overflow, ['steel_sword']);
  const overflowFull = new Storage();
  const stuck = new BossAccountRewardLedger({
    storage: overflowFull, accountId: 'rare-looter', random: () => 0
  });
  overflowFull.items.set(stuck.accountKey, {
    schema: 1, accountId: 'rare-looter',
    coins: 0, combatXp: 0,
    gear: Array(36).fill('bronze_helm'),
    overflow: Array(128).fill('bronze_helm')
  });
  assert.deepEqual(await stuck.settleTrustedAward(rareA), {
    applied: false, reason: 'claim-storage-full'
  });
  assert.equal((await stuck.snapshot()).coins, 0);
  assert.equal((await stuck.snapshot()).combatXp, 0);
  assert.equal(overflowFull.items.size, 1, 'full claim store must not create receipt');

  console.log('PASS: account award idempotency, failure rollback, coin conservation, XP, duplicate rare gear, full-pack storage, real item IDs and acknowledgement receipts');
})().catch(e => { console.error(e); process.exitCode = 1; });
