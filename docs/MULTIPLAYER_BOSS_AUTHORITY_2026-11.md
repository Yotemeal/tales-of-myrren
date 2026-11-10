# Multiplayer boss authority — isolated foundation (November 2026)

## Status

This is **not live multiplayer boss combat**. The current Cloudflare Worker
serves assets, and the optional in-app room only exchanges presence. Local
single-player fights and rewards on main remain exactly as before.

The optional src/boss-encounter.mjs module is a server-only building block.
It has **no route**, **no Worker import**, **no database binding**, **no client
message handler**, and **no effect on production**. Do not treat an emitted
entitlement as coins or equipment already granted.

## Implemented in the isolated core

- One boss life is identified by stable room, boss and unique spawn IDs.
- The boss owns HP; only the attack(sessionKey) method can damage it. No damage values,
  timestamps, player coordinates, levels or equipment fields are accepted
  from attack messages.
- Every attack resolves a current trusted server-side player snapshot via
  resolveVerifiedPlayer. Dead, unrecognized, wrong-room or invalid-stat
  combatants are rejected. Distance checks match live 22/30-pixel reach.
- A shared **900 ms cooldown keyed to account**, not to connection/session,
  prevents reconnection from doubling attack speed.
- Server RNG applies the existing hit formula and attack damage roll.
  Only effective damage is credited (overkill is never counted).
- Full leash recovery clears both HP damage credit and cooldown. A dead life
  cannot be revived or rerolled.
- On death, one original coin roll is split by qualified damage; the top
  contributor has the best sqrt-weighted rare chance, with the original
  combined 12%/14% rate conserved. Qualified players have one fixed combat XP
  entitlement. Duplicates remain possible on subsequent spawns.
- Every proposed award gets an idempotency key based on room, boss, spawn and
  verified account. The module **does not mutate save data or issue loot**.
- Versioned server-private export/restore round-trips boss HP, contribution
  credit, per-account cooldowns and already-rolled entitlements. Restoration
  rejects mismatched HP/credit, duplicated rows or altered rewards, and never
  rerolls a defeated spawn. No persistence backend has been wired yet.
- The regression suite compares actual boss values and payout rules against
  public/myrren-game.js; any future combat/balance divergence should fail CI.

## Durable room transactions and reward outbox (prototype only)

The isolated `src/boss-room-coordinator.mjs` adapter now uses a transaction-capable
store compatible with Cloudflare Durable Object storage KV `transaction()`.
Each successful hit loads the last committed boss state, applies verified
attack logic and persists a new private snapshot. The killing hit commits both
the terminal boss state **and a pending reward outbox** in one atomic
transaction. If commit fails, neither death nor award entries are persisted.

- Two concurrent attacks from the same verified account are serialized in
  the backing transaction and cannot bypass the 900 ms account cooldown.
- A new coordinator instance reads the same HP, cooldown and contributions.
- Pending reward entries remain available after restart or failed settlement.
  An internal payment worker may acknowledge each key with an external
  account receipt; replaying the same receipt is a no-op, and changing the
  receipt is rejected.
- No pending entry directly gives anyone a coin, item or XP. Cross-object
  account credit is a **separate authenticated idempotent transaction**.
  Crash-after-credit-before-ack requires the account ledger to reject the
  duplicate reward key, not merely the room to remember its acknowledgement.
- The coordinator intentionally will not replace the stored spawn ID.
  Respawns, state retirement, reset/AI loop and verified account service must
  be added and tested before a live integration.
- The committed fake storage tests verify transaction semantics, restart
  continuity, fatal-hit failure rollback and acknowledgement conflicts. They
  do **not** prove Cloudflare runtime, network latency or browser behaviour.

Cloudflare currently recommends SQLite-backed Durable Objects, with declarative
`exports` and a namespace binding in Wrangler. **No binding, class export,
storage namespace, new public API or deployment configuration was added**.
The live `src/worker.js` and `wrangler.jsonc` stay untouched.

## Private account settlement prototype

An additional isolated module, `src/boss-account-ledger.mjs`, now models an
account-owned transactional ledger for boss payouts. It consumes only a
server-provided pending outbox record, validates room/boss/spawn/account
identity and coin/XP/gear bounds, then atomically saves the credit and its
unique receipt. A duplicate delivery returns the original receipt and
**cannot credit coins or XP twice**. A mismatched replay is rejected.

Rare gear rolls select from the exact currently defined item IDs and material
pools in the real game; the regression test checks every eligible item against
the live game's `DEFS`. Duplicate equipment from separate boss spawns is
permitted. The prototype reserves 36 gear slots, followed by a bounded 128
item claim queue; if both are full, the whole payout remains pending rather
than silently discarding rare gear or issuing a false receipt.

