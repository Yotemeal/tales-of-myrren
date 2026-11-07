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
  const storage = arenaStorage();
  let generation = 0;
  const makeService = () => createJewelheartService({
    storage, maxHp: 450, newEncounterId: () => 'arena/' + ++generation
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
  const finishes = await Promise.all([
    reconnected.strike(finalHit),
    ally.strike(hit('ally', 2, 250)),
    lead.strike(finalHit)
  ]);
  assert.equal(finishes.filter(result => result.defeated).length, 1);
  assert.equal(finishes.reduce((sum, result) => sum + result.appliedDamage, 0), 200);
  assert.equal((await lead.open()).hp, 0);

  const resets = await Promise.all([lead.reset(initial.id), ally.reset(initial.id)]);
  assert.equal(resets.filter(result => result.reset).length, 1);
  assert.equal(generation, 2);
  const fresh = await reconnected.open();
  assert.equal(fresh.id, 'arena/2');
  assert.equal(fresh.hp, 450);
  assert.deepEqual(fresh.contributions, []);
  assert.equal((await lead.strike(finalHit)).appliedDamage, 0);
  assert.equal((await ally.open()).hp, 450);

  console.log('PASS: shared arena persistence, concurrent strikes and resets, reconnect, failed-write rollback and retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
