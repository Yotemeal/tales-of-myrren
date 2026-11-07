const BASIS_POINTS = 10_000;

// Odds and coin amounts come from the host's balance configuration.
export function createJewelheartRewardPolicy({ coinsPerContributor, rares, rollBasisPoints }) {
  if (!Number.isSafeInteger(coinsPerContributor) || coinsPerContributor < 1 ||
      !Array.isArray(rares) || !rares.length || typeof rollBasisPoints !== 'function') {
    throw new TypeError('Coins, rare drop odds and a server roll function are required.');
  }
  const itemIds = new Set();
  const drops = rares.map(({ itemId, contributorChance, topChance }) => {
    if (typeof itemId !== 'string' || !itemId || itemIds.has(itemId) ||
        !Number.isInteger(contributorChance) || contributorChance < 1 ||
        !Number.isInteger(topChance) || topChance <= contributorChance || topChance > BASIS_POINTS) {
      throw new TypeError('Each rare needs a unique item ID and higher odds for top contributors.');
    }
    itemIds.add(itemId);
    return { itemId, contributorChance, topChance };
  });

  return function rollRewards(state) {
    if (state.hp !== 0) throw new Error('Jewelheart must be defeated before rolling rewards.');
    const contributors = state.contributions.filter(entry => entry.damage > 0);
    const highest = contributors.reduce((max, entry) => Math.max(max, entry.damage), 0);
    const awards = contributors.map(({ playerId, damage }) => {
      const topContributor = damage === highest;
      const items = [];
      for (const { itemId, contributorChance, topChance } of drops) {
        const roll = rollBasisPoints();
        if (!Number.isInteger(roll) || roll < 0 || roll >= BASIS_POINTS) {
          throw new RangeError('A reward roll must be an integer in [0, 10000).');
        }
        if (roll < (topContributor ? topChance : contributorChance)) items.push(itemId);
      }
      return { playerId, coins: coinsPerContributor, items, topContributor };
    });
    return { encounterId: state.id, awards };
  };
}
