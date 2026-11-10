// Private, account-scoped SQLite Durable Object. No public fetch route.
// RPC is only callable via the bound namespace by trusted Worker/room code.
// The name is a verified Supabase UUID, not a browser-supplied identifier.
import { DurableObject } from 'cloudflare:workers';
import { ServerGlobalAccountService } from './server-global-account.mjs';

export class MyrrenAccountPreview extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    const id = ctx.id.name;
    if (typeof id !== 'string')
      throw new TypeError('Named account Durable Object required');
    this.account = new ServerGlobalAccountService({
      storage: ctx.storage, accountId: id
    });
  }

  // This RPC must never be forwarded by the public Worker. The input is an
  // entitlement obtained from committed room storage, not client JSON.
  async settleRoomAward(pending) {
    return this.account.settleRoomAward(pending);
  }

  // Private reconciliation/debugging only; never expose on the game route.
  async readTrustedBalance() {
    return this.account.readTrustedBalance();
  }
}
