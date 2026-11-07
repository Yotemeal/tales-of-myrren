// Server-side state transitions. Callers serialize writes per arena and supply
// strikes after validating player identity, eligibility, timing and combat.
export function createJewelheartEncounter(id, maxHp) {
  if (typeof id !== 'string' || !id || !Number.isSafeInteger(maxHp) || maxHp < 1) {
    throw new TypeError('An encounter ID and positive integer HP are required.');
  }
  return { id, maxHp, hp: maxHp, contributions: [] };
}

export function applyJewelheartStrike(state, { encounterId, playerId, sequence, damage }) {
  const ignored = { state, appliedDamage: 0, defeated: false };
  if (encounterId !== state.id || state.hp === 0) return ignored;
  if (typeof playerId !== 'string' || !playerId ||
      !Number.isSafeInteger(sequence) || sequence < 1 ||
      !Number.isSafeInteger(damage) || damage < 0) {
    throw new TypeError('A validated player ID, sequence and damage roll are required.');
  }

  const index = state.contributions.findIndex(entry => entry.playerId === playerId);
  const previous = state.contributions[index];
  if (previous && sequence <= previous.sequence) return ignored;

  const appliedDamage = Math.min(damage, state.hp);
  const hp = state.hp - appliedDamage;
  const contribution = { playerId, sequence, damage: (previous?.damage ?? 0) + appliedDamage };
  const contributions = state.contributions.slice();
  if (index < 0) contributions.push(contribution);
  else contributions[index] = contribution;

  return {
    state: { ...state, hp, contributions },
    appliedDamage,
    defeated: hp === 0
  };
}

export function resetJewelheartEncounter(state, nextId) {
  if (nextId === state.id) throw new TypeError('A reset requires a new encounter ID.');
  return createJewelheartEncounter(nextId, state.maxHp);
}
