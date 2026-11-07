# Launch progression balance — proposal v1

Status: design and calibration targets only. No live XP or reward rates changed.

## Target
Six launch skills total **285 efficient hours to max**, measured using sustainable best-available methods and including ordinary banking, travel and respawn downtime.

| Skill | EHP |
| --- | ---: |
| Combat (melee) | 65 |
| Forestry (woodcutting) | 45 |
| Delving (mining) | 50 |
| Fishing | 45 |
| Cooking | 45 |
| Forging | 35 |
| **Total** | **285** |

These are budgets, not XP multipliers. Preserve existing saved XP, level thresholds and character saves until measured migration can be tested.

## Combat and rewards
- Combat XP only once per eligible creature kill; no XP per hit or overkill.
- Rank boss participants by valid total damage contributed, capped at actual remaining boss HP.
- Eligibility must prevent idle tagging and high-level griefing; test level-sensitive eligibility before enabling.
- First eligible contributor: weighted main loot and independent Guardian's Necklace (1/150) and Guardian's Ring (1/150) bonus rolls.
- Second eligible contributor: reduced ordinary loot, no jewellery rolls.
- Third eligible contributor: one ordinary main-table roll, no jewellery rolls.
- Others meeting participation threshold: XP and coins only.
- Each jewellery roll independent, duplicates unlimited, no pity or duplicate protection.
- Coins go directly to coin pouch; XP and coins show brief floating notifications.
- Physical items spawn as owned ground loot, collected via action tab. Private/public/despawn durations configurable; Ironman items never become public.

## Economy controls
- Fixed per-kill coin budget split across eligible contributors, not duplicated per participant.
- XP payout calibrated against training methods; bossing should not dominate efficient combat XP.
- Do not enable boss drops before inventory/ground-loot/ownership integrations and tests pass.

## Calibration tests to implement
1. Compute XP to max from the actual in-game XP table.
2. Simulate each sustainable training route, accounting for action speed, inventory, travel, success probability, gathering depletion, cooking inputs and downtime.
3. Verify fastest reasonable EHP per skill falls within +/-10% of its budget.
4. Simulate 100,000 boss kills with fixed RNG seeds: each first-place jewellery drop rate should converge to 1/150 within statistical tolerance; second/third never receive jewellery.
5. Verify total coins minted per kill never exceed the configured kill budget; all eligible players get correct XP notifications.
6. Test ownership expiry, action-tab pickup, full inventory, disconnected players, Ironman restrictions, item despawn, repeated pickup and save/reload.
7. Test equal damage ties, high-level carries, last-hit sniping, overkill, idle tagging, and group scaling.

## Before changing live XP
Record current cap and per-level XP table; record real action times and highest sustainable XP/h at every training tier. Apply smallest necessary rate changes, preserve saves, and rerun progression/economy regression tests.

## Forging (formerly proposed Smithing)
- Player-facing skill name: **Forging**; use **ingot**, not 'ignot'.
- Smelting ore into ingots grants low XP; crafting weapons and armour from ingots grants the majority of XP. Initial target: approximately 15% of XP from smelting and 85% from equipment production per comparable material quantity, subject to balance tests.
- Slow early levels due to low-tier recipe access and slow smelting; high-tier forging should be fast XP/hour once materials are ready.
- Buying ingots from players is the fast but expensive route; self-mining saves coins but adds significant Delving time. Do not count gathering time in Forging EHP; report combined self-sufficient time separately.
- Target ~35 efficient hours to max Forging with a steady supply of materials, pending real XP curve measurements. This is not a promise of affordable maxing.
- XP scales with recipe tier and ingot quantity, with diminishing opportunities for trivial low-tier recipe abuse. Avoid profitable unlimited vendor loops: compare input material market value, sale price, coin sinks and equipment demand.
- Never grant both smelting and crafting XP for the same action; award once upon successful completion and prevent inventory duplication or canceled-action XP.
- Add tests for per-recipe XP, material consumption, failure/cancel cases, skill requirements, buying-vs-mining time, coins per XP, and supply-driven inflation.
