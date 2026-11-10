'use strict';
// No sockets or client-supplied damage: verified player state, authority HP,
// cooldown, effective credit, group rewards and replay protection.
const assert = require('node:assert/strict');
const createGame = require('./game-runtime.cjs');

(async () => {
  const { ServerBossEncounter, BOSS_TYPES, allocateBossRewards } =
    await import('../src/boss-encounter.mjs');
  const { game } = await createGame();

  for (const type of ['cave', 'abear']) {
    const current = game.MT[type], server = BOSS_TYPES[type];
    assert.equal(server.hp, current.hp, type + ' health must track live balance');
    assert.equal(server.def, current.def, type + ' defence must track live balance');
    assert.equal(server.xpm, current.xpm, type + ' XP must track live balance');
    assert.deepEqual([...server.coins], current.coins, type + ' coin range drift');
    assert.equal(server.rareChance, current.drop.p, type + ' rare chance drift');
    assert.deepEqual([...server.rareMaterials], current.drop.mats, type + ' rare gear drift');
  }

  const ledger = [
    { id: 'tag', damage: 2 }, { id: 'support', damage: 30 },
    { id: 'leader', damage: 100 }, { id: 'leader', damage: 18 }
  ];
  const serverRewards = allocateBossRewards(BOSS_TYPES.cave, ledger, 51, () => .5);
  const originalRewards = game.resolveBossRewards(game.MT.cave, ledger, 51, () => .5);
  assert.deepEqual(serverRewards, originalRewards,
    'server payout must remain identical to the existing tested group resolver');
  assert.deepEqual(serverRewards.map(p => p.id), ['leader', 'support']);
  assert.equal(serverRewards.reduce((sum, p) => sum + p.coins, 0), 51);
  assert(Math.abs(serverRewards.reduce((sum, p) => sum + p.dropChance, 0) - .12) < 1e-12);
  assert.deepEqual(allocateBossRewards(BOSS_TYPES.cave,
    [{ id: 'solo', damage: 150 }], 36, () => 0),
    game.resolveBossRewards(game.MT.cave, [{ id: 'solo', damage: 150 }], 36, () => 0),
    'solo rare rolls and guaranteed coins remain unchanged');
  assert.deepEqual(allocateBossRewards(BOSS_TYPES.cave, [], 50), []);
  assert.deepEqual(allocateBossRewards(BOSS_TYPES.cave,
    [{ id: 'bad', damage: Infinity }, { id: 'ok', damage: 40 }], 32, () => 1 - Number.EPSILON)
      .map(p => p.id), ['ok']);

  // A server-owned directory resolves opaque sessions to verified accounts,
  // movement, equipment and combat stats. None are attack message parameters.
  let now = 1000, rngCalls = 0;
  const directory = new Map([
    ['s1', { accountId: 'leader', roomId: 'field-1', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['s1-alt', { accountId: 'leader', roomId: 'field-1', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['s2', { accountId: 'support', roomId: 'field-1', x: 100, y: 104,
      level: 100, attackBonus: 16, weaponKind: 'sword', alive: true }],
    ['other-room', { accountId: 'intruder', roomId: 'field-2', x: 100, y: 104,
      level: 100, attackBonus: 100, weaponKind: 'sword', alive: true }]
  ]);
  const build = spawnId => new ServerBossEncounter({
    roomId: 'field-1', bossId: 'cave-01', spawnId, type: 'cave',
    x: 100, y: 100, resolveVerifiedPlayer: s => directory.get(s),
    clock: () => now,
    random: () => (++rngCalls % 2 === 1 ? 0 : .999)
  });
  const boss = build('life-01');
  assert.equal(boss.state.hp, 150);
  assert.deepEqual(boss.attack('unrecognized'), { ok: false, reason: 'unauthorized' });
  assert.deepEqual(boss.attack('other-room'), { ok: false, reason: 'unauthorized' });
  directory.get('s1').x = 180;
  assert.deepEqual(boss.attack('s1'), { ok: false, reason: 'out-of-range' });
  directory.get('s1').x = 100;
  const first = boss.attack('s1');
  assert.equal(first.damage, 43);
  assert.equal(first.hp, 107);
  assert.deepEqual(boss.attack('s1-alt'), { ok: false, reason: 'cooldown' },
    'reconnecting on another session cannot bypass account cooldown');
  const second = boss.attack('s2');
  assert.equal(second.damage, 43);
  now += 900;
  assert.equal(boss.attack('s1').damage, 43);
  assert.equal(boss.attack('s2').damage, 21, 'overkill never inflates credit');
  assert.equal(boss.state.hp, 0);
  assert.equal(boss.state.defeated, true);
  assert.equal('ledger' in boss.state, false, 'private contribution ledger not in public state');

  const event = boss.defeatEvent;
  assert(event);
  assert.strictEqual(boss.defeatEvent, event);
  assert.equal(event.coinPool, 30);
  assert.equal(event.rewards.length, 2);
  assert.equal(event.rewards.reduce((sum, p) => sum + p.coins, 0), 30);
  assert.equal(event.rewards.reduce((sum, p) => sum + p.damage, 0), 150);
  assert.deepEqual(event.rewards.map(p => [p.accountId, p.damage]),
    [['leader', 86], ['support', 64]]);
  assert(event.rewards[0].coins > event.rewards[1].coins);
  assert(event.rewards[0].rareChance > event.rewards[1].rareChance);
  assert(event.rewards.every(p => p.combatXp === 1050));
  assert.equal(new Set(event.rewards.map(p => p.key)).size, 2);
  assert.deepEqual(JSON.parse(event.rewards[0].key),
    ['field-1', 'cave-01', 'life-01', 'leader']);
  assert.deepEqual(boss.attack('s1'), { ok: false, reason: 'defeated' });
  assert.equal(boss.resetAfterLeash(), false, 'dead spawn cannot be revived for duplicate loot');
  assert.strictEqual(boss.finishKill(), event, 'repeated death handling cannot reroll coins');
  assert.strictEqual(boss.defeatEvent, event);

  // Return/leash heals without preserving damage credit; no payout is created.
  rngCalls = 0; now = 20000;
  const leashed = build('life-02');
  assert.equal(leashed.attack('s1').damage, 43);
  assert.equal(leashed.state.hp, 107);
  assert.equal(leashed.resetAfterLeash(), true);
  assert.equal(leashed.state.hp, 150);
  assert.equal(leashed.defeatEvent, null);
  assert.equal(leashed.attack('s1').damage, 43,
    'fresh leash encounter starts a fresh cooldown and ledger');

  directory.get('s1').alive = false;
  now += 900;
  assert.deepEqual(leashed.attack('s1'), { ok: false, reason: 'unauthorized' });
  directory.get('s1').alive = true;
  directory.get('s1').level = 0;
  assert.deepEqual(leashed.attack('s1'), { ok: false, reason: 'unverified-combatant' });
  directory.get('s1').level = 100;

  // Each independently defeated spawn can grant the same rare drop again.
  // The service intentionally produces ONLY entitlements, never saves items.
  let tick = 0;
  const soloLife = spawnId => new ServerBossEncounter({
    roomId: 'field-1', bossId: 'cave-01', spawnId, type: 'cave',
    x: 100, y: 100, resolveVerifiedPlayer: s => directory.get(s),
    clock: () => tick, random: () => 0
  });
  function finishSolo(spawn) {
    const encounter = soloLife(spawn);
    for (let i = 0; i < 150; i++) {
      tick += 900;
      assert.equal(encounter.attack('s1').damage, 1);
    }
    assert.equal(encounter.state.hp, 0);
    const paid = encounter.defeatEvent.rewards;
    assert.equal(paid.length, 1);
    assert.equal(paid[0].coins, 30);
    assert.equal(paid[0].rare, true);
    assert.deepEqual(paid[0].rareMaterials, [4, 5]);
    return paid[0].key;
  }
  assert.notEqual(finishSolo('life-03'), finishSolo('life-04'),
    'two valid boss spawns never share an idempotency key');

  // Trusted Durable Object storage must round-trip the entire boss life,
  // including cooldowns, damage credit and the exact already-rolled rewards.
  const deadStored = JSON.parse(JSON.stringify(boss.exportDurableState()));
  const restoredDead = ServerBossEncounter.fromDurableState(deadStored, {
    resolveVerifiedPlayer: s => directory.get(s), clock: () => now,
    random: () => { throw new Error('Defeated boss must never reroll'); }
  });
  assert.deepEqual(restoredDead.defeatEvent, boss.defeatEvent);
  assert.deepEqual(restoredDead.attack('s1'), { ok: false, reason: 'defeated' });
  assert.strictEqual(restoredDead.finishKill(), restoredDead.defeatEvent);
  assert.deepEqual(restoredDead.exportDurableState(), deadStored);
  const alteredCredit = JSON.parse(JSON.stringify(deadStored));
  alteredCredit.ledger[0][1]++;
  assert.throws(() => ServerBossEncounter.fromDurableState(alteredCredit, {
    resolveVerifiedPlayer: s => directory.get(s)
  }), /credit disagree/);
  const alteredCoins = JSON.parse(JSON.stringify(deadStored));
  alteredCoins.rewardEvent.rewards[0].coins++;
  assert.throws(() => ServerBossEncounter.fromDurableState(alteredCoins, {
    resolveVerifiedPlayer: s => directory.get(s)
  }), /Stored reward/);

  const midStored = JSON.parse(JSON.stringify(leashed.exportDurableState()));
  const restoredMid = ServerBossEncounter.fromDurableState(midStored, {
    resolveVerifiedPlayer: s => directory.get(s),
    clock: () => now, random: () => (++rngCalls % 2 === 1 ? 0 : .999)
  });
  assert.equal(restoredMid.state.hp, leashed.state.hp);
  now = 20000;
  assert.deepEqual(restoredMid.attack('s1'), { ok: false, reason: 'cooldown' },
    'restored account cooldown prevents rapid reconnect/restart attacks');
  now = 20900;
  assert.equal(restoredMid.attack('s1').damage, 43);
  assert.equal(restoredMid.state.hp, 64);
  assert.deepEqual(restoredMid.exportDurableState().ledger, [['leader', 86]],
    'verified damage credit continues from the durable snapshot');

  const missing = () => new ServerBossEncounter({
    roomId: 'x', bossId: 'b', spawnId: 'life', type: 'non-boss',
    x: 0, y: 0, resolveVerifiedPlayer: () => null
  });
  assert.throws(missing, /Unknown boss/);
  assert.throws(() => new ServerBossEncounter({
    roomId: 'x', bossId: 'b', spawnId: 'life', type: 'cave',
    x: NaN, y: 0, resolveVerifiedPlayer: () => null
  }), /position/);
  console.log('PASS: server-owned boss HP, reach/cooldown, verified identity, damage credit, payout parity, replay prevention, leash reset and duplicate-eligible spawns');
})().catch(err => { console.error(err); process.exitCode = 1; });
