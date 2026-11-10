// SERVER-ONLY prototype: one atomic boss room with trusted movement, enemy AI,
// player HP and shared boss HP. No public Worker route or production binding.
// A single durable transaction owns all changes and fatal-hit reward outbox.
// Never accept browser-supplied account IDs, stats, positions or damage.
import { ServerBossEncounter, BOSS_TYPES } from './boss-encounter.mjs';
import { ServerBossBehavior } from './server-boss-behavior.mjs';
import { ServerPlayerPositions } from './server-player-positions.mjs';
import { ServerPlayerHealth } from './server-player-health.mjs';
import { ServerRoomEventFeed } from './server-room-events.mjs';

const validId = id => typeof id === 'string' && id.length > 0 &&
  id.length <= 96 && id.trim() === id;
const copy = value => JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rejected = reason => ({ ok: false, reason });

export class ServerBossRoom {
  constructor({ storage, roomId, bossId, spawnId, type,
    x, y, authenticateSession, getVerifiedCharacter, getSpawn,
    isWalkable, clock = Date.now, random = Math.random,
    bounds }) {
    if (!storage || typeof storage.transaction !== 'function' ||
        ![roomId, bossId, spawnId].every(validId) || !BOSS_TYPES[type] ||
        !Number.isFinite(x) || !Number.isFinite(y) ||
        [authenticateSession, getVerifiedCharacter, getSpawn,
          isWalkable, clock, random].some(f => typeof f !== 'function'))
      throw new TypeError('Invalid private authoritative boss room configuration');
    if (isWalkable(x, y) !== true)
      throw new TypeError('Boss home must be walkable');
    this.storage = storage;
    this.config = { roomId, bossId, spawnId, type, x, y };
    this.authenticateSession = authenticateSession;
    this.getVerifiedCharacter = getVerifiedCharacter;
    this.getSpawn = getSpawn;
    this.isWalkable = isWalkable;
    this.clock = clock;
    this.random = random;
    this.bounds = bounds;
    this.stateKey = 'boss-full-room:v1:' + JSON.stringify([roomId, bossId]);
    this.awardPrefix = 'boss-award:v1:';
  }

  async load(tx) {
    const data = await tx.get(this.stateKey);
    if (data && (data.schema !== 2 ||
        !equal(data.config, this.config) ||
        !data.positions || !data.health || !data.behavior ||
        !data.encounter || !data.events))
      throw new TypeError('Incompatible durable boss room state');
    const { roomId, bossId, spawnId, type, x, y } = this.config;
    let positions;
    const healthOptions = {
      roomId, getVerifiedCharacter: this.getVerifiedCharacter,
      getVerifiedPosition: id => {
        const p = positions?.players.get(id);
        return p ? { roomId, x: p.x, y: p.y } : null;
      },
      random: this.random
    };
    const health = data ?
      ServerPlayerHealth.fromDurableState(data.health, healthOptions) :
      new ServerPlayerHealth(healthOptions);
    const positionOptions = {
      roomId,
      authenticateSession: this.authenticateSession,
      getCharacter: id => {
        const stats = this.getVerifiedCharacter(id);
        if (!stats || stats.roomId !== roomId) return null;
        return { ...stats, alive: health.isAlive(id) };
      },
      getSpawn: this.getSpawn, isWalkable: this.isWalkable,
      clock: this.clock,
      ...(this.bounds ? { bounds: this.bounds } : {})
    };
    positions = data ?
      ServerPlayerPositions.fromDurableState(data.positions, positionOptions) :
      new ServerPlayerPositions(positionOptions);
    if ([...positions.players.keys()].some(id => !health.members.has(id)) ||
        [...health.members.keys()].some(id => !positions.players.has(id)))
      throw new Error('Room positions and health roster disagree');
    const behaviorOptions = {
      roomId, bossId, spawnId, type, homeX: x, homeY: y,
      getVerifiedPlayers: () => [...positions.players].map(([id, p]) => {
        const character = this.getVerifiedCharacter(id);
        if (!character || character.roomId !== roomId)
          throw new TypeError('Room character missing trusted identity');
        return { accountId: id, roomId, x: p.x, y: p.y,
          alive: health.isAlive(id), indoors: character.indoors === true };
      }),
      isWalkable: this.isWalkable, clock: this.clock
    };
    const behavior = data ?
      ServerBossBehavior.restore(data.behavior, behaviorOptions) :
      new ServerBossBehavior(behaviorOptions);
    const combatOptions = {
      roomId, bossId, spawnId, type, x: behavior.x, y: behavior.y,
      resolveVerifiedPlayer: sessionKey => positions.resolveVerifiedPlayer(sessionKey),
      clock: this.clock, random: this.random
    };
    const encounter = data ?
      ServerBossEncounter.fromDurableState(data.encounter, combatOptions) :
      new ServerBossEncounter(combatOptions);
    if (encounter.x !== behavior.x || encounter.y !== behavior.y ||
        (encounter.hp === 0) !== behavior.dead)
      throw new Error('Boss movement, HP and death state disagree');
    const events = data ?
      ServerRoomEventFeed.fromDurableState(data.events, roomId) :
      new ServerRoomEventFeed(roomId);
    return { health, positions, behavior, encounter, events };
  }

  durableState({ health, positions, behavior, encounter, events }) {
    return { schema: 2, config: copy(this.config),
      health: health.exportDurableState(),
      positions: positions.exportDurableState(),
      behavior: behavior.exportDurableState(),
      encounter: encounter.exportDurableState(),
      events: events.exportDurableState() };
  }

  async store(tx, room) {
    await tx.put(this.stateKey, this.durableState(room));
  }

