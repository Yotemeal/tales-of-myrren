const assert = require('node:assert/strict');

// A serial transaction fixture shared by separate service instances.
// Clone at the transaction boundary to model a durable snapshot.
function arenaStorage() {
  let committed = new Map();
  let tail = Promise.resolve();
  let failNextCommit = false;

  return {
    failNextCommit() { failNextCommit = true; },
    transaction(operation) {
      const pending = tail.then(async () => {
        const draft = structuredClone(committed);
        const result = await operation({
          async get(key) { return structuredClone(draft.get(key)); },
          async put(key, value) { draft.set(key, structuredClone(value)); }
        });
        if (failNextCommit) {
          failNextCommit = false;
          throw Error('storage unavailable');
        }
        committed = draft;
        return result;
      });
      tail = pending.catch(() => {});
      return pending;
    }
  };
}

(async () => {
  const { createJewelheartService } = await import('../src/jewelheart-service.mjs');
  const { createJewelheartRewardPolicy } = await import('../src/jewelheart-rewards.mjs');
  const storage = arenaStorage();
  let rolls = 0;
  const rollRewards = createJewelheartRewardPolicy({
    coinsPerContributor: 25,
    rares: [{ itemId: 'fixture_ring', contributorChance: 100, topChance: 500 }],
    rollBasisPoints() { rolls++; return 200; }
  });
  let generation = 0;
  const makeService = () => createJewelheartService({
    storage, maxHp: 450, rollRewards, newEncounterId: () => 'arena/' + ++generation
  });
  const lead = makeService();
  const ally = makeService();
  const hit = (playerId, sequence, damage, encounterId = 'arena/1') =>
    ({ playerId, sequence, damage, encounterId });

  const [initial, joined] = await Promise.all([lead.open(), ally.open()]);
  assert.deepEqual(joined, initial);
  assert.equal(generation, 1);

  const [first, second] = await Promise.all([
    lead.strike(hit('lead', 1, 100)),
    ally.strike(hit('ally', 1, 150))
  ]);
  assert.equal(first.state.hp, 350);
  assert.equal(second.state.hp, 200);

  storage.failNextCommit();
  const finalHit = hit('lead', 2, 250);
  await assert.rejects(lead.strike(finalHit), /storage unavailable/);
  const reconnected = makeService();
  assert.equal((await reconnected.open()).hp, 200);
  assert.equal(await reconnected.rewards(initial.id), null);
  const finishes = await Promise.all([
    reconnected.strike(finalHit),
    ally.strike(hit('ally', 2, 250)),
    lead.strike(finalHit)
  ]);
  assert.equal(finishes.filter(result => result.defeated).length, 1);
  assert.equal(finishes.reduce((sum, result) => sum + result.appliedDamage, 0), 200);
  assert.equal((await lead.open()).hp, 0);
  const payout = {
    encounterId: initial.id,
    awards: [
      { playerId: 'lead', coins: 25, items: ['fixture_ring'], topContributor: true },
      { playerId: 'ally', coins: 25, items: [], topContributor: false }
    ]
  };
  assert.deepEqual(await ally.rewards(initial.id), payout);
  assert.equal(rolls, 4, 'only the failed transaction and the committed defeat draw rolls');

  const resets = await Promise.all([lead.reset(initial.id), ally.reset(initial.id)]);
  assert.equal(resets.filter(result => result.reset).length, 1);
  assert.equal(generation, 2);
  const fresh = await reconnected.open();
  assert.equal(fresh.id, 'arena/2');
  assert.equal(fresh.hp, 450);
  assert.deepEqual(fresh.contributions, []);
  assert.equal((await lead.strike(finalHit)).appliedDamage, 0);
  assert.equal((await ally.open()).hp, 450);
  assert.deepEqual(await reconnected.rewards(initial.id), payout);
  assert.equal(await lead.rewards(fresh.id), null);

  const { createJewelheartClaimHandler } = await import('../src/jewelheart-claims.mjs');
  const packs = new Map([['lead', arenaStorage()], ['ally', arenaStorage()]]);
  const leadPack = packs.get('lead');
  const allyPack = packs.get('ally');
  const savePack = (pack, value) => pack.transaction(tx => tx.put('inventory', value));
  const readPack = pack => pack.transaction(tx => tx.get('inventory'));
  const full = { inv: { coins: 10, bread: 2 }, bag: ['steel_sword'], xp: { melee: 100 } };
  await savePack(leadPack, full);
  await savePack(allyPack, { inv: { coins: 5 }, bag: ['bronze_sword'] });
  const claim = createJewelheartClaimHandler({
    encounterService: reconnected,
    storageForPlayer: playerId => packs.get(playerId),
    canFit: (inventory, extra) => inventory.bag.length + extra <= 1
  });

  assert.deepEqual(await claim(initial.id, 'spectator'), { status: 'unavailable' });
  assert.deepEqual(await claim(initial.id, 'lead'), { status: 'pack-full' });
  assert.deepEqual(await readPack(leadPack), full);
  assert.equal((await claim(initial.id, 'ally')).status, 'claimed', 'coins fit in a full pack');
  assert.equal((await readPack(allyPack)).inv.coins, 30);

  await savePack(leadPack, { ...full, bag: [], inv: { ...full.inv, coins: Number.MAX_SAFE_INTEGER } });
  assert.deepEqual(await claim(initial.id, 'lead'), { status: 'coin-limit' });
  await savePack(leadPack, { ...full, bag: [] });
  leadPack.failNextCommit();
  await assert.rejects(claim(initial.id, 'lead'), /storage unavailable/);
  assert.deepEqual(await readPack(leadPack), { ...full, bag: [] });

  const claims = await Promise.all([claim(initial.id, 'lead'), claim(initial.id, 'lead')]);
  assert.deepEqual(claims.map(result => result.status).sort(), ['already-claimed', 'claimed']);
  assert.deepEqual(claims[0].receipt, claims[1].receipt);
  assert.deepEqual(await readPack(leadPack), {
    ...full, inv: { ...full.inv, coins: 35 }, bag: ['fixture_ring']
  });
  assert.equal((await claim(initial.id, 'lead')).status, 'already-claimed');

  console.log('PASS: shared arena persistence, concurrent strikes and resets, reconnect, failed-write rollback, full-pack retries and exactly-once claims.');
})().catch(error => { console.error(error); process.exitCode = 1; });
