import {
  applyJewelheartStrike,
  createJewelheartEncounter,
  resetJewelheartEncounter
} from './jewelheart-encounter.mjs';

// One instance serves one arena. The storage adapter must provide atomic
// read/modify/write transactions and resolve only after a successful commit.
export function createJewelheartService({ storage, newEncounterId, maxHp, rollRewards }) {
  const key = 'jewelheart';
  const rewardKey = id => 'jewelheart-rewards/' + id;

  async function open() {
    return storage.transaction(async tx => {
      const current = await tx.get(key);
      if (current) return current;

      const state = createJewelheartEncounter(newEncounterId(), maxHp);
      await tx.put(key, state);
      return state;
    });
  }

  async function strike(validatedStrike) {
    return storage.transaction(async tx => {
      const current = await tx.get(key);
      if (!current) return { state: null, appliedDamage: 0, defeated: false };

      const result = applyJewelheartStrike(current, validatedStrike);
      if (result.state !== current) await tx.put(key, result.state);
      if (result.defeated && rollRewards) {
        await tx.put(rewardKey(current.id), rollRewards(result.state));
      }
      return result;
    });
  }

  async function reset(expectedEncounterId) {
    return storage.transaction(async tx => {
      const current = await tx.get(key);
      if (!current || current.id !== expectedEncounterId) {
        return { state: current ?? null, reset: false };
      }

      const state = resetJewelheartEncounter(current, newEncounterId());
      await tx.put(key, state);
      return { state, reset: true };
    });
  }

  async function rewards(encounterId) {
    return storage.transaction(async tx => (await tx.get(rewardKey(encounterId))) ?? null);
  }

  return { open, strike, reset, rewards };
}