  async snapshot(sessionKey) {
    return this.storage.transaction(async tx => {
      const room = await this.load(tx);
      const accountId = room.positions.identity(sessionKey);
      if (!accountId || !room.positions.players.has(accountId))
        return rejected('unauthorized');
      const boss = room.encounter.state;
      const ai = room.behavior.state;
      return {
        ok: true, boss,
        // Read-only geometry only; never send damage ledgers or private keys.
        behavior: { x: ai.x, y: ai.y, mode: ai.mode,
          warning: ai.warning ? {
            x: ai.warning.x, y: ai.warning.y,
            radius: ai.warning.radius, endsAt: ai.warning.endsAt
          } : null },
        me: room.health.member(accountId),
        eventSequence: room.events.sequence
      };
    });
  }

  // Pull replayable public combat notifications. A player only receives
  // their own strike outcome, never another account's HP or reward data.
  // A client whose cursor is too old must request a new snapshot first.
  async updates(sessionKey, afterSequence = 0) {
    return this.storage.transaction(async tx => {
      const room = await this.load(tx);
      const accountId = room.positions.identity(sessionKey);
      if (!accountId || !room.positions.players.has(accountId))
        return rejected('unauthorized');
      return room.events.readFor(accountId, afterSequence);
    });
  }

  async join(sessionKey) {
    return this.storage.transaction(async tx => {
      const room = await this.load(tx);
      const joined = room.positions.join(sessionKey);
      if (!joined.ok) return joined;
      const health = room.health.join(joined.accountId);
      await this.store(tx, room);
      return { ...joined, health };
    });
  }

  async move(sessionKey, intent) {
    return this.storage.transaction(async tx => {
      const room = await this.load(tx);
      const moved = room.positions.move(sessionKey, intent);
      if (moved.ok) await this.store(tx, room);
      return moved;
    });
  }

  async tick() {
    return this.storage.transaction(async tx => {
      const room = await this.load(tx);
      const events = room.behavior.tick();
      const effects = [];
      for (const event of events) {
        if (event.kind === 'strike') {
          const result = room.health.applyVerifiedStrike(event);
          if (!result.applied)
            throw new Error('An AI strike was unexpectedly replayed');
          effects.push({ kind: 'strike', key: event.key,
            x: event.x, y: event.y, radius: event.radius,
            hits: result.hits });
        } else if (event.kind === 'leash-reset') {
          if (!room.encounter.resetAfterLeash())
            throw new Error('Dead boss cannot reset through AI leash');
          effects.push({ kind: 'leash-reset', key: event.key });
        } else if (event.kind === 'warning') {
          effects.push({ kind: 'warning',
            x: event.x, y: event.y, radius: event.radius,
            endsAt: event.endsAt });
        }
      }
      room.encounter.x = room.behavior.x;
      room.encounter.y = room.behavior.y;
      for (const event of effects) room.events.record(event);
      await this.store(tx, room);
      return effects;
    });
  }

  async attack(sessionKey) {
    if (typeof sessionKey !== 'string' || !sessionKey ||
        sessionKey.length > 256) return rejected('unauthorized');
    return this.storage.transaction(async tx => {
      const room = await this.load(tx);
      room.encounter.x = room.behavior.x;
      room.encounter.y = room.behavior.y;
      const result = room.encounter.attack(sessionKey);
      if (!result.ok) return result;
      if (result.defeated) {
        room.behavior.defeat();
        // The public feed stores no rare-roll, coin or account award details.
        room.events.record({
          kind: 'boss-defeated',
          key: JSON.stringify([
            room.encounter.roomId, room.encounter.bossId,
            room.encounter.spawnId, 'defeated'
          ])
        });
        for (const reward of room.encounter.defeatEvent.rewards) {
          const key = this.awardPrefix + reward.key;
          const existing = await tx.get(key);
          if (existing) {
            if (!equal(existing.reward, reward))
              throw new Error('Boss reward ID collision');
          } else {
            await tx.put(key, {
              schema: 1, status: 'pending', key: reward.key,
              type: room.encounter.type, roomId: room.encounter.roomId,
              bossId: room.encounter.bossId, spawnId: room.encounter.spawnId,
              reward: copy(reward), receipt: null
            });
          }
        }
      }
      await this.store(tx, room);
      return { ...result, boss: room.encounter.state };
    });
  }

  async pendingAwards() {
    return this.storage.transaction(async tx => {
      // Payment reconciliation remains private. The account-side settlement
      // module uses the same keyed outbox format as BossRoomCoordinator.
      const records = await tx.list({ prefix: this.awardPrefix });
      if (!(records instanceof Map))
        throw new TypeError('Expected durable KV list Map');
      return [...records.values()].filter(record => record?.status === 'pending')
        .slice(0, 100).map(copy);
    });
  }

  async acknowledgeAward(key, receipt) {
    if (typeof key !== 'string' || key.length > 1024 ||
        !key.startsWith('[') || typeof receipt !== 'string' ||
        receipt.length < 1 || receipt.length > 256)
      throw new TypeError('Invalid private award acknowledgement');
    return this.storage.transaction(async tx => {
      const recordKey = this.awardPrefix + key;
      const record = await tx.get(recordKey);
      if (!record || record.key !== key) return false;
      if (record.status === 'delivered') {
        if (record.receipt !== receipt)
          throw new Error('Conflicting boss account receipt');
        return false;
      }
      if (record.status !== 'pending')
        throw new Error('Unexpected award settlement status');
      await tx.put(recordKey, { ...record, status: 'delivered', receipt });
      return true;
    });
  }
}
