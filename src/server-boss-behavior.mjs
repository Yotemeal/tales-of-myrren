// SERVER-ONLY NPC behaviour prototype. No public endpoint and no client input.
// The trusted room tick MUST persist this state and strike outbox atomically.
// Strike EVENTS are not health mutations; a future server-owned player health
// ledger must consume them once using the stable event key.
const goodId = v => typeof v === 'string' && v.length > 0 &&
  v.length <= 96 && v.trim() === v;
const finite = Number.isFinite;
const MAX_TICK_MS = 100;
const MAX_PLAYERS = 64;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const reject = text => { throw new TypeError(text); };
export const BOSS_AI_PROFILES = Object.freeze({
  cave: Object.freeze({
    speed: 32, aggro: 50, attackIntervalMs: 2400,
    warningMs: 700, radius: 16, leash: 170, dropTarget: 130,
    touch: 11
  }),
  abear: Object.freeze({
    speed: 34, aggro: 56, attackIntervalMs: 2200,
    warningMs: 850, radius: 18, leash: 170, dropTarget: 130,
    touch: 11
  })
});

export class ServerBossBehavior {
  constructor({ roomId, bossId, spawnId, type, homeX, homeY,
    getVerifiedPlayers, isWalkable, clock = Date.now }) {
    if (![roomId, bossId, spawnId].every(goodId) ||
        !BOSS_AI_PROFILES[type]) reject('Invalid private boss identity');
    if (![getVerifiedPlayers, isWalkable, clock].every(f => typeof f === 'function'))
      reject('Trusted server callbacks required');
    if (![homeX, homeY].every(finite))
      reject('Invalid boss home coordinates');
    if (isWalkable(homeX, homeY) !== true)
      reject('Boss must spawn on server-walkable terrain');
    Object.assign(this, { roomId, bossId, spawnId, type, homeX, homeY,
      getVerifiedPlayers, isWalkable, clock });
    this.profile = BOSS_AI_PROFILES[type];
    this.x = homeX;
    this.y = homeY;
    this.mode = 'idle';
    this.targetId = null;
    this.lastAt = null;
    this.nextStrikeAt = null;
    this.warning = null;
    this.sequence = 0;
    this.resetSequence = 0;
    this.dead = false;
  }

  playerList() {
    const players = this.getVerifiedPlayers();
    if (!Array.isArray(players) || players.length > MAX_PLAYERS)
      reject('Invalid trusted room player list');
    const result = new Map();
    for (const p of players) {
      if (!p || !goodId(p.accountId) || p.roomId !== this.roomId ||
          !finite(p.x) || !finite(p.y) || typeof p.alive !== 'boolean')
        reject('Invalid server player snapshot');
      if (result.has(p.accountId)) reject('Duplicate authoritative account');
      if (p.alive && p.indoors !== true)
        result.set(p.accountId, { id: p.accountId, x: p.x, y: p.y });
    }
    return result;
  }

  moveTowards(x, y, distance) {
    const length = dist(this.x, this.y, x, y);
    if (length === 0 || distance <= 0) return;
    const rate = Math.min(distance, length) / length;
    const mx = (x - this.x) * rate, my = (y - this.y) * rate;
    const steps = Math.max(1,
      Math.ceil(Math.max(Math.abs(mx), Math.abs(my)) / 3));
    for (let i = 0; i < steps; i++) {
      const nx = this.x + mx / steps;
      if (this.isWalkable(nx, this.y) === true) this.x = nx;
      const ny = this.y + my / steps;
      if (this.isWalkable(this.x, ny) === true) this.y = ny;
    }
  }

  beginReturn() {
    this.mode = 'return';
    this.targetId = null;
    this.warning = null;
    this.nextStrikeAt = null;
  }

  defeat() {
    if (this.dead) return false;
    this.dead = true;
    this.mode = 'dead';
    this.targetId = null;
    this.warning = null;
    this.nextStrikeAt = null;
    return true;
  }

