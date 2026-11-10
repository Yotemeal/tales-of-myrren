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

This is a **test-only parallel account ledger**. It does not migrate or read
players' existing inventories, XP, cloud saves, real identities, bank chests or
equipment. No trade, claim UI, authoritative login, webhook, Durable Object
namespace or integration with the current live game has been deployed.
A future trusted delivery worker must source entitlements directly from the
private room outbox, call the authenticated account ledger, then acknowledge
the room receipt. It must not accept reward records sent by players.

## Required before production multiplayer

1. **Authentication and character authority.** Replace the optional presence
   room with a real authenticated session service. Account identity, current
   equipment, level, combat stats, death state and position must be loaded and
   validated by the server. Do not use presence for authority and do not accept
   browser-submitted battle outcomes or XP totals.
2. **Movement/collision and world authority.** A trusted room simulation must
   own player coordinates, movement speed, obstacles, monster position,
   attack telegraphs, target selection, aggression, leash and respawn timers.
   The current foundation fixes one spawn position for reach checks; it does
   **not yet implement boss movement, enemy attacks or player death**.
3. **Durable shared rooms.** Configure a Cloudflare Durable Object binding and
   persistent room/boss state with serial attack processing and globally
   unique spawn IDs. The module now provides a validated private state
   serializer/restore path, but **nothing calls it or durably stores it yet**;
   in-memory instances alone lose state on Worker restart.
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
