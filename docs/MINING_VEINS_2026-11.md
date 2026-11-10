# Mining vein and pickaxe progression — November 2026

## Why this changed

The old Delving loop exhausted every rock after one successful swing, then forced players to switch nodes. That felt much more frustrating than the sustained gathering experience the game is aiming for.

The Curse of Aros community wiki documents one-button automatic mining, successive tool speed upgrades (1.75 seconds for Bronze down to 0.75 seconds for endgame Ancient), 3-second starter ore respawns, mining pets and equipment XP bonuses. It does **not** specify verified successful-yield counts per vein. Our new vein charges are an original Myrren balancing decision, not a copied CoA drop table.

References:
- https://curseofaros.wiki/wiki/Mining
- https://curseofaros.wiki/wiki/Rocky

## Implemented game rules

A rock only loses durability when an ore is actually obtained. Every successful gather still awards **one** ore, its original XP and the existing pet roll. Failed attempts do not consume charges or force target reselection. The action continues automatically until the vein is exhausted, then uses the previous per-tier respawn duration. It replenishes on the next successful gather after its cooldown.

| Ore | Successful gathers before depletion | Base chance | Respawn | Delving XP/ore |
| --- | ---: | ---: | ---: | ---: |
| Copper | 6 | 42% | 6–10s | 18 |
| Tin | 6 | 42% | 6–10s | 18 |
| Iron | 5 | 26% | 9–14s | 45 |
| Coal | 5 | 26% | 11–17s | 75 |
| Black Iron | 4 | 15% | 16–24s | 190 |
| Obsidianite | 3 | 12% | 19–29s | 300 |
| Myrrenite | 3 | 10% | 22–33s | 650 |
| Meteorite | 2 | 8% | 28–42s | 900 |

These are base success chances at the unlock level before pickaxe-material and skill-level bonuses. Copper/tin improve from 32% to 42%; iron/coal improve from 20% to 26%. Higher-tier base rates remain untouched.

## Pickaxe progression

| Existing pickaxe | Mining interval |
| --- | ---: |
| Bronze | 1.8s |
| Iron | 1.65s |
| Steel | 1.5s |
| Black Iron | 1.35s |
| Myrrenite | 1.2s |

Mining tool upgrades now have a meaningful speed benefit, on top of their existing ore-chance bonus. The current game has these five pickaxe tiers; no fictitious Starsteel or Obsidianite pickaxe was added.

## Compatibility and economy

- Unchanged: tier unlocks, XP per ore, smelting/forging recipes, ore counts on the map, bag capacity, respawn durations, Forestry/Fishing and player-save schema.
- Vein charges are temporary world-node state and are **not** saved to player progress. Reloading the game resets rock charges. In eventual authenticated multiplayer, each vein must instead be managed by a shared server resource state, not a browser-owned counter.
- More ore per rock increases material supply and Delving XP/hour. This is intentional for early progression; rare ores still retain low success chances and fewer yields. Ideal stationary Delving XP can briefly be about 2.4–2.45× the slowest gathering skill at level 55/70 unlock gaps; the existing cross-skill balance guard remains 2.2× at all other tested milestones, and actual ore throughput is lower after depletion and banking. Measure sustained gathering and ore-to-bar economics before any further boosts.
- The live game must not change until tests on the Linux runner pass and the implementation is merged/released.

## Testing

The source branch is evaluated with Node runtime mining, save compatibility,
world generation, progression balance, canonical delivery and mobile/browser
regressions before a release. Success counts and tool speeds are deliberately
Myrren-specific; the CoA guide is a reference for feel rather than mechanics.


- `tests/mining-feedback-respawn.test.cjs`: complete six-success copper vein, failure preservation, item/XP parity, real faster pickaxe, cooldown/reset, tooltips and visuals.
- `tests/skilling-loop-audit.test.cjs`: vein-aware single-node supply model and faster tool actions.
- `tests/xp-progression-balance.test.cjs`: upgraded pickaxe intervals in cross-skill fairness benchmark.
- `tests/rare-resource-routes.test.cjs`: verifies rare meteorite placement and controlled two-yield supply.

Release gate: the self-hosted Linux runner must pass the full Combat balance, Mainline integrity, Kez V2 renderer and Forging regression workflows at the final commit SHA before merging the mining branch.