A private `src/boss-reward-delivery.mjs` reconciler demonstrates the full
outbox-to-account-to-acknowledgement sequence. If an account credit commits
but the room acknowledgement fails, the item remains pending; retrying
returns the original account receipt without additional coins, XP or gear.
The reconciliation test simulates that exact crash window. Failed or
capacity-blocked awards remain pending for an authenticated service to retry.

This is a **test-only parallel account ledger**. It does not migrate or read
players' existing inventories, XP, cloud saves, real identities, bank chests or
equipment. No trade, claim UI, authoritative login, webhook, Durable Object
namespace or integration with the current live game has been deployed.
A future trusted delivery worker must source entitlements directly from the
private room outbox, call the authenticated account ledger, then acknowledge
the room receipt. It must not accept reward records sent by players.

## Trusted movement foundation (isolated)

The server-only `src/server-player-positions.mjs` now maintains authoritative
per-account positions for a room. A trusted session resolver supplies the
account ID, and a trusted character resolver supplies combat attributes.
Players can send **direction only**, never coordinates, equipment, level,
speed, damage or client timestamps. Server elapsed time caps movement at
90 pixels/second and 100 milliseconds per input; small collision steps avoid
jumping through thin obstacles. A reconnect retains the server position.

The module has versioned private export/restore and can provide the
`resolveVerifiedPlayer(sessionKey)` callback needed by
`ServerBossEncounter`. Its regression test covers spoof rejection,
collision, diagonal normalization, capped idle catch-up, disconnected session
identity, dead/indoor movement, restart integrity and actual boss attack reach.

**Important:** This is an isolated building block and does not yet use
production world colliders, authenticated accounts, Durable Object storage,
network messages or server NPC movement. The browser's current movement
controls remain unchanged; no gameplay deployment has occurred.

## Free Linux local testing / future runner setup

From the repository root on a Linux PC with Node.js 22 or later:

    bash scripts/test-boss-offline.sh

This executes JavaScript syntax checks and the boss, account, room and
movement regressions locally, without consuming GitHub-hosted Actions minutes.
The `Myrren-Linux` Fedora self-hosted runner is installed as a
systemd service and has successfully completed the boss, atomic room,
reconnection and mainline regression suites on the earlier draft commits.
The new server-side Supabase identity and command-gateway tests need an
additional passing run before this draft branch can be considered verified.

The dedicated workflow uses `runs-on: [self-hosted, Linux, X64]`;
work-in-progress documentation-only commits may use `[skip ci]`, but any
review or production release must have an unskipped, successful final
verification. Self-hosted runner execution does not consume GitHub-hosted
Actions minutes. A runner automatically executes queued jobs; it does **not**
independently write or push new code. Cloudflare deployment remains a separate
controlled production step.

## Server-owned boss AI (isolated prototype)

`src/server-boss-behavior.mjs` introduces a deterministic server-ticked
behaviour state machine for Cave and Aether bears, with their pursuit speeds,
aggro ranges, attack intervals, warning durations and warning radii checked
against the existing live monster definitions.

It selects trusted room players, moves no faster than the server elapsed-time
limit (100 ms maximum simulation step), respects a server collision callback,
and returns to the original spawn after disengaging. Telegraphs freeze the
boss's attack origin; a player who dodges outside the warning circle before
its deadline is excluded from the strike event. Every strike and completed
leash reset has a unique monotonic event key per boss life. Private state
including pending warnings, next attack time and counters can be restored
without rerolling earlier attacks.

**Not wired to production yet.** Strike events do not change player health;
a future server-owned health authority must resolve damage and armour.
The final shared-room transaction must update boss AI, boss HP/contributions,
player HP, movement and event outbox atomically. Spawns and respawns must
also be coordinated with persisted life IDs. The live solo monster AI and
combat UI are unchanged.

## Private authenticated combat event recovery

The isolated `src/server-room-events.mjs` feed is now owned by
`ServerBossRoom` and persisted **inside the same room transaction** as
boss AI, player HP and fatal-hit reward entitlements. Each committed warning,
strike, leash reset and boss defeat gets a monotonic room event sequence.
Reconnects can query `updates(sessionKey, afterSequence)` to replay missed
events without repeating already-acknowledged events; the read-only
`snapshot(sessionKey)` includes the current sequence for initial sync.

- The server verifies the session and that its account has joined the room
  *before* disclosing any updates.
- Strike notifications show each recipient **only their own** damage and
  remaining HP. Other accounts' IDs, health, session keys and private
  reward rolls are never included in the public response.
