// OPTIONAL Cloudflare multiplayer PREVIEW worker (never imported by the live
// src/worker.js or included in the production wrangler.jsonc).
// Requires separate preview deployment and Supabase public Auth configuration.
// The preview arena collider is deliberately synthetic, not the real map:
// do NOT switch production clients to this endpoint.
import { DurableObject } from 'cloudflare:workers';
import { DurableBossRoomService } from './server-boss-durable-service.mjs';
import { SupabaseCombatAuthenticator } from './server-supabase-auth.mjs';
import { createBossHttpCommandHandler } from './server-boss-command-gateway.mjs';
import { deliverBossOutbox } from './boss-reward-delivery.mjs';
import { AUTH_ACCOUNT_ID } from './server-global-account.mjs';
export { MyrrenAccountPreview } from './server-account-preview-object.mjs';

const ROOM_KEY = 'preview-grove-bear-v1';
const IDLE_MS = 15_000;
const TICK_MS = 100;
const response = (body, status) => new Response(JSON.stringify(body), {
  status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff'
  }
});

export class MyrrenBossPreviewRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    if (!env.SUPABASE_PROJECT_URL || !env.SUPABASE_PUBLISHABLE_KEY ||
        !env.ACCOUNT_RECORDS)
      throw new Error('Preview Supabase Auth configuration is missing');
    const authenticator = new SupabaseCombatAuthenticator({
      projectUrl: env.SUPABASE_PROJECT_URL,
      publishableKey: env.SUPABASE_PUBLISHABLE_KEY
    });
    // Preview-only arena: server-approved positions and bounds. Real-world
    // collision geometry must replace this before gameplay launch.
    this.room = new DurableBossRoomService({
      storage: ctx.storage, roomId: 'preview-grove',
      bossId: 'cave-bear', spawnId: 'preview-cave-life-1',
      type: 'cave', x: 200, y: 200,
      getSpawn: () => ({ x: 200, y: 204 }),
      isWalkable: (x, y) => Number.isFinite(x) && Number.isFinite(y) &&
        x >= 108 && x <= 1492 && y >= 108 && y <= 1492
    });
    this.handleCommand = createBossHttpCommandHandler({
      authenticator,
      createTrustedRoom: (accountId, type) =>
        this.room.forVerifiedAccount(accountId, type)
    });
  }

  async fetch(request) {
    const result = await this.handleCommand(request);
    // HTTP 200 can also carry an application-level rejection such as
    // "not-joined" or "out-of-range". Those must not keep billing an idle room.
    const body = result.ok ? await result.clone().json().catch(() => null) : null;
    if (body?.ok === true) {
      // Only genuinely successful and authenticated gameplay commands keep
      // the room active. Idle alarms stop after 15 seconds to avoid
      // continuously billing empty rooms.
      await this.ctx.storage.put('preview-last-active:v1', Date.now());
      if (await this.ctx.storage.getAlarm() === null)
        await this.ctx.storage.setAlarm(Date.now() + TICK_MS);
    }
    return result;
  }

  // Only the server's persisted boss-outbox may call an account's private
  // settlement RPC. This is intentionally NOT a client-facing command.
  async reconcileAwards() {
    const { room } = this.room.roomFor();
    return deliverBossOutbox({
      room,
      getAccountLedger: async accountId => {
        if (typeof accountId !== 'string' ||
            !AUTH_ACCOUNT_ID.test(accountId))
          throw new TypeError('Unverified boss reward account');
        const account = this.env.ACCOUNT_RECORDS.getByName(accountId.toLowerCase());
        return {
          settleTrustedAward: award => account.settleRoomAward(award)
        };
      }
    });
  }

  async alarm() {
    const last = await this.ctx.storage.get('preview-last-active:v1');
    const active = Number.isFinite(last) &&
      Date.now() - last <= IDLE_MS;
    if (active) await this.room.tick();
    // Cross-DO transfers cannot be one transaction. The room writes its
    // outbox first; the account writes a durable receipt second, then the
    // room acknowledges. Retries are idempotent after crashes.
    await this.reconcileAwards();
    const { room } = this.room.roomFor();
    const pending = await room.pendingAwards();
    if (active || pending.length)
      await this.ctx.storage.setAlarm(
        Date.now() + (active ? TICK_MS : 60_000)
      );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/preview/boss')
      return response({ ok: false, reason: 'not-found' }, 404);
    if (request.method !== 'POST')
      return response({ ok: false, reason: 'method-not-allowed' }, 405);
    // No public CORS. Reject cross-origin browser requests even with a valid
    // token; clients must explicitly use this isolated preview origin.
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin)
      return response({ ok: false, reason: 'forbidden-origin' }, 403);
    if (!env.BOSS_ROOMS || !env.SUPABASE_PROJECT_URL ||
        !env.SUPABASE_PUBLISHABLE_KEY)
      return response({ ok: false, reason: 'preview-not-configured' }, 503);
    const stub = env.BOSS_ROOMS.getByName(ROOM_KEY);
    const internal = new URL(request.url);
    internal.pathname = '/internal/boss/command';
    return stub.fetch(new Request(internal, request));
  }
};
