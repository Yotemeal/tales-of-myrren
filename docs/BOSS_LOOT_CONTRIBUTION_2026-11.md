# Boss contribution, coins and loot — November 2026

## What actually works in the deployed game

The current game is served as static assets through a Cloudflare Worker. Its
optional multiplayer room sends **position, name, equipment, animation and
appearance presence**; it does **not** share authoritative enemy HP or damage,
and the presence data can originate from a player's browser.

Consequently, group contribution rewards **cannot yet be granted securely
across clients**. We must not pretend other players are fighting the same
server-owned Cave bear or Aether bear. Do not use presence, nearby-player lists,
a client-submitted "damage" message or level ranking to award shared drops.

In the live game, both bears now explicitly use the boss reward core when a
local player kills their own monster. Every local effective damage hit is
recorded on the monster, and the record is cleared on respawn or full leash
recovery. A solo kill receives the boss's normal **guaranteed coin roll**, one
fixed Combat XP award, and its existing chance of an equipment reward.
Duplicates are allowed; they are placed in the backpack if it has room.

- Cave bear: **30–70 guaranteed coins**, 1,050 Combat XP and **12%** chance
  of one eligible steel/Black Iron equipment drop.
- Aether bear: **120–260 guaranteed coins**, 3,120 Combat XP and **14%** chance
  of one eligible Black Iron/Myrrenite equipment drop.
- Non-boss monsters keep their existing XP, coins, food and gear behavior.
- Inventory-full handling does not destroy a player's coins or XP, and does
  not create unbounded overflow items. Gear that cannot fit is still lost,
  with the existing clear warning.

There is no special "first kill" restriction or duplicate item prevention,
including for self-found/Ironman-style play.

## Contribution algorithm prepared for an authoritative boss service

`recordBossContribution(monster, playerId, damage)` counts only **effective**
positive damage, never more than the monster's **remaining HP**, and never a
miss, Infinity, NaN, negative damage or a hit on a dead monster.

`resolveBossRewards(bossDefinition, verifiedLedger, oneCoinRoll, random)`
is a pure, deterministic (given random stream) distribution routine.
It is included and tested today but currently operates **only on the local
player's damage ledger**.

An authoritative future implementation should:

1. Own one monster instance, HP, respawns and damage events for all players.
2. Check combat reach, timing, equipment, level, death state, hit/damage roll
   and the player's eligibility server-side.
3. Accumulate each player's actual *effective* HP damage over one boss life.
4. Qualify meaningful contributors at **5% of maximum boss HP**, with a
   one-player solo exception. A minimal 1-hit tag therefore cannot leech
   rare boss loot or guaranteed coins from a group.
5. Roll the original boss coin range **once** and divide that fixed total
   between qualified players, in proportion to verified damage. The
   largest-remainder allocation prevents coin rounding inflation; every
   eligible player has a positive allocation under current boss ranges.
6. Give every qualified contributor **one independent rare-gear roll**.
   Use weights of `sqrt(effectiveDamage)`: the largest damage contributor
   gets the largest individual chance, while lower contributors retain a
   meaningful (but smaller) chance. Scale the weights so all player drop
   chances **sum to the original 12% or 14% per-boss probability**. The
   expected number of rare items per boss remains unchanged when group
   size increases; multiple rare items are technically possible.
7. Issue the saved coins, XP and item rolls once from the trusted authority
   with an idempotent boss-spawn/recipient reward key. The frontend should
   only show the result; no trusted loot rights can originate in a client.

For a two-person Cave bear kill with **118 versus 30** effective damage
(plus an ineligible 2-point tag), the leader earns more coins and a larger
personal rare-gear chance. Both eligible participants receive coins, and
their two rare-gear probabilities still add up to **12%**, not 24%.

The group fairness resolver deliberately **does not** yet distribute XP
to other clients or transfer items between clients, because that would
require securely shared combat and account ownership. The local player's
original fixed kill XP is retained. The future server must decide and
implement group XP eligibility alongside item credit, rather than using
unverified client-side credit.

## Tests and compatibility

`tests/boss-contribution-loot.test.cjs` checks:
- pure group allocation, ranking, deterministic ties and duplicate IDs;
- conservation of coins and the original item probability budget;
- rejection of negative/invalid damage and trivial tag leeching;
- overkill accounting, one-time local solo reward, respawn state resets;
- preservation of duplicate boss gear and ordinary-monster rewards;
- unchanged save schema (combat ledger remains temporary).

No new database migration, storage key, saved reward object or public API is
introduced. A future implementation must define and test authenticated,
idempotent, server-driven boss combat before enabling cross-player payout.
