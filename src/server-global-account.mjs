// Private, globally keyed account reward authority for future multiplayer.
// One SQLite-backed Durable Object owns every account's coins, combat XP and
// rare drops across ALL rooms. Never ingest public player_saves, or expose
// settleTrustedAward through an HTTP route or client-selected account ID.
import { BossAccountRewardLedger } from './boss-account-ledger.mjs';

export const AUTH_ACCOUNT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ServerGlobalAccountService {
  constructor({ storage, accountId, random = Math.random }) {
    if (!AUTH_ACCOUNT_ID.test(accountId || '') ||
        !storage || typeof storage.transaction !== 'function' ||
        typeof random !== 'function')
      throw new TypeError('Server account requires owned UUID and durable storage');
    this.accountId = accountId.toLowerCase();
    this.ledger = new BossAccountRewardLedger({
      storage, accountId: this.accountId, random
    });
  }

  // Internal-only read: a future public handler must independently verify
  // the Supabase token before selecting this account's Durable Object.
  async readTrustedBalance() {
    const state = await this.ledger.snapshot();
    return {
      accountId: this.accountId, coins: state.coins,
      combatXp: state.combatXp,
      gear: [...state.gear], overflow: [...state.overflow]
    };
  }

  // Only a room-owned, persistently committed, private reward outbox may
  // supply this record. The ledger validates every grant and saves a unique
  // receipt in the SAME account transaction as XP, coins and gear.
  async settleRoomAward(pending) {
    if (pending?.reward?.accountId !== this.accountId)
      throw new TypeError('Boss reward targets a different account');
    return this.ledger.settleTrustedAward(pending);
  }
}
