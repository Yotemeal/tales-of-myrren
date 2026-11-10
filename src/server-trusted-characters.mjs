// Server-owned character records. NOT derived from browser player_saves.
// The account is established by verified Supabase Auth before provisioning.
// Profiles are durable and exclusively written by this trusted server service.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROOM_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const PROFILE_PREFIX = 'trusted-character:v1:';
export const PROFILE_LIMIT = 64;
const fail = () => { throw new TypeError('Invalid trusted character record'); };

export function validateTrustedCharacter(value, expectedRoom, expectedAccount) {
  if (!value || typeof value !== 'object' ||
      value.schema !== 1 || !UUID.test(value.accountId || '') ||
      !ROOM_ID.test(value.roomId || '') ||
      value.roomId !== expectedRoom ||
      (expectedAccount && value.accountId !== expectedAccount) ||
      !Number.isSafeInteger(value.level) || value.level < 1 || value.level > 100 ||
      !Number.isSafeInteger(value.attackBonus) ||
      value.attackBonus < 0 || value.attackBonus > 200 ||
      !Number.isSafeInteger(value.defenseTotal) ||
      value.defenseTotal < 0 || value.defenseTotal > 1000 ||
      !['fist', 'sword', null].includes(value.weaponKind) ||
      typeof value.indoors !== 'boolean' ||
      Object.keys(value).some(key => ![
        'schema','roomId','accountId','level','attackBonus',
        'defenseTotal','weaponKind','indoors'
      ].includes(key)))
    fail();
  return Object.freeze({ ...value });
}

export function starterCharacter(roomId, accountId) {
  if (!ROOM_ID.test(roomId || '') || !UUID.test(accountId || ''))
    fail();
  return Object.freeze({
    schema: 1, roomId, accountId,
    level: 1, attackBonus: 0, defenseTotal: 0,
    weaponKind: 'fist', indoors: false
  });
}

// Only after cryptographic login verification. An authenticated user may
// bootstrap a fixed, unprivileged starter; NOT choose their stats or gear.
// Real item/XP progression must be authored by a future server-owned service.
export async function ensureStarterCharacter(tx, roomId, accountId) {
  const starter = starterCharacter(roomId, accountId);
  const key = PROFILE_PREFIX + accountId;
  const existing = await tx.get(key);
  if (existing !== undefined) {
    return validateTrustedCharacter(existing, roomId, accountId);
  }
  const roster = await tx.list({ prefix: PROFILE_PREFIX });
  if (!(roster instanceof Map) || roster.size >= PROFILE_LIMIT)
    throw new RangeError('Authoritative character roster full');
  await tx.put(key, starter);
  return starter;
}

export async function loadTrustedCharacters(tx, roomId) {
  if (!ROOM_ID.test(roomId || '')) fail();
  const entries = await tx.list({ prefix: PROFILE_PREFIX });
  if (!(entries instanceof Map) || entries.size > PROFILE_LIMIT)
    throw new RangeError('Invalid trusted character roster');
  const profiles = new Map();
  for (const [key, data] of entries) {
    if (!key.startsWith(PROFILE_PREFIX)) fail();
    const accountId = key.slice(PROFILE_PREFIX.length);
    const record = validateTrustedCharacter(data, roomId, accountId);
    if (profiles.has(accountId)) fail();
    profiles.set(accountId, record);
  }
  return profiles;
}
