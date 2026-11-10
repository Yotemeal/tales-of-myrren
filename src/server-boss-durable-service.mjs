// Cloudflare SQLite-backed Durable Object storage adapter for boss-room state.
// Deliberately isolated from the production Worker. Only authenticated
// accounts can create starter profiles. All stats and world geometry are
// server-owned; never read them from Supabase player_saves or client JSON.
import { ServerBossRoom } from './server-boss-room.mjs';
import { BOSS_TYPES } from './boss-encounter.mjs';
import {
  ensureStarterCharacter, loadTrustedCharacters
} from './server-trusted-characters.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const valid = id => typeof id === 'string' && id.length > 0 &&
  id.length <= 96 && id.trim() === id;
const clone = v => JSON.parse(JSON.stringify(v));

export class DurableBossRoomService {
  constructor({ storage, roomId, bossId, spawnId, type,
    x, y, getSpawn, isWalkable, bounds,
    random = Math.random, clock = Date.now,
    randomUUID = () => crypto.randomUUID() }) {
    if (!storage || typeof storage.transaction !== 'function' ||
        ![roomId,bossId,spawnId].every(valid) ||
        !BOSS_TYPES[type] || !Number.isFinite(x) || !Number.isFinite(y) ||
        [getSpawn,isWalkable,random,clock,randomUUID].some(f =>
          typeof f !== 'function') || isWalkable(x,y) !== true)
      throw new TypeError('Durable boss room requires trusted stable configuration');
    Object.assign(this, {
      storage, roomId, bossId, spawnId, type, x, y,
      getSpawn, isWalkable, bounds, random, clock, randomUUID
    });
  }

  // Construct a new per-request room instance. No shared mutable roster is
  // cached between concurrent requests. Every command's character snapshot
  // is loaded WITHIN its storage transaction and discarded on completion.
  roomFor(accountId = null, { provision = false } = {}) {
    if (accountId !== null && (!UUID.test(accountId) || !valid(accountId)))
      throw new TypeError('Only a verified account UUID may use a room');
    if (provision && !accountId)
      throw new TypeError('Cannot provision an anonymous character');
    const sessionKey = accountId ?
      'private:' + accountId + ':' + this.randomUUID() : null;
    if (sessionKey && (typeof sessionKey !== 'string' ||
        sessionKey.length > 256))
      throw new TypeError('Invalid private server session');
    let profiles = null;
    const adapter = {
      transaction: fn => this.storage.transaction(async tx => {
        if (provision)
          await ensureStarterCharacter(tx, this.roomId, accountId);
        const snapshot = await loadTrustedCharacters(tx, this.roomId);
        profiles = snapshot;
        try {
          return await fn(tx);
        } finally {
          profiles = null;
          snapshot.clear();
        }
      })
    };
    const getVerifiedCharacter = id => {
      const value = profiles?.get(id);
      return value ? clone(value) : null;
    };
    const room = new ServerBossRoom({
      storage: adapter,
      roomId: this.roomId, bossId: this.bossId,
      spawnId: this.spawnId, type: this.type,
      x: this.x, y: this.y,
      authenticateSession: key => sessionKey &&
        key === sessionKey ? { roomId: this.roomId, accountId } : null,
      getVerifiedCharacter, getSpawn: this.getSpawn,
      isWalkable: this.isWalkable, clock: this.clock,
      random: this.random,
      ...(this.bounds ? { bounds: this.bounds } : {})
    });
    return { room, sessionKey };
  }

  // Called only by the trusted server timer, NEVER from browser payloads.
  async tick() {
    const { room } = this.roomFor();
    return room.tick();
  }

  // The command gateway calls this only *after* cryptographic Supabase
  // authentication. A new account receives an immutable level-one starter,
  // regardless of what local/cloud save the browser previously uploaded.
  async forVerifiedAccount(accountId, commandType) {
    return this.roomFor(accountId, { provision: commandType === 'join' });
  }
}