- History is bounded to 96 events and paged 40 at a time. A cursor older than
  the retained history returns `resyncRequired`; clients must fetch a new
  authoritative snapshot, not silently assume a complete history.
- A failed atomic tick leaves **both** the player health and public event feed
  unchanged. This is checked using a simulated commit failure before lethal
  damage. The room state uses schema 2; there is no production schema-1 data
  migration because these modules have never been deployed.

**Still private and not deployed:** A future authenticated WebSocket/SSE
handler must poll/subscribe to the feed, preserve each client's cursor,
reconcile snapshots after network gaps, and enforce actual Cloudflare room
transactions and per-account storage. No new live game UI or network route
has been changed.

## Supabase account authentication boundary (isolated)

The existing game already supports Supabase sign-in and user-owned cloud
saves. That is useful for identifying a player but **does not authenticate
their combat stats or carried items**: `player_saves.save_data` is currently
client-writable. It must never determine multiplayer damage, equipment,
coins, HP or combat XP.

`src/server-supabase-auth.mjs` provides a server-only identity verifier for
the project's Supabase Auth JWTs. It checks issuer, audience, role, UUID
subject, expiry and issued-at/not-before constraints. For ES256/RS256 tokens
it fetches the project's fixed JWKS URL and verifies the signature with
WebCrypto, refreshing the public keys at most every five minutes. For legacy
HS256 it **does not** accept the JWT payload at face value: it requests the
authenticated `/auth/v1/user` endpoint with a publishable API key on every
verification, then compares verified user ID with the signed token subject.
Network failures and invalid JWTs fail closed. No JWT secret, service-role
key or private authentication key belongs in the browser or repository.

`src/server-boss-command-gateway.mjs` implements a strict request
allowlist: `join`, `snapshot`, `move(dx,dy)`, `attack` and
`updates(afterSequence)`. A trusted server session is passed from
the verified user account to the room. Browser-supplied character stats,
positions, attack damage, timestamps, payout receipts, room identity, boss
spawns and tick/award/admin actions are rejected. The standalone HTTP
adapter accepts only small same-origin-style JSON POST commands and masks
private service exceptions. It is deliberately **not imported by
`src/worker.js`**, so it does not publish a new live API yet.

Regression tests generate synthetic signed RSA and P-256 JWTs and check
signature tampering, key rotation, claims expiry and legacy token validation.
They also check forbidden commands, body size limits, no CORS by default
and that unauthorized clients cannot create or mutate a boss room.

**Production blockers:** implement a Cloudflare SQLite-backed Durable Object
namespace and persistent account character records; wire a server-owned
character profile/level/equipment store; verify the Supabase project signing
mode; add session rate limiting and actual authenticated network transport;
and test two signed-in players end to end. Never trust the current
Supabase client-uploaded save as the server's authoritative character.

## SQLite-backed Cloudflare room preview (isolated)

`src/server-trusted-characters.mjs` now defines a separate private character
roster. After Supabase Auth has cryptographically verified an account, its
first `join` transaction creates a **fixed level-one unarmed starter**.
No existing browser-uploaded `player_saves.save_data` is imported as a
combat profile. Records validate room/account identity and stat limits. A
joining user's starter record and shared boss/player state are committed in
one storage transaction; failed commits roll back both.

`src/server-boss-durable-service.mjs` adapts Cloudflare Durable Object
`ctx.storage.transaction(tx => ...)` to `ServerBossRoom`. Each request
loads the trusted roster *inside that same transaction*, exposes read-only
stats to synchronous hit/movement callbacks and discards the snapshot
afterwards. The authenticated command gateway supplies a **server-minted,
private** session key per request. Only `join` can provision a starter.
Other commands cannot create accounts or inject character changes.

The experimental entrypoint
`src/multiplayer-preview-worker.mjs` and its **separate**
`wrangler.multiplayer-preview.jsonc` configuration define a SQLite-backed
`MyrrenBossPreviewRoom` Durable Object. It uses a single fixed server arena,
a preview-only `/preview/boss` route, Supabase token verification, and
100 ms server-owned AI alarm ticks that stop after 15 seconds without a
valid command. The real game's `src/worker.js` and `wrangler.jsonc`
are **unchanged**, so the isolated preview cannot deploy over the game.
Cloudflare recommends declaring new namespaces with
`exports.<class> = { type: "durable-object", storage: "sqlite" }`.

To run in a future *separate* private preview environment, configure
`SUPABASE_PROJECT_URL` and `SUPABASE_PUBLISHABLE_KEY` in Cloudflare
for the preview Worker and independently review the access policy, then
use the preview Wrangler configuration. **No preview has been deployed**
and no live routes have been created by this work. Never supply a
Supabase service-role key or JWT signing secret.

