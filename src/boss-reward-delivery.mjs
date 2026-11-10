// INTERNAL outbox reconciliation only. A trusted service must supply
// room and account-ledger objects; NEVER expose this as a browser route.
// The account ledger guarantees replay-safe credit, so a crash between
// account commit and room acknowledgement is harmless on retry.
export async function deliverBossOutbox({ room, getAccountLedger, limit = 100 }) {
  if (!room || typeof room.pendingAwards !== 'function' ||
      typeof room.acknowledgeAward !== 'function' ||
      typeof getAccountLedger !== 'function')
    throw new TypeError('Authenticated private room and account resolver required');

  const pending = await room.pendingAwards(limit);
  const results = [];
  for (const record of pending) {
    try {
      // This resolver must use backend-verified account identity and a
      // transactionally consistent account store, not a client save.
      const ledger = await getAccountLedger(record.reward.accountId);
      if (!ledger || typeof ledger.settleTrustedAward !== 'function')
        throw new TypeError('Missing trusted account ledger');
      const settled = await ledger.settleTrustedAward(record);
      if (!settled.receipt) {
        results.push({
          key: record.key, accountId: record.reward.accountId,
          status: 'blocked', reason: settled.reason || 'no-receipt'
        });
        continue;
      }
      await room.acknowledgeAward(record.key, settled.receipt);
      results.push({
        key: record.key, accountId: record.reward.accountId,
        status: 'delivered', applied: settled.applied === true,
        receipt: settled.receipt, itemId: settled.itemId ?? null
      });
    } catch (error) {
      // Do not acknowledge on failure: pending award will be retried.
      results.push({
        key: record.key, accountId: record.reward.accountId,
        status: 'failed', reason: String(error?.message || error)
      });
    }
  }
  return results;
}
