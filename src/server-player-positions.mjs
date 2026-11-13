// Server-owned player coordinates for future shared combat rooms.
// This is an isolated authority component, NOT a public endpoint or a live
// movement replacement. Caller supplies trusted session, character, spawn
// and collision resolvers; browser presence is never authoritative.
const isId = value => typeof value === 'string' && value.length > 0 &&
  value.length <= 96 && value.trim() === value;
const finite = Number.isFinite;
const reject = reason => ({ ok: false, reason });
const MAX_PLAYERS = 64;
const MAX_STEP_MS = 100;
const MAX_SPEED = 90;

export class ServerPlayerPositions {
  constructor({
    roomId, authenticateSession, getCharacter, getSpawn, isWalkable,
    clock = Date.now, bounds = { minX: 108, minY: 108, maxX: 1492, maxY: 1492 },
    speed = MAX_SPEED
  }) {
    if (!isId(roomId)) throw new TypeError('Invalid room ID');
    if ([authenticateSession, getCharacter, getSpawn, isWalkable, clock]
      .some(callback => typeof callback !== 'function'))
      throw new TypeError('Trusted movement callbacks required');
    if (!finite(speed) || speed <= 0 || speed > MAX_SPEED)
      throw new RangeError('Invalid movement speed');
    if (!bounds || ![bounds.minX, bounds.maxX, bounds.minY, bounds.maxY].every(finite) ||
        bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY)
      throw new RangeError('Invalid world bounds');
    this.roomId = roomId;
    this.authenticateSession = authenticateSession;
    this.getCharacter = getCharacter;
    this.getSpawn = getSpawn;
    this.isWalkable = isWalkable;
    this.clock = clock;
    this.bounds = { ...bounds };
    this.speed = speed;
    this.players = new Map();
  }

  now() {
    const value = this.clock();
    if (!finite(value) || value < 0) throw new RangeError('Invalid server clock');
    return value;
  }

  inWorld(x, y) {
    const b = this.bounds;
    return finite(x) && finite(y) && x >= b.minX && x <= b.maxX &&
      y >= b.minY && y <= b.maxY && this.isWalkable(x, y) === true;
  }

  identity(sessionKey) {
    if (typeof sessionKey !== 'string' || !sessionKey ||
        sessionKey.length > 256) return null;
    const verified = this.authenticateSession(sessionKey);
    if (!verified || !isId(verified.accountId) ||
        verified.roomId !== this.roomId) return null;
    return verified.accountId;
  }

  // Only the trusted server picks spawn coordinates. Reconnecting cannot
  // reset location or cause movement since the last packet to accumulate.
  join(sessionKey) {
    const accountId = this.identity(sessionKey);
    if (!accountId) return reject('unauthorized');
    let record = this.players.get(accountId);
    const now = this.now();
    if (record) {
      record.lastAt = now;
      return { ok: true, accountId, x: record.x, y: record.y };
    }
    if (this.players.size >= MAX_PLAYERS) return reject('room-full');
    const origin = this.getSpawn(accountId);
    if (!origin || !this.inWorld(origin.x, origin.y))
      return reject('invalid-server-spawn');
    record = { accountId, x: origin.x, y: origin.y, lastAt: now };
    this.players.set(accountId, record);
    return { ok: true, accountId, x: record.x, y: record.y };
  }

  // A move packet contains *only* desired direction, no x/y/timestamp/speed.
  // Travel distance is based exclusively on elapsed SERVER time, capped to
  // 100ms per packet to stop idle catch-up teleports and burst movement.
  move(sessionKey, intent) {
    const accountId = this.identity(sessionKey);
    if (!accountId) return reject('unauthorized');
    const player = this.players.get(accountId);
    if (!player) return reject('not-joined');
    const character = this.getCharacter(accountId);
    if (!character || character.alive !== true || character.indoors === true)
      return reject('cannot-move');
    if (!intent || typeof intent !== 'object' ||
        Array.isArray(intent) ||
        Object.keys(intent).some(key => key !== 'dx' && key !== 'dy') ||
        !finite(intent.dx) || !finite(intent.dy) ||
        Math.abs(intent.dx) > 1 || Math.abs(intent.dy) > 1)
      return reject('invalid-input');
    const now = this.now();
    if (now < player.lastAt) return reject('clock-regressed');
    const dt = Math.min(now - player.lastAt, MAX_STEP_MS) / 1000;
    player.lastAt = now;
    const length = Math.hypot(intent.dx, intent.dy);
    if (!length || !dt)
      return { ok: true, x: player.x, y: player.y, moved: 0 };
    const distance = Math.min(1, length) * this.speed * dt;
    const mx = intent.dx / length * distance;
    const my = intent.dy / length * distance;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(mx), Math.abs(my)) / 3));
    const ox = player.x, oy = player.y;
    // Small axis-separated steps prevent skipping across thin colliders and
    // permit wall sliding. isWalkable MUST test the full player footprint.
    for (let i = 0; i < steps; i++) {
      const nx = player.x + mx / steps;
      if (this.inWorld(nx, player.y)) player.x = nx;
      const ny = player.y + my / steps;
      if (this.inWorld(player.x, ny)) player.y = ny;
    }
    return {
      ok: true, x: player.x, y: player.y,
      moved: Math.hypot(player.x - ox, player.y - oy)
    };
  }

  // Plugs directly into ServerBossEncounter.resolveVerifiedPlayer. All
  // attributes come from the authoritative character store, not presence.
  resolveVerifiedPlayer(sessionKey) {
    const accountId = this.identity(sessionKey);
    const position = accountId && this.players.get(accountId);
    if (!position) return null;
    const character = this.getCharacter(accountId);
    if (!character || !Number.isInteger(character.level) ||
        character.level < 1 || character.level > 100 ||
        !Number.isInteger(character.attackBonus) ||
        character.attackBonus < 0 || character.attackBonus > 200 ||
        typeof character.alive !== 'boolean' ||
        (character.weaponKind !== 'sword' &&
          character.weaponKind !== 'fist' &&
          character.weaponKind !== null))
      return null;
    return {
      accountId, roomId: this.roomId,
      x: position.x, y: position.y,
      level: character.level, attackBonus: character.attackBonus,
      weaponKind: character.weaponKind,
      alive: character.alive, indoors: character.indoors === true
    };
  }

  // Persist only trusted coordinates and server timestamps. Authentication
  // and equipment must be revalidated from the live account store on use.
  exportDurableState() {
    return {
      schema: 1, roomId: this.roomId,
      players: [...this.players.values()].map(player => ({ ...player }))
    };
  }

  static fromDurableState(state, options) {
    const registry = new ServerPlayerPositions(options);
    if (!state || state.schema !== 1 || state.roomId !== registry.roomId ||
        !Array.isArray(state.players) || state.players.length > MAX_PLAYERS)
      throw new TypeError('Invalid movement snapshot');
    for (const player of state.players) {
      if (!isId(player?.accountId) || registry.players.has(player.accountId) ||
          !registry.inWorld(player.x, player.y) ||
          !finite(player.lastAt) || player.lastAt < 0)
        throw new TypeError('Invalid persisted player position');
      registry.players.set(player.accountId, {
        accountId: player.accountId,
        x: player.x, y: player.y, lastAt: player.lastAt
      });
    }
    return registry;
  }
}