The test suite covers two authenticated accounts, default character
provisioning, forged XP/gear rejection, shared movement and HP after a
simulated Durable Object restart, a rolled-back lethal strike that must
not persist damage/events, and cross-account event privacy. Another
static contract protects production Worker routing and binding isolation.

**Remaining before real multiplayer:** global server-authoritative character
progression, equipment and general inventory (boss rewards are now in a
private account-specific preview ledger); full world colliders;
cross-room character consistency; secure per-user rate limits; proper
respawn and boss life scheduling; reliable WebSocket/SSE subscriptions;
end-to-end tests using the real Cloudflare runtime and two Supabase
accounts; safe staged deployment and rollback. The preview arena uses
deliberately simplified collision geometry and a level-one test roster.

## Global account reward persistence (isolated preview)

The private preview now declares a **second** SQLite-backed Durable Object,
`MyrrenAccountPreview` under the `ACCOUNT_RECORDS` namespace. A globally
stable Supabase UUID is its Durable Object name, so rewards from different
boss arenas reach one account. The DO exposes internal Cloudflare RPC methods
only; **there is no public account-reward HTTP route**.

`src/server-global-account.mjs` reuses the existing validated
`BossAccountRewardLedger` for global account coins, combat XP, rare items
and an overflow queue. The per-account ledger and receipt are committed in
one transaction. Legitimate identical rare drops from different boss
spawn IDs are retained as duplicates. Concurrent or repeated delivery of the
**same** room event key credits that award once.

The preview boss room's private alarm reconciles its committed outbox using
`deliverBossOutbox`: write the account receipt, then acknowledge the room
award. Cloudflare Durable Objects cannot share a single transaction across
two separate objects; this **idempotent outbox/receipt protocol** safely
retries a crash or network interruption between commits. When the room is
idle, unfinished awards retry at a slower cadence. The test suite simulates
separate rooms and accounts, account transaction failure, an acknowledgement
crash, replay, concurrent retries, fake account IDs and item duplication
rules.

**Important limitations:** This adds globally owned *boss reward balances*,
not yet globally owned character combat levels, equipment loadouts, skills
or all inventory items. Existing preview room profiles are still isolated
level-one starters. Credited combat XP and rare gear do not yet change the
room's trusted combat stats, and are never copied into live player saves.
There is no deployed account store, no public balance request, and no
migration from client-controlled Supabase saves. The actual Cloudflare
preview and dual-DO reconciliation still require staging tests before
any production integration.

## Required before production multiplayer

1. **Authentication and character authority.** Replace the optional presence
   room with a real authenticated session service. Account identity, current
   equipment, level, combat stats, death state and position must be loaded and
   validated by the server. Do not use presence for authority and do not accept
   browser-submitted battle outcomes or XP totals.
2. **Movement/collision and world authority.** A trusted room simulation must
   own player coordinates, movement speed, obstacles, monster position,
   attack telegraphs, target selection, aggression, leash and respawn timers.
   The current isolated room prototype models boss movement, enemy attacks
   and player death, but **has not been wired to live authenticated multiplayer**.
3. **Durable shared rooms.** The isolated SQLite-backed preview Worker now
   has a Durable Object binding and persists boss/player state transactionally.
   It is **not deployed or wired to the live game**. Production still needs
   validated world geometry, spawn lifecycle, global account records,
   rate limits and live-runtime integration tests.
4. **Atomic persistent rewards.** At boss death, persist an authoritative
   entitlement ledger and apply each reward once in a transaction keyed by its
   stable reward key. The gear roll must select an existing real item from the
   approved material pool; coins/XP/items must use one trusted account
   persistence path across reconnects. Retry failed writes idempotently.
   Client-side save data and export codes are **not trusted accounting**
   for multiplayer assets.
5. **Client read-only synchronization.** Stream authenticated snapshots and
   award receipts. Disable local boss damage/payout only for bosses that the
   connected server explicitly owns. Preserve offline solo behaviour and
   current mobile controls; never pay once locally and again server-side.
6. **Deployment gates.** Node tests, integration tests with two authenticated
   players, duplicate websocket events, reconnection and server restart,
   latency/reach exploits, offline fallback, save compatibility, UI/mobile
   verification, and a staged rollout. No direct merge/deploy before those
   checks.

## Verification

From the repository root:

    node tests/server-boss-encounter.test.cjs
    node tests/boss-room-coordinator.test.cjs
    node tests/boss-account-ledger.test.cjs
    node tests/boss-contribution-loot.test.cjs

The new test uses the existing headless game harness for parity, plus
multi-session simulation for shared HP and credit. It is **not** a real
network or browser test.
