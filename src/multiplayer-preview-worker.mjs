// OPTIONAL Cloudflare multiplayer PREVIEW worker (never imported by the live
// src/worker.js or included in the production wrangler.jsonc).
// Requires separate preview deployment and Supabase public Auth configuration.
// The preview arena collider is deliberately synthetic, not the real map:
// do NOT switch production clients to this endpoint.
import { DurableObject } from 'cloudflare:workers';
import { DurableBossRoomService } from './server-boss-durable-service.mjs';
import { SupabaseCombatAuthenticator } from './server-supabase-auth.mjs';
import { createBossHttpCommandHandler } from './server-boss-command-gateway.mjs';

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
    if (!env.SUPABASE_PROJECT_URL || !env.SUPABASE_PUBLISHABLE_KEY)
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
    if (result.ok) {
      // Only successful, authenticated commands keep the room active. The
      // alarm stops after 15 seconds of no authenticated requests to avoid
      // continuously billing empty rooms.
      await this.ctx.storage.put('preview-last-active:v1', Date.now());
      if (await this.ctx.storage.getAlarm() === null)
        await this.ctx.storage.setAlarm(Date.now() + TICK_MS);
    }
    return result;
  }

  async alarm() {
    const last = await this.ctx.storage.get('preview-last-active:v1');
    if (!Number.isFinite(last) || Date.now() - last > IDLE_MS)
      return; // Timers are server-side; users cannot submit tick commands.
    await this.room.tick();
    await this.ctx.storage.setAlarm(Date.now() + TICK_MS);
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
