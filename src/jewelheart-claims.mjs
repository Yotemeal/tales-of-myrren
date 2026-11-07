// Server-only claim handler. The caller supplies a verified player identity
// and storage scoped to that player's authoritative inventory.
export function createJewelheartClaimHandler({ encounterService, storageForPlayer, canFit }) {
  return async function claim(encounterId, playerId) {
    const record = await encounterService.rewards(encounterId);
    const award = record?.awards.find(entry => entry.playerId === playerId);
    if (!award) return { status: 'unavailable' };

    const storage = storageForPlayer(playerId);
    return storage.transaction(async tx => {
      const receiptKey = 'jewelheart-claim/' + encounterId;
      const receipt = await tx.get(receiptKey);
      if (receipt) return { status: 'already-claimed', receipt };

      const inventory = await tx.get('inventory');
      if (!inventory) return { status: 'inventory-unavailable' };
      if (award.items.length && !canFit(inventory, award.items.length)) {
        return { status: 'pack-full' };
      }

      const previousCoins = inventory.inv.coins ?? 0;
      const coins = previousCoins + award.coins;
      if (!Number.isSafeInteger(previousCoins) || previousCoins < 0 || !Number.isSafeInteger(coins)) {
        return { status: 'coin-limit' };
      }

      const granted = { encounterId, coins: award.coins, items: award.items.slice() };
      await tx.put('inventory', {
        ...inventory,
        inv: { ...inventory.inv, coins },
        bag: [...inventory.bag, ...award.items]
      });
      await tx.put(receiptKey, granted);
      return { status: 'claimed', receipt: granted };
    });
  };
}
