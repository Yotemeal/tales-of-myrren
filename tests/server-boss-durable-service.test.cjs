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
  assert.deepEqual(await call('alice',{type:'join',level:100}), {
    ok: false, reason: 'invalid-command'
  }, 'browser saves never author character levels');
  assert.deepEqual(await call('alice',{
    type:'attack', damage:100000, attackBonus:100
  }), {ok:false,reason:'invalid-command'});
  assert.deepEqual(await call('alice',{type:'move',x:500,y:500}),
    {ok:false,reason:'invalid-command'});
  assert.deepEqual(await call('bob',{type:'tick'}),
    {ok:false,reason:'invalid-command'},
    'client cannot advance a room clock or monster attacks');

  assert.equal(storage.data.get(PROFILE_PREFIX+alice).level, 1);
  assert.equal(storage.data.get(PROFILE_PREFIX+bob).level, 1);
  assert.equal(storage.data.get(PROFILE_PREFIX+alice).weaponKind,'fist');
  assert.equal(storage.data.has(PROFILE_PREFIX+fake),false);
  assert.equal((await loadTrustedCharacters({
    list: async opts => new Map([...storage.data].filter(([key]) =>
      key.startsWith(opts.prefix)))
  },'preview-grove')).size,2);

  assert.equal((await call('alice',{type:'snapshot'})).me.hp,12);
  assert.equal((await call('bob',{type:'snapshot'})).me.hp,12);
  now=100;
  const moved=await call('alice',{type:'move',dx:1,dy:0});
  assert.equal(moved.ok,true);
  assert(Math.abs(moved.x-209)<1e-7,
    'movement uses actual elapsed server time, not requested coordinates');
  assert.equal((await call('bob',{type:'snapshot'})).me.hp,12);
  assert.equal((await call('alice',{type:'snapshot'})).behavior.mode,'idle');

  // Reinitialize service/room repeatedly: committed DO records must survive.
  const restarted=build();
  const api2=gateway(restarted);
  assert.equal((await api2({
    authorization:'Bearer alice',command:{type:'snapshot'}
  })).ok,true);
  assert.equal((await api2({
    authorization:'Bearer bob',command:{type:'snapshot'}
  })).boss.hp,150);

  // The trusted timer may advance AI, but no HTTP command may call tick.
  await restarted.tick();
  now=600;
  const warning=await restarted.tick();
  assert.equal(warning.length,1);
  assert.equal(warning[0].kind,'warning');
  const observed=await api2({
    authorization:'Bearer alice',
    command:{type:'updates',afterSequence:0}
  });
  assert.deepEqual(observed.events.map(e=>e.kind),['warning']);
  now=700;
  assert.equal((await call('alice',{type:'move',dx:1,dy:0})).ok,true);
  assert((await call('alice',{type:'snapshot'})).me.hp===12,
    'Alice dodges from the server-owned warning origin');

  // Simulate a failed DB commit after the AI would resolve a strike. The
  // user must not receive phantom damage or replayable server notifications.
  now=1300;
  const oldHealth=(await call('bob',{type:'snapshot'})).me.hp;
  storage.failNext=true;
  await assert.rejects(()=>restarted.tick(),/simulated durable write failure/);
  assert.equal((await call('bob',{type:'snapshot'})).me.hp,oldHealth);
  assert.equal((await call('bob',{type:'updates',afterSequence:0})).latestSequence,1);
  await restarted.tick();
  const strikeFeed=await api2({
    authorization:'Bearer bob',
    command:{type:'updates',afterSequence:1}
  });
  assert.equal(strikeFeed.events.length,1);
  assert.equal(strikeFeed.events[0].kind,'strike');
  assert.equal(strikeFeed.events[0].me?.damage>0,true);
  assert.equal((await call('alice',{type:'updates',afterSequence:1})).events[0].me,
    null,'do not leak another player's HP');
  const after=(await api2({
    authorization:'Bearer bob',command:{type:'snapshot'}
  })).me.hp;
  assert(after<oldHealth,'one valid persisted strike applies');
  await restarted.tick();
  assert.equal((await call('bob',{type:'snapshot'})).me.hp,after,
    'a repeated server tick must not double-damage');
  assert.deepEqual((await api2({
    authorization:'Bearer bob',command:{type:'updates',afterSequence:2}
  })).events,[]);

  // Another ordinary identity may never use a session minted for Alice.
  const privateA=await restarted.forVerifiedAccount(alice,'snapshot');
  const privateB=await restarted.forVerifiedAccount(bob,'snapshot');
  assert.notEqual(privateA.sessionKey,privateB.sessionKey);
  assert.equal((await privateA.room.snapshot(privateB.sessionKey)).reason,
    'unauthorized');

  // Transaction-bound roster validation must fail closed if an internal
  // storage record is corrupted. No partial HP or rewards may be written.
  const key=PROFILE_PREFIX+alice, original=clone(storage.data.get(key));
  storage.data.set(key,{...original,level:9000});
  assert.deepEqual(await api2({
    authorization:'Bearer bob',command:{type:'snapshot'}
  }),{ok:false,reason:'unavailable'});
  storage.data.set(key,original);
  assert.equal((await call('alice',{type:'snapshot'})).ok,true);

  // Client-supplied saves with endgame items, XP and health cannot become
  // trusted multiplayer stats; only server-owned starter records are read.
  const maliciousCloudSave={
    name:'Admin',xp:{melee:900000000},eq:{weapon:'aether_sword'},hp:99999
  };
  assert.deepEqual(await api2({
    authorization:'Bearer alice',
    command:{type:'join',save_data:maliciousCloudSave}
  }),{ok:false,reason:'invalid-command'});
  assert.equal(storage.data.get(key).level,1);
  assert.equal((await call('alice',{type:'join'})).health.maxHp,12,
    'reconnecting must never trust or refill health from a cloud save');
  assert.equal((await call('alice',{type:'snapshot'})).me.hp,12,
    'unhit Alice stays at her legitimate server-owned HP');

  // Aborted starter provisioning must leave no ghost profile or participant.
  const other=new FakeDurableStorage();
  const pending=build();
  pending.storage=other;
  other.failNext=true;
  await assert.rejects(async()=>{
    const ctx=await pending.forVerifiedAccount(alice,'join');
    await ctx.room.join(ctx.sessionKey);
  },/simulated durable write failure/);
  assert.equal(other.data.size,0,
    'provision + join write must commit atomically');

  assert.throws(()=>build().roomFor('bogus'),/verified account UUID/);
  console.log('PASS: real DO transaction-shaped storage, two verified users, server-only starter stats, anti-spoof, persistent HP/positions/events, crash rollback and rejoin');
})().catch(e => { console.error(e); process.exitCode = 1; });
