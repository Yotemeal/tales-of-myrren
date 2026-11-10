// Server-only authority foundation. Never import this from public/.
// A future Durable Object must supply authenticated sessions, server-derived
// progression/positions, persisted spawn state, and transactional rewards.
const finite = Number.isFinite;
const validId = value => typeof value === 'string' && value.length > 0 &&
  value.length <= 96 && value.trim() === value;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export const BOSS_TYPES = Object.freeze({
  cave: Object.freeze({
    name: 'Cave bear', hp: 150, def: 38, xpm: 7,
    coins: Object.freeze([30, 70]), rareChance: .12,
    rareMaterials: Object.freeze([4, 5])
  }),
  abear: Object.freeze({
    name: 'Aether bear', hp: 520, def: 68, xpm: 6,
    coins: Object.freeze([120, 260]), rareChance: .14,
    rareMaterials: Object.freeze([5, 6])
  })
});

function unitRandom(random) {
  const n = random();
  if (!finite(n) || n < 0 || n >= 1)
    throw new RangeError('Authority random source must return a number in [0, 1)');
  return n;
}

// Mirrors the existing solo/group rules in public/myrren-game.js.
// Only call with an authority-owned ledger, NEVER with browser-supplied rows.
export function allocateBossRewards(def, ledger, coinPool, random = Math.random) {
  if (!def || !finite(def.hp) || def.hp <= 0 || !Array.isArray(ledger))
    return [];
  const credit = new Map();
  for (const entry of ledger) {
    if (!validId(entry?.id) || !finite(entry.damage) || entry.damage <= 0)
      continue;
    credit.set(entry.id, (credit.get(entry.id) || 0) + entry.damage);
  }
  const contributors = [...credit].map(([id, damage]) => ({ id, damage }))
    .sort((a, b) => b.damage - a.damage || a.id.localeCompare(b.id));
  const minimum = Math.max(1, Math.ceil(def.hp * .05));
  const qualified = contributors.length === 1 ? contributors :
    contributors.filter(p => p.damage >= minimum);
  if (qualified.length === 0) return [];
  const pool = finite(coinPool) ? Math.max(0, Math.floor(coinPool)) : 0;
  const total = qualified.reduce((sum, p) => sum + p.damage, 0);
  const weights = qualified.map(p => Math.sqrt(p.damage));
  const weightSum = weights.reduce((sum, n) => sum + n, 0);
  const minCoins = pool >= qualified.length ? 1 : 0;
  const remainder = pool - minCoins * qualified.length;
  const payouts = qualified.map((p, i) => {
    const exact = remainder * p.damage / total;
    return {
      ...p,
      share: p.damage / total,
      dropChance: qualified.length === 1 ?
        clamp(def.rareChance, 0, 1) :
        clamp(def.rareChance * weights[i] / weightSum, 0, 1),
      coins: minCoins + Math.floor(exact),
      fraction: exact - Math.floor(exact)
    };
  });
  const ordering = payouts.map((_, i) => i).sort((a, b) =>
    payouts[b].fraction - payouts[a].fraction ||
    payouts[b].damage - payouts[a].damage ||
    payouts[a].id.localeCompare(payouts[b].id));
  const unpaid = pool - payouts.reduce((sum, p) => sum + p.coins, 0);
  for (let i = 0; i < unpaid; i++) payouts[ordering[i]].coins++;
  return payouts.map(({ fraction, ...p }) => ({
    ...p, rare: unitRandom(random) < p.dropChance
  }));
}

function requireId(id, label) {
  if (!validId(id)) throw new TypeError(label + ' must be a nonempty stable identifier');
  return id;
}
const denied = reason => ({ ok: false, reason });

// A single boss life; caller must provide a unique persistent spawnId.
// No browser API, websocket listener or save modification is exposed here.
export class ServerBossEncounter {
  constructor({
    roomId, bossId, spawnId, type, x, y,
    resolveVerifiedPlayer, clock = Date.now, random = Math.random
  }) {
    this.roomId = requireId(roomId, 'roomId');
    this.bossId = requireId(bossId, 'bossId');
    this.spawnId = requireId(spawnId, 'spawnId');
    this.type = type;
    this.definition = BOSS_TYPES[type];
    if (!this.definition) throw new TypeError('Unknown boss type');
    if (!finite(x) || !finite(y)) throw new TypeError('Boss position must be finite');
    if (typeof resolveVerifiedPlayer !== 'function' ||
        typeof clock !== 'function' || typeof random !== 'function')
      throw new TypeError('Trusted player resolver, clock and RNG are required');
    this.x = x;
    this.y = y;
    this.hp = this.definition.hp;
    this.ledger = new Map();
    this.lastSwing = new Map();
    this.clock = clock;
    this.random = random;
    this.resolveVerifiedPlayer = resolveVerifiedPlayer;
    this.rewardEvent = null;
  }

