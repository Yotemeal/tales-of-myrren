// Private authority adapter for a single boss in one Durable Object room.
// Intentionally not imported by src/worker.js or any public browser bundle.
// Durable Object storage.transaction supplies all-or-nothing state+outbox writes.
// Client requests must NEVER supply encounter configuration or verified stats.
import { ServerBossEncounter } from './boss-encounter.mjs';

const keyPart = value => {
  if (typeof value !== 'string' || !value.length || value.length > 96 ||
      value.trim() !== value) throw new TypeError('Invalid stable room/boss identifier');
  return value;
};
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const LIMIT = 100;

export class BossRoomCoordinator {
  constructor({ storage, roomId, bossId, spawnId, type, x, y,
    resolveVerifiedPlayer, clock = Date.now, random = Math.random }) {
    if (!storage || typeof storage.transaction !== 'function')
      throw new TypeError('Durable Object transaction storage required');
    if (typeof resolveVerifiedPlayer !== 'function' ||
        typeof clock !== 'function' || typeof random !== 'function')
      throw new TypeError('Server-owned identity, clock and RNG required');
    this.storage = storage;
    this.config = {
      roomId: keyPart(roomId), bossId: keyPart(bossId),
      spawnId: keyPart(spawnId), type, x, y
    };
    this.resolveVerifiedPlayer = resolveVerifiedPlayer;
    this.clock = clock;
    this.random = random;
    this.stateKey = 'boss-state:v1:' +
      JSON.stringify([this.config.roomId, this.config.bossId]);
    this.awardPrefix = 'boss-award:v1:';
  }

  makeEncounter() {
    return new ServerBossEncounter({
      ...this.config,
      resolveVerifiedPlayer: this.resolveVerifiedPlayer,
      clock: this.clock, random: this.random
    });
  }

  // Durable storage is the source of truth; never cache a mutated encounter
  // across transactions. A failed commit can be safely retried.
  async load(tx) {
    const raw = await tx.get(this.stateKey);
    if (!raw) return this.makeEncounter();
    if (raw.roomId !== this.config.roomId ||
        raw.bossId !== this.config.bossId ||
        raw.spawnId !== this.config.spawnId ||
        raw.type !== this.config.type ||
        raw.x !== this.config.x || raw.y !== this.config.y)
      throw new Error('Persisted boss identity or location mismatches coordinator');
    return ServerBossEncounter.fromDurableState(raw, {
      resolveVerifiedPlayer: this.resolveVerifiedPlayer,
      clock: this.clock, random: this.random
    });
  }

  async snapshot() {
    return this.storage.transaction(async tx => {
      const boss = await this.load(tx);
      // Never reveal ledger, player session keys or reward details.
      return boss.state;
    });
  }

  async attack(sessionKey) {
    if (typeof sessionKey !== 'string' || sessionKey.length < 1 ||
        sessionKey.length > 256) return { ok: false, reason: 'unauthorized' };
    return this.storage.transaction(async tx => {
      const boss = await this.load(tx);
      const hit = boss.attack(sessionKey);
      if (!hit.ok) return { ...hit, boss: boss.state };
      // Queue all rewards in exactly the same transaction as the fatal hit.
      // This is an OUTBOX, not player balance mutation.
      if (hit.defeated) {
        for (const reward of boss.defeatEvent.rewards) {
          const key = this.awardPrefix + reward.key;
          const existing = await tx.get(key);
          if (existing != null) {
            if (!same(existing.reward, reward))
              throw new Error('Persisted boss award key collision');
            continue; // retry-safe
          }
          await tx.put(key, {
            schema: 1, status: 'pending', key: reward.key,
            reward: clone(reward), receipt: null
          });
        }
      }
      await tx.put(this.stateKey, boss.exportDurableState());
      return { ...hit, boss: boss.state };
    });
  }

  async resetAfterLeash() {
    return this.storage.transaction(async tx => {
      const boss = await this.load(tx);
      const reset = boss.resetAfterLeash();
      if (reset) await tx.put(this.stateKey, boss.exportDurableState());
      return reset;
    });
  }

  // Internal service only. A payment worker should fetch PENDING awards,
  // credit via a separate idempotent *account* transaction, then acknowledge.
  // If account credit succeeds but ack fails, credit MUST be replay-safe.
  async pendingAwards(limit = LIMIT) {
    if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT)
      throw new RangeError('Invalid pending award page size');
    return this.storage.transaction(async tx => {
      const records = await tx.list({ prefix: this.awardPrefix });
      if (!(records instanceof Map))
        throw new TypeError('Expected Durable Object KV list Map');
      return [...records.values()].filter(value => value?.status === 'pending')
        .slice(0, limit).map(value => clone(value));
    });
  }

  async acknowledgeAward(key, receipt) {
    if (typeof key !== 'string' || !key.startsWith('[') ||
        key.length > 1024 || typeof receipt !== 'string' ||
        !receipt.length || receipt.length > 256)
      throw new TypeError('Valid authority payout key and receipt required');
    return this.storage.transaction(async tx => {
      const recordKey = this.awardPrefix + key;
      const record = await tx.get(recordKey);
      if (!record || record.key !== key) return false;
      // Receipt conflicts never overwrite earlier settlement evidence.
      if (record.status === 'delivered') {
        if (record.receipt !== receipt)
          throw new Error('Award already acknowledged with a different receipt');
        return false;
      }
      if (record.status !== 'pending')
        throw new Error('Invalid award state');
      await tx.put(recordKey, {
        ...record, status: 'delivered', receipt
      });
      return true;
    });
  }
}
