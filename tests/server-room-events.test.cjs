'use strict';
const assert = require('node:assert/strict');

(async () => {
  const { ServerRoomEventFeed } = await import('../src/server-room-events.mjs');
  const feed = new ServerRoomEventFeed('grove');
  assert.deepEqual(feed.readFor('alice'), {
    ok: true, afterSequence: 0, latestSequence: 0,
    nextSequence: 0, resyncRequired: false, events: []
  });
  assert.equal(feed.record({
    kind: 'warning', x: 200, y: 200, radius: 16, endsAt: 1200
  }), 1);
  assert.equal(feed.record({
    kind: 'strike', key: 'life-1:1', x: 200, y: 200, radius: 16,
    hits: [
      { accountId: 'alice', hit: true, damage: 12,
        hp: 98, maxHp: 110, defeated: false },
      { accountId: 'bob', hit: false, damage: 0,
        hp: 200, maxHp: 200, defeated: false }
    ]
  }), 2);
  assert.equal(feed.record({ kind: 'leash-reset', key: 'life-1:reset-1' }), 3);
  assert.equal(feed.record({ kind: 'boss-defeated', key: 'life-1:death' }), 4);
  const alice = feed.readFor('alice');
  assert.deepEqual(alice.events.map(e => e.kind),
    ['warning', 'strike', 'leash-reset', 'boss-defeated']);
  assert.equal(alice.events[1].me.damage, 12);
  assert.equal(alice.events[1].me.hp, 98);
  assert(!JSON.stringify(alice).includes('"bob"'),
    'recipient B account ID must never leak to A');
  assert(!JSON.stringify(alice).includes('"hp":200'),
    'recipient B health must never leak to A');
  assert(!JSON.stringify(alice).includes('life-1'),
    'private combat keys must never leak');
  assert(!JSON.stringify(alice).includes('coins'),
    'award outbox is not part of public event feed');
  const bob = feed.readFor('bob');
  assert.equal(bob.events[1].me.damage, 0);
  assert.equal(bob.events[1].me.hp, 200);
  const spectator = feed.readFor('carol', 1);
  assert.deepEqual(spectator.events.map(x => x.seq), [2, 3, 4]);
  assert.equal(spectator.events[0].me, null,
    'non-hit players receive no one else health data');

  const saved = structuredClone(feed.exportDurableState());
  const recovered = ServerRoomEventFeed.fromDurableState(saved, 'grove');
  assert.deepEqual(recovered.exportDurableState(), saved);
  assert.deepEqual(recovered.readFor('alice', 2).events.map(e => e.seq),
    [3, 4], 'reconnect after event 2 replays only missing events');
  assert.deepEqual(recovered.readFor('alice', 4).events, [],
    'newest cursor does not replay already seen events');
  assert.throws(() => recovered.readFor('alice', 5), /cursor/,
    'future cursor must be rejected, not silently lose updates');
  assert.throws(() => recovered.readFor('alice', -1), /cursor/);
  assert.throws(() => recovered.readFor('', 0), /cursor/);
  assert.throws(() => recovered.record({
    kind: 'strike', key: 'fake', x: 1, y: 1, radius: 18,
    hits: [
      { accountId: 'bob', hit: true, damage: 1,
        hp: 1, maxHp: 2, defeated: false },
      { accountId: 'bob', hit: true, damage: 1,
        hp: 1, maxHp: 2, defeated: false }
    ]
  }), /recipient/, 'no duplicate strike targets');

  const poisoned = structuredClone(saved);
  poisoned.entries[1].seq = poisoned.entries[0].seq;
  assert.throws(() => ServerRoomEventFeed.fromDurableState(poisoned, 'grove'),
    /Noncontiguous/);
  const wrong = structuredClone(saved);
  wrong.roomId = 'other-room';
  assert.throws(() => ServerRoomEventFeed.fromDurableState(wrong, 'grove'),
    /durable event/);

  // Many broadcasts cannot increase storage indefinitely. A missed cursor
  // is explicitly flagged for a fresh authoritative snapshot/resync.
  const stress = new ServerRoomEventFeed('grove');
  for (let i = 0; i < 150; i++)
    stress.record({ kind: 'warning', x: 1, y: 1, radius: 16,
      endsAt: 1000 + i });
  assert.equal(stress.sequence, 150);
  assert.equal(stress.entries.length, 96);
  const old = stress.readFor('alice', 0);
  assert.equal(old.resyncRequired, true);
  assert.equal(old.events.length, 40, 'bounded notification page');
  assert.equal(old.nextSequence, 94);
  const next = stress.readFor('alice', old.nextSequence);
  assert.equal(next.resyncRequired, false);
  assert.equal(next.events.length, 40);
  const final = stress.readFor('alice', next.nextSequence);
  assert.equal(final.events.length, 16);
  assert.equal(final.nextSequence, 150);
  assert.deepEqual(final.events.map(e => e.seq), Array.from({ length: 16 },
    (_, i) => 135 + i));
  const longSaved = stress.exportDurableState();
  assert.deepEqual(ServerRoomEventFeed.fromDurableState(
    longSaved, 'grove').exportDurableState(), longSaved);

  console.log('PASS: room event feed privacy, reliable reconnect, bounded pages, resync warnings, strict restoration and receipt-free public output');
})().catch(error => { console.error(error); process.exitCode = 1; });
