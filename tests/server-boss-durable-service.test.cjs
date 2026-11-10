'use strict';
const assert = require('node:assert/strict');

const alice = '11111111-2222-4333-8444-555555555555';
const bob = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const fake = '99999999-2222-4333-8444-555555555555';
const clone = v => v === undefined ? undefined : structuredClone(v);
class FakeDurableStorage {
  constructor() { this.data = new Map(); this.tail = Promise.resolve(); this.failNext = false; }
  async transaction(fn) {
    let release;
    const completed = new Promise(resolve => { release = resolve; });
    const pending = this.tail;
    this.tail = completed;
    await pending;
    const pendingData = new Map([...this.data].map(([k,v]) => [k, clone(v)]));
    const tx = {
      get: async key => clone(pendingData.get(key)),
      put: async (key, value) => pendingData.set(key, clone(value)),
      list: async ({ prefix }) =>
        new Map([...pendingData].filter(([k]) => k.startsWith(prefix))
          .map(([k,v]) => [k,clone(v)]))
    };
    try {
      const result = await fn(tx);
      if (this.failNext) {
        this.failNext = false;
        throw Error('simulated durable write failure');
      }
      this.data = pendingData;
      return result;
    } finally { release(); }
  }
}

(async () => {
  const {
    ensureStarterCharacter, loadTrustedCharacters,
    PROFILE_PREFIX
  } = await import('../src/server-trusted-characters.mjs');
  const { DurableBossRoomService } =
    await import('../src/server-boss-durable-service.mjs');
  const { createBossCommandGateway } =
    await import('../src/server-boss-command-gateway.mjs');

  let now = 0, nonce = 0;
  const storage = new FakeDurableStorage();
  const config = {
    storage,
    roomId: 'preview-grove', bossId: 'cave-bear',
    spawnId: 'life-1', type: 'cave', x: 200, y: 200,
    isWalkable: (x, y) => x >= 108 && x <= 1492 &&
      y >= 108 && y <= 1492,
    getSpawn: accountId => ({
      x: accountId === alice ? 200 : 202,
      y: 204
    }),
    clock: () => now,
    random: () => 0,
    randomUUID: () => String(++nonce)
  };
  const build = () => new DurableBossRoomService(config);
  const verified = new Map([['Bearer alice',alice], ['Bearer bob',bob]]);
  const authenticator = {
    async verifyBearer(raw) {
      const accountId = verified.get(raw);
      return accountId ? { ok: true, accountId } :
        { ok: false, reason: 'unauthorized' };
    }
  };
  const gateway = controller =>
    createBossCommandGateway({
      authenticator,
      createTrustedRoom: (account, commandType) =>
        controller.forVerifiedAccount(account, commandType)
    });
  const api = gateway(build());
  const call = (account, command) => api({
    authorization: account === 'alice' ? 'Bearer alice' :
      account === 'bob' ? 'Bearer bob' : 'Bearer fake',
    command
  });

  assert.deepEqual(await call('fake',{ type: 'join' }),
    { ok: false, reason: 'unauthorized' });
  assert.equal(storage.data.size, 0, 'unauthorized requests never create records');
  assert.equal((await call('alice',{type:'snapshot'})).reason,
    'unauthorized', 'snapshot cannot auto-provision profile or room');
  assert.equal(storage.data.size, 0);

  const joined = await call('alice', { type:'join' });
  assert.equal(joined.ok, true);
  assert.equal(joined.health.maxHp, 12,
    'server provisions the fixed level-one starter, not a browser level');
  assert.equal(joined.accountId, alice);
  assert.equal((await call('bob',{type:'join'})).accountId, bob);
  assert.equal(await call('fake',{type:'join',level:100}), undefined,
    'unreachable invalid request should not be used in assertions');
})().catch(e => { console.error(e); process.exitCode = 1; });
