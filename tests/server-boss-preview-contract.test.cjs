'use strict';
// This test is intentionally static: production Wrangler must NEVER import
// or deploy the experimental authenticated boss preview worker.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const live = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const preview = JSON.parse(fs.readFileSync('wrangler.multiplayer-preview.jsonc','utf8'));
const liveWorker = fs.readFileSync('src/worker.js','utf8');
const previewWorker = fs.readFileSync('src/multiplayer-preview-worker.mjs','utf8');

assert.equal(live.name,'tales-of-myrren');
assert.equal(live.main,'src/worker.js');
assert.equal(live.assets.directory,'./public');
assert(!live.durable_objects && !live.exports && !live.migrations,
  'live game Worker must remain without experimental multiplayer bindings');
assert(!liveWorker.includes('multiplayer-preview-worker') &&
  !liveWorker.includes('server-boss-durable-service'),
  'live Worker must not expose preview multiplayer routes');

assert.equal(preview.name,'tales-of-myrren-multiplayer-preview');
assert.notEqual(preview.name,live.name,
  'preview must never deploy over the live game');
assert.equal(preview.main,'src/multiplayer-preview-worker.mjs');
assert.deepEqual(preview.durable_objects.bindings, [
  {name:'BOSS_ROOMS',class_name:'MyrrenBossPreviewRoom'},
  {name:'ACCOUNT_RECORDS',class_name:'MyrrenAccountPreview'}
]);
assert.deepEqual(preview.exports.MyrrenBossPreviewRoom,
  {type:'durable-object',storage:'sqlite'});
assert.deepEqual(preview.exports.MyrrenAccountPreview,
  {type:'durable-object',storage:'sqlite'});
assert(!preview.assets,
  'preview may not inadvertently publish live player game assets');
assert(!preview.migrations,
  'new SQLite DO lifecycle uses Cloudflare declarative exports');

assert(previewWorker.includes("from 'cloudflare:workers'") &&
  previewWorker.includes('extends DurableObject'),
  'preview class uses real Cloudflare DO runtime base');
assert(previewWorker.includes("url.pathname !== '/preview/boss'") &&
  previewWorker.includes('getByName(ROOM_KEY)'),
  'only one static preview arena is routable');
assert(previewWorker.includes("new Request(internal, request)") &&
  previewWorker.includes("internal.pathname = '/internal/boss/command'"),
  'browser cannot send commands directly to DO internal endpoint');
assert(previewWorker.includes("origin !== url.origin"),
  'cross-origin calls must be denied without CORS');
assert(previewWorker.includes('ACCOUNT_RECORDS') &&
  previewWorker.includes('account.settleRoomAward(award)') &&
  previewWorker.includes('deliverBossOutbox'),
  'private account RPC must settle only committed room award records');
const accountSource=fs.readFileSync('src/server-account-preview-object.mjs','utf8');
assert(accountSource.includes('ctx.id.name') &&
  accountSource.includes('extends DurableObject') &&
  !accountSource.includes('async fetch('),
  'global account DO uses UUID-derived identity without a public HTTP route');
assert(previewWorker.includes('SUPABASE_PUBLISHABLE_KEY') &&
  previewWorker.includes('SUPABASE_PROJECT_URL'),
  'preview must require independently configured public Auth settings');
assert(previewWorker.includes("await this.room.tick()") &&
  previewWorker.includes('IDLE_MS') &&
  previewWorker.includes('body?.ok === true'),
  'only successful authenticated commands may keep server-owned AI active');
assert(previewWorker.includes('await this.reconcileAwards()') &&
  previewWorker.includes('pending.length') &&
  previewWorker.includes('60_000'),
  'account receipts must be retried from durable room outbox without busy-looping');
const accountAdapter=fs.readFileSync('src/server-global-account.mjs','utf8');
assert(accountAdapter.includes('BossAccountRewardLedger') &&
  accountAdapter.includes('settleRoomAward(pending)'),
  'cross-room payouts require per-UUID ledger and its committed receipts');
assert(!previewWorker.includes('player_saves') &&
  !previewWorker.includes('service_role'),
  'worker must not load user-editable stats or embed privileged keys');
assert(!JSON.stringify(preview).includes('sb_publishable_'),
  'no account settings or secrets embedded in preview Wrangler config');

console.log('PASS: isolated room/account SQLite preview, production release unchanged, authenticated route, idempotent private account RPC and server timer');
