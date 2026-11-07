# Launch progression balance — proposal v1

Status: design and calibration targets only. No live XP or reward rates changed.

## Target
Five launch skills total **250 efficient hours to max**, measured using sustainable best-available methods and including ordinary banking, travel and respawn downtime.

| Skill | EHP |
| --- | ---: |
| Combat (melee) | 65 |
| Forestry (woodcutting) | 45 |
| Delving (mining) | 50 |
| Fishing | 45 |
| Cooking | 45 |
| **Total** | **250** |

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
