// PRIVATE account-side settlement prototype; no public route or live save
// integration. Caller must obtain an award from the authenticated boss room
// outbox. Do not accept browser-submitted awards or account identifiers.
import { BOSS_TYPES } from './boss-encounter.mjs';

const MATERIAL = Object.freeze({
  4: Object.freeze({ prefix: 'steel', kinds: Object.freeze([
    'sword', 'axe', 'pick', 'net', 'rod', 'ring', 'amulet',
    'helm', 'body', 'gloves', 'legs', 'boots', 'shield'
  ]) }),
  5: Object.freeze({ prefix: 'cobalt', kinds: Object.freeze([
    'sword', 'axe', 'pick', 'rod', 'helm', 'body', 'gloves',
    'legs', 'boots', 'shield'
  ]) }),
  6: Object.freeze({ prefix: 'aether', kinds: Object.freeze([
    'sword', 'axe', 'pick', 'rod', 'helm', 'body', 'gloves',
    'legs', 'boots', 'shield'
  ]) })
});
const validId = v => typeof v === 'string' && v.length > 0 &&
  v.length <= 96 && v.trim() === v;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const copy = value => JSON.parse(JSON.stringify(value));
function randIndex(random, length) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError('Invalid authority RNG');
  return Math.floor(value * length);
}
function validateAward(pending, accountId) {
  if (!pending || pending.schema !== 1 || pending.status !== 'pending' ||
      !validId(pending.roomId) || !validId(pending.bossId) ||
      !validId(pending.spawnId) || !BOSS_TYPES[pending.type] ||
      typeof pending.key !== 'string' || !pending.reward ||
      pending.key !== pending.reward.key ||
      pending.reward.accountId !== accountId)
    throw new TypeError('Invalid or wrong-account trusted boss award');
  let key;
  try { key = JSON.parse(pending.key); } catch { throw new TypeError('Malformed reward key'); }
  if (!Array.isArray(key) || key.length !== 4 ||
      !same(key, [
        pending.roomId, pending.bossId, pending.spawnId, accountId
      ])) throw new TypeError('Award identity does not match encounter');
  const def = BOSS_TYPES[pending.type], reward = pending.reward;
  if (!Number.isSafeInteger(reward.coins) || reward.coins < 1 ||
      reward.coins > def.coins[1] ||
      reward.combatXp !== Math.max(1, Math.round(def.hp * def.xpm)) ||
      !Number.isFinite(reward.damage) || reward.damage <= 0 ||
      reward.damage > def.hp || !Number.isFinite(reward.damageShare) ||
      reward.damageShare <= 0 || reward.damageShare > 1 ||
      !Number.isFinite(reward.rareChance) ||
      reward.rareChance <= 0 || reward.rareChance > def.rareChance ||
      typeof reward.rare !== 'boolean' ||
      !Array.isArray(reward.rareMaterials) ||
      !same(reward.rareMaterials, reward.rare ? [...def.rareMaterials] : []))
    throw new TypeError('Invalid boss reward quantities or material pool');
  return reward;
}
function validatedAccount(state, accountId) {
  if (!state) return {
    schema: 1, accountId, coins: 0, combatXp: 0, gear: [], overflow: []
  };
  if (state.schema !== 1 || state.accountId !== accountId ||
      !Number.isSafeInteger(state.coins) || state.coins < 0 ||
      !Number.isSafeInteger(state.combatXp) || state.combatXp < 0 ||
      !Array.isArray(state.gear) || !Array.isArray(state.overflow) ||
      state.gear.length > 36 || state.overflow.length > 128 ||
      ![...state.gear, ...state.overflow].every(
        item => typeof item === 'string' && item.length < 80
      )) throw new TypeError('Invalid stored account reward ledger');
  return state;
}

// This account ledger is a separate test-only future economy model, not a
// migration for save.inv, save.xp or user cloud storage.
export class BossAccountRewardLedger {
  constructor({ storage, accountId, random = Math.random }) {
    if (!storage || typeof storage.transaction !== 'function' ||
        !validId(accountId) || typeof random !== 'function')
      throw new TypeError('Account identity and transactional storage required');
    this.storage = storage;
    this.accountId = accountId;
    this.random = random;
    this.accountKey = 'boss-account:v1:' + accountId;
    this.receiptPrefix = 'boss-account-receipt:v1:';
  }

  async snapshot() {
    return this.storage.transaction(async tx =>
      copy(validatedAccount(await tx.get(this.accountKey), this.accountId)));
  }

  // Only a trusted internal outbox-delivery service can call this. There is
  // deliberately no public Worker route or client-controllable API.
  async settleTrustedAward(pending) {
    const reward = validateAward(pending, this.accountId);
    const fingerprint = copy({
      type: pending.type, roomId: pending.roomId,
      bossId: pending.bossId, spawnId: pending.spawnId,
      reward
    });
    return this.storage.transaction(async tx => {
      const receiptKey = this.receiptPrefix + pending.key;
      const old = await tx.get(receiptKey);
      if (old) {
        if (!same(old.fingerprint, fingerprint))
          throw new Error('Conflicting duplicate account reward key');
        return { applied: false, receipt: old.receipt, itemId: old.itemId };
      }
      const account = validatedAccount(
        await tx.get(this.accountKey), this.accountId
      );
      if (account.coins + reward.coins > Number.MAX_SAFE_INTEGER ||
          account.combatXp + reward.combatXp > Number.MAX_SAFE_INTEGER)
        throw new RangeError('Account reward counter overflow');
      if (reward.rare && account.gear.length >= 36 &&
          account.overflow.length >= 128)
        return { applied: false, reason: 'claim-storage-full' };

      let itemId = null;
      if (reward.rare) {
        const material = reward.rareMaterials[
          randIndex(this.random, reward.rareMaterials.length)
        ];
        const pool = MATERIAL[material];
        if (!pool) throw new RangeError('Unknown boss gear material');
        itemId = pool.prefix + '_' +
          pool.kinds[randIndex(this.random, pool.kinds.length)];
        if (account.gear.length < 36) account.gear.push(itemId);
        else account.overflow.push(itemId); // durable claim queue, never discard
      }
      account.coins += reward.coins;
      account.combatXp += reward.combatXp;
      // Receipt identity is account-scoped; no randomness or mutable timestamp.
      const receipt = 'myrren-credit-v1:' + this.accountId + ':' +
        (account.coins + account.combatXp);
      await tx.put(this.accountKey, account);
      await tx.put(receiptKey, { fingerprint, receipt, itemId });
      return { applied: true, receipt, itemId };
    });
  }
}

export const BOSS_RARE_ITEM_POOLS = MATERIAL;