  // The tick has NO client-supplied timestamps, positions or damage. A
  // future room owner should call it at a controlled 20-30Hz cadence.
  tick() {
    const now = this.clock();
    if (!finite(now) || now < 0)
      throw new RangeError('Invalid server tick clock');
    if (this.lastAt != null && now < this.lastAt)
      throw new RangeError('Server clock moved backwards');
    const dt = this.lastAt == null ? 0 :
      Math.min(MAX_TICK_MS, now - this.lastAt) / 1000;
    this.lastAt = now;
    if (this.dead) return [];

    const people = this.playerList();
    const events = [];
    if (this.mode === 'idle') {
      const options = [...people.values()].filter(p =>
        dist(this.x, this.y, p.x, p.y) < this.profile.aggro)
        .sort((a, b) =>
          dist(this.x, this.y, a.x, a.y) -
            dist(this.x, this.y, b.x, b.y) ||
          a.id.localeCompare(b.id));
      if (options.length) {
        this.mode = 'chase';
        this.targetId = options[0].id;
        this.nextStrikeAt = null;
      }
    }
    if (this.mode === 'chase') {
      const target = people.get(this.targetId);
      if (!target ||
          dist(this.x, this.y, this.homeX, this.homeY) > this.profile.leash ||
          dist(this.x, this.y, target.x, target.y) > this.profile.dropTarget) {
        this.beginReturn();
      } else if (this.warning) {
        if (now >= this.warning.endsAt) {
          const center = this.warning;
          const targets = [...people.values()]
            .filter(p => dist(center.x, center.y, p.x, p.y) <= center.radius)
            .map(p => p.id).sort();
          this.sequence++;
          events.push({
            kind: 'strike',
            key: JSON.stringify([
              this.roomId, this.bossId, this.spawnId, 'strike', this.sequence
            ]),
            sequence: this.sequence, type: this.type,
            x: center.x, y: center.y,
            radius: center.radius, targets
          });
          this.warning = null;
          this.nextStrikeAt = now + this.profile.attackIntervalMs;
        }
      } else if (dist(this.x, this.y, target.x, target.y) > this.profile.touch) {
        this.moveTowards(target.x, target.y, this.profile.speed * dt);
        // Preserve the last attack cooldown while pursuing a dodging target.
        // A duplicate tick at the same server time must not erase it.
      } else {
        if (this.nextStrikeAt == null)
          this.nextStrikeAt = now +
            Math.max(this.profile.warningMs, Math.floor(this.profile.attackIntervalMs / 2));
        if (now >= this.nextStrikeAt - this.profile.warningMs) {
          this.warning = {
            x: this.x, y: this.y,
            radius: this.profile.radius,
            targetId: target.id,
            startsAt: now, endsAt: now + this.profile.warningMs
          };
          events.push({
            kind: 'warning', type: this.type,
            x: this.warning.x, y: this.warning.y,
            radius: this.warning.radius,
            endsAt: this.warning.endsAt
          });
        }
      }
    }
    if (this.mode === 'return') {
      const distance = dist(this.x, this.y, this.homeX, this.homeY);
      if (distance < 3) {
        this.x = this.homeX;
        this.y = this.homeY;
        this.mode = 'idle';
        this.resetSequence++;
        events.push({ kind: 'leash-reset',
          key: JSON.stringify([this.roomId, this.bossId, this.spawnId, 'leash', this.resetSequence]) });
      } else {
        this.moveTowards(this.homeX, this.homeY, this.profile.speed * dt);
      }
    }
    return events;
  }

  get state() {
    return Object.freeze({
      roomId: this.roomId, bossId: this.bossId, spawnId: this.spawnId,
      type: this.type, homeX: this.homeX, homeY: this.homeY,
      x: this.x, y: this.y,
      mode: this.mode, targetId: this.targetId,
      lastAt: this.lastAt, nextStrikeAt: this.nextStrikeAt,
      warning: this.warning ? { ...this.warning } : null,
      sequence: this.sequence, resetSequence: this.resetSequence, dead: this.dead
    });
  }

  static restore(state, options) {
    const ai = new ServerBossBehavior(options);
    if (!state || state.schema !== 1 ||
        state.roomId !== ai.roomId || state.bossId !== ai.bossId ||
        state.spawnId !== ai.spawnId || state.type !== ai.type ||
        state.homeX !== ai.homeX || state.homeY !== ai.homeY ||
        !finite(state.x) || !finite(state.y) ||
        ai.isWalkable(state.x, state.y) !== true ||
        !['idle', 'chase', 'return', 'dead'].includes(state.mode) ||
        (state.targetId !== null && !goodId(state.targetId)) ||
        (state.lastAt !== null && (!finite(state.lastAt) || state.lastAt < 0)) ||
        (state.nextStrikeAt !== null &&
          (!finite(state.nextStrikeAt) || state.nextStrikeAt < 0)) ||
        !Number.isSafeInteger(state.sequence) || state.sequence < 0 ||
        !Number.isSafeInteger(state.resetSequence) || state.resetSequence < 0 ||
        typeof state.dead !== 'boolean' ||
        (state.dead !== (state.mode === 'dead')))
      reject('Invalid private boss behaviour snapshot');
    if (state.mode === 'chase' && !goodId(state.targetId))
      reject('Chasing boss must have a target');
    if (state.mode !== 'chase' && (state.targetId !== null ||
        state.nextStrikeAt !== null || state.warning !== null))
      reject('Inactive boss cannot retain attack target or warning');
    if (state.warning !== null) {
      const w = state.warning;
      if (state.mode !== 'chase' || !w ||
          ![w.x, w.y, w.startsAt, w.endsAt, w.radius].every(finite) ||
          !goodId(w.targetId) || w.targetId !== state.targetId ||
          w.endsAt <= w.startsAt ||
          w.endsAt - w.startsAt !== ai.profile.warningMs ||
          w.radius !== ai.profile.radius ||
          state.lastAt === null ||
          w.startsAt > state.lastAt ||
          state.lastAt > w.endsAt)
        reject('Invalid persisted boss attack warning');
    }
    ai.x = state.x; ai.y = state.y; ai.mode = state.mode;
    ai.targetId = state.targetId; ai.lastAt = state.lastAt;
    ai.nextStrikeAt = state.nextStrikeAt;
    ai.warning = state.warning ? { ...state.warning } : null;
    ai.sequence = state.sequence;
    ai.resetSequence = state.resetSequence;
    ai.dead = state.dead;
    return ai;
  }

  exportDurableState() {
    return { schema: 1, ...this.state };
  }
}