  get state() {
    return Object.freeze({
      roomId: this.roomId, bossId: this.bossId,
      spawnId: this.spawnId, type: this.type,
      x: this.x, y: this.y, hp: this.hp,
      maxHp: this.definition.hp, defeated: this.hp === 0
    });
  }

  // A full leash/reset starts the same living spawn from full health;
  // never resurrect a defeated spawn or repeat its generated payouts.
  resetAfterLeash() {
    if (this.hp === 0) return false;
    this.hp = this.definition.hp;
    this.ledger.clear();
    this.lastSwing.clear();
    return true;
  }

  // sessionKey is merely a lookup handle; identity and all player stats
  // must come from the TRUSTED server resolver (never from attack args).
  attack(sessionKey) {
    if (this.hp === 0) return denied('defeated');
    const player = this.resolveVerifiedPlayer(sessionKey);
    if (!player || !validId(player.accountId) ||
        player.roomId !== this.roomId ||
        player.alive !== true || player.indoors === true)
      return denied('unauthorized');
    if (!finite(player.x) || !finite(player.y) ||
        !Number.isInteger(player.level) || player.level < 1 || player.level > 100 ||
        !Number.isInteger(player.attackBonus) || player.attackBonus < 0 ||
        player.attackBonus > 200)
      return denied('unverified-combatant');

    const reach = player.weaponKind === 'sword' ? 30 : 22;
    if (Math.hypot(this.x - player.x, this.y - 4 - player.y) > reach)
      return denied('out-of-range');

    const now = this.clock();
    if (!finite(now) || now < 0) throw new RangeError('Invalid authority clock');
    const previous = this.lastSwing.get(player.accountId);
    if (previous != null && (now < previous || now - previous < 900))
      return denied('cooldown');
    this.lastSwing.set(player.accountId, now);

    const hitChance = clamp(
      .55 + (player.level - this.definition.def) * .03 +
      player.attackBonus * .01, .25, .95
    );
    const hit = unitRandom(this.random) < hitChance;
    const maxHit = 2 + Math.floor(player.level / 4) + player.attackBonus;
    const rolled = hit ? 1 + Math.floor(unitRandom(this.random) * maxHit) : 0;
    const damage = Math.min(this.hp, rolled); // no overkill credit
    if (damage > 0) {
      this.hp -= damage;
      this.ledger.set(player.accountId,
        (this.ledger.get(player.accountId) || 0) + damage);
    }
    if (this.hp === 0) this.finishKill();
    return { ok: true, hit, damage, hp: this.hp, defeated: this.hp === 0 };
  }

  finishKill() {
    if (this.rewardEvent) return this.rewardEvent;
    if (this.hp !== 0) throw new Error('Boss is still alive');
    const def = this.definition;
    const pool = def.coins[0] +
      Math.floor(unitRandom(this.random) * (def.coins[1] - def.coins[0] + 1));
    const payouts = allocateBossRewards(def,
      [...this.ledger].map(([id, damage]) => ({ id, damage })),
      pool, this.random);
    const rewards = payouts.map(p => Object.freeze({
      // JSON tuple avoids separator collisions in stable reward keys.
      key: JSON.stringify([this.roomId, this.bossId, this.spawnId, p.id]),
      accountId: p.id,
      coins: p.coins,
      combatXp: Math.max(1, Math.round(def.hp * def.xpm)),
      damage: p.damage,
      damageShare: p.share,
      rareChance: p.dropChance,
      rare: p.rare,
      rareMaterials: p.rare ? [...def.rareMaterials] : []
    }));
    // Entitlements only. No coins, XP or equipment are granted here.
    // The future authenticated service MUST atomically persist each key.
    this.rewardEvent = Object.freeze({
      roomId: this.roomId, bossId: this.bossId,
      spawnId: this.spawnId, type: this.type,
      coinPool: pool, rewards: Object.freeze(rewards)
    });
    return this.rewardEvent;
  }

  // Never expose a damage ledger or entitlement creation to clients.
  get defeatEvent() { return this.rewardEvent; }
}
