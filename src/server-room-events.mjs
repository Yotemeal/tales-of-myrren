// Private durable combat notification feed for authenticated room members.
// The room owner invokes record() only AFTER authoritative simulation results.
// This is not a websocket handler or a substitute for server-owned combat.
const validId = v => typeof v === 'string' && v.length > 0 &&
  v.length <= 96 && v.trim() === v;
const integer = Number.isSafeInteger;
const finite = Number.isFinite;
const MAX_ENTRIES = 96;
const MAX_PAGE = 40;
const clone = value => JSON.parse(JSON.stringify(value));

const checkEvent = event => {
  if (!event || typeof event !== 'object' || Array.isArray(event) ||
      !['warning', 'strike', 'leash-reset', 'boss-defeated'].includes(event.kind))
    throw new TypeError('Invalid private room event');
  if (event.kind === 'warning' || event.kind === 'strike') {
    if (![event.x, event.y, event.radius].every(finite) ||
        event.radius < 1 || event.radius > 80)
      throw new TypeError('Invalid event hit-zone geometry');
    if (event.kind === 'warning' &&
        (!finite(event.endsAt) || event.endsAt < 0))
      throw new TypeError('Invalid room warning deadline');
    if (event.kind === 'strike') {
      if (!Array.isArray(event.hits) || event.hits.length > 64)
        throw new TypeError('Invalid trusted strike outcomes');
      const seen = new Set();
      for (const hit of event.hits) {
        if (!hit || !validId(hit.accountId) || seen.has(hit.accountId) ||
            typeof hit.hit !== 'boolean' ||
            !integer(hit.damage) || hit.damage < 0 ||
            !integer(hit.hp) || hit.hp < 0 ||
            !integer(hit.maxHp) || hit.maxHp < hit.hp ||
            typeof hit.defeated !== 'boolean' ||
            hit.defeated !== (hit.hp === 0))
          throw new TypeError('Invalid server strike recipient');
        seen.add(hit.accountId);
      }
    }
  }
  if (event.kind !== 'warning' &&
      (typeof event.key !== 'string' || event.key.length < 1 ||
      event.key.length > 1024))
    throw new TypeError('Missing trusted event key');
  return event;
};

export class ServerRoomEventFeed {
  constructor(roomId) {
    if (!validId(roomId))
      throw new TypeError('Invalid event room identity');
    this.roomId = roomId;
    this.sequence = 0;
    this.entries = [];
  }

  // Append only events produced by the room's trusted AI / boss combat
  // inside the room storage.transaction, before committing the room state.
  record(event) {
    checkEvent(event);
    if (!integer(this.sequence + 1))
      throw new RangeError('Room event sequence exhausted');
    const seq = ++this.sequence;
    const entry = { seq, ...clone(event) };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES)
      this.entries.shift();
    return seq;
  }

  readFor(accountId, afterSequence = 0) {
    if (!validId(accountId) || !integer(afterSequence) ||
        afterSequence < 0 || afterSequence > this.sequence)
      throw new RangeError('Invalid authenticated event cursor');
    const first = this.entries[0]?.seq ?? this.sequence + 1;
    const missed = afterSequence < first - 1;
    const page = this.entries.filter(e => e.seq > afterSequence)
      .slice(0, MAX_PAGE);
    const events = page.map(event => {
      const visible = { seq: event.seq, kind: event.kind };
      if (event.kind === 'warning')
        Object.assign(visible, {
          x: event.x, y: event.y, radius: event.radius,
          endsAt: event.endsAt
        });
      if (event.kind === 'strike') {
        const mine = event.hits.find(hit => hit.accountId === accountId);
        Object.assign(visible, {
          x: event.x, y: event.y, radius: event.radius,
          me: mine ? {
            hit: mine.hit, damage: mine.damage,
            hp: mine.hp, maxHp: mine.maxHp,
            defeated: mine.defeated
          } : null
        });
      }
      return visible;
    });
    return {
      ok: true,
      afterSequence, latestSequence: this.sequence,
      nextSequence: events.at(-1)?.seq ?? afterSequence,
      resyncRequired: missed,
      events
    };
  }

  exportDurableState() {
    return {
      schema: 1, roomId: this.roomId,
      sequence: this.sequence, entries: clone(this.entries)
    };
  }

  static fromDurableState(raw, roomId) {
    const feed = new ServerRoomEventFeed(roomId);
    if (!raw || raw.schema !== 1 || raw.roomId !== roomId ||
        !integer(raw.sequence) || raw.sequence < 0 ||
        !Array.isArray(raw.entries) || raw.entries.length > MAX_ENTRIES ||
        (raw.sequence === 0) !== (raw.entries.length === 0))
      throw new TypeError('Invalid durable event feed');
    let previous = raw.sequence - raw.entries.length;
    for (const entry of raw.entries) {
      if (!entry || !integer(entry.seq) || entry.seq !== previous + 1 ||
          entry.seq > raw.sequence)
        throw new TypeError('Noncontiguous persisted event sequence');
      checkEvent(entry);
      previous = entry.seq;
      feed.entries.push(clone(entry));
    }
    if (previous !== raw.sequence)
      throw new TypeError('Incomplete persisted event feed');
    feed.sequence = raw.sequence;
    return feed;
  }
}
