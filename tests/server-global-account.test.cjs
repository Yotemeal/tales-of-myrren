'use strict';
const assert = require('node:assert/strict');
class AtomicStore {
  constructor() {
    this.data = new Map();
    this.tail = Promise.resolve();
    this.failNextCommit = false;
  }
  async transaction(work) {
    let release;
    const next = new Promise(done => { release = done; });
    const prior = this.tail; this.tail = next;
    await prior;
    const clone = v => structuredClone(v);
    const items = new Map([...this.data].map(([k,v]) => [k,clone(v)]));
    const tx = {
      get: async key => clone(items.get(key)),
      put: async (key,value) => { items.set(key,clone(value)); },
      list: async ({prefix}) =>
        new Map([...items].filter(([key]) => key.startsWith(prefix)))
    };
    try {
      const result = await work(tx);
      if (this.failNextCommit) {
        this.failNextCommit = false;
        throw Error('simulated account commit failure');
      }
      this.data = items;
      return result;
    } finally { release(); }
  }
}

(async () => {
  const { ServerGlobalAccountService } =
    await import('../src/server-global-account.mjs');
  const { deliverBossOutbox } =
    await import('../src/boss-reward-delivery.mjs');
  const alice = '11111111-2222-4333-8444-555555555555';
  const bob = '66666666-7777-4888-8999-aaaaaaaaaaaa';
  const storage = new Map([[alice,new AtomicStore()],[bob,new AtomicStore()]]);
  const open = id => new ServerGlobalAccountService({
    storage: storage.get(id), accountId: id, random: () => 0
  });
  assert.throws(() => open('fake'),/owned UUID/);
  assert.deepEqual(await open(alice).readTrustedBalance(), {
    accountId: alice, coins: 0, combatXp: 0, gear: [], overflow: []
  });

  // Fixture shape exactly matches the room's committed award outbox.
  const make = (id,roomId,bossId,spawnId,coins,rare) => {
    const key = JSON.stringify([roomId,bossId,spawnId,id]);
    return {
      schema:1,status:'pending',roomId,bossId,spawnId,
      type:'cave', key, receipt:null,
      reward:{
        key,accountId:id, coins, combatXp:1050,
        damage:150,damageShare:1,rareChance:.12,
        rare,rareMaterials:rare?[4,5]:[]
      }
    };
  };
  const first = make(alice,'forest','cave','life-1',40,true);
  const second = make(alice,'valley','cave','life-2',45,true);
  const forBob = make(bob,'forest','cave','life-1',30,false);
  assert.equal((await open(alice).settleRoomAward(first)).applied,true);
  assert.deepEqual((await open(alice).readTrustedBalance()).gear,
    ['steel_sword']);
  const reopened = open(alice); // simulates account DO restart
  const duplicate = await reopened.settleRoomAward(first);
  assert.equal(duplicate.applied,false);
  assert.equal(duplicate.itemId,'steel_sword');
  assert.equal((await reopened.readTrustedBalance()).coins,40);

  // Two separate rooms pay into one UUID-owned account, not room-local bags.
  assert.equal((await reopened.settleRoomAward(second)).applied,true);
  assert.deepEqual((await open(alice).readTrustedBalance()),{
    accountId:alice,coins:85,combatXp:2100,
    gear:['steel_sword','steel_sword'],overflow:[]
  });
  assert.equal((await open(bob).settleRoomAward(forBob)).applied,true);
  assert.deepEqual((await open(bob).readTrustedBalance()),{
    accountId:bob,coins:30,combatXp:1050,gear:[],overflow:[]
  });
  await assert.rejects(() => open(bob).settleRoomAward(first),
    /different account/);
  const altered = structuredClone(first);
  altered.reward.coins = 70;
  await assert.rejects(() => open(alice).settleRoomAward(altered),
    /Conflicting duplicate/);
  assert.equal((await open(alice).readTrustedBalance()).coins,85);

  // Two concurrent retries of exactly one newly committed room award:
  // only one inventory item and only one XP/coin credit survives.
  const concurrent = make(alice,'highlands','cave','life-3',50,true);
  const results = await Promise.all([
    open(alice).settleRoomAward(concurrent),
    open(alice).settleRoomAward(concurrent)
  ]);
  assert.equal(results.filter(r => r.applied).length,1);
  assert.equal(results[0].receipt,results[1].receipt);
  assert.equal((await open(alice).readTrustedBalance()).coins,135);
  assert.equal((await open(alice).readTrustedBalance()).gear.length,3);

  // Failure DURING the account write must save neither a receipt nor coins.
  const failed = make(bob,'cavern','cave','life-4',35,false);
  storage.get(bob).failNextCommit = true;
  await assert.rejects(() => open(bob).settleRoomAward(failed),
    /simulated account commit/);
  assert.equal((await open(bob).readTrustedBalance()).coins,30);
  assert.equal((await open(bob).settleRoomAward(failed)).applied,true);
  assert.equal((await open(bob).readTrustedBalance()).coins,65);

  // Failure AFTER account commit but BEFORE room acknowledgement must be
  // harmless. Room retries the same award and sees the persisted receipt.
  const crashAward = make(bob,'crater','cave','life-5',60,false);
  const roomOutbox = new Map([[crashAward.key,structuredClone(crashAward)]]);
  let failAck = true;
  const room = {
    async pendingAwards() {
      return [...roomOutbox.values()].filter(x => x.status==='pending');
    },
    async acknowledgeAward(key,receipt) {
      if (failAck) { failAck=false; throw Error('simulated room ack crash'); }
      const existing = roomOutbox.get(key);
      if (existing.status === 'delivered') {
        assert.equal(existing.receipt,receipt);
        return false;
      }
      roomOutbox.set(key,{...existing,status:'delivered',receipt});
      return true;
    }
  };
  const accounts = async id => ({
    settleTrustedAward: pending => open(id).settleRoomAward(pending)
  });
  const attempt1 = await deliverBossOutbox({
    room,getAccountLedger:accounts
  });
  assert.equal(attempt1[0].status,'failed');
  assert.equal((await open(bob).readTrustedBalance()).coins,125,
    'first payout applied before simulated room acknowledgement crash');
  assert.equal(roomOutbox.get(crashAward.key).status,'pending');
  const attempt2 = await deliverBossOutbox({
    room,getAccountLedger:accounts
  });
  assert.equal(attempt2[0].status,'delivered');
  assert.equal(attempt2[0].applied,false);
  assert.equal(roomOutbox.get(crashAward.key).status,'delivered');
  assert.equal((await open(bob).readTrustedBalance()).coins,125,
    'retry must not mint a second payout');
  assert.deepEqual(await deliverBossOutbox({
    room,getAccountLedger:accounts
  }),[]);

  // Not a public browser command; an untrusted client cannot choose
  // account identifiers or supply a fictitious boss award.
  const invalid = structuredClone(crashAward);
  invalid.reward.accountId = alice;
  await assert.rejects(() => open(bob).settleRoomAward(invalid),
    /different account/);
  assert.equal((await open(bob).readTrustedBalance()).combatXp,3150);

  console.log('PASS: global per-UUID account economy, separate room payouts, duplicate rare gear, restart, concurrent exactly-once credit, commit/ack crashes and account isolation');
})().catch(err => { console.error(err); process.exitCode = 1; });
