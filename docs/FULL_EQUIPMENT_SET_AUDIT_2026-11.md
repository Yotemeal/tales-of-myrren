# Full equipment-set progression and material audit — November 2026

## Scope

Every full melee armour kit in Tales of Myrren contains a **helm, body,
gloves, legs, boots and shield**. These six recipes cost 28 bars in total,
using the exact production rules in `FORGE`. An optional sword adds 4 bars
(32 total). The tools remain separate and are not miscounted as armour.

| Metal tier | Six-piece bars | Raw resource budget for 28 bars | Smithing level to finish set, before → after |
|---|---:|---|---:|
| Bronze | 28 | 28 copper + 28 tin | 9 → 9 |
| Iron | 28 | 56 iron | 18 → 18 |
| Steel | 28 | 56 iron + 28 coal | 28 → 28 |
| Black Iron | 28 | 84 cobalt + 56 coal | 38 → 38 |
| Obsidianite | 28 | 84 obsidianite + 56 coal | 48 → 46 |
| Myrrenite | 28 | 112 aether + 84 coal | 63 → 59 |
| Starsteel | 28 | 84 meteorite + 112 coal | 78 → 73 |

These are **from-scratch** requirements. A player's owned equipment,
carried bars, banked bars and stored ores reduce what must still be made
or gathered. The game now calculates that difference in the anvil's
collapsed **Set materials** planner. There is also an optional
**Add sword** comparison.

## The real late-game blocker: Smithing unlock spacing

The original extra recipe unlock offsets were reasonable at lower levels,
but the game's XP curve grows exponentially near high levels. For example:

| Goal | Previously required XP after bar unlock | Now required XP |
|---|---:|---:|
| Obsidianite body, Smithing 40 → 48 / 46 | 87,676 | 55,731 |
| Myrrenite body, Smithing 55 → 63 / 59 | 794,987 | 282,168 |
| Starsteel body, Smithing 70 → 78 / 73 | 7,348,585 | 1,819,110 |

The complete Starsteel set awards only **48,720 Smithing XP** for its
28 bars and six finished pieces. Under the old gate, reaching the last
piece from the bar unlock required XP equivalent to producing roughly
151 complete sets. The resulting equipment-production grind was far
larger than the six recipes themselves suggested.

The updated extra-level ceiling is 8 for basic tiers, 6 for
Obsidianite, 4 for Myrrenite and 3 for Starsteel. It compresses the
late Smithing recipe unlocks **only**. The existing item combat-level
requirements, individual recipe costs, ingredients, XP awards and
character XP curve are unchanged. Previously crafted gear and saved
levels remain valid.

A player must still gather the rare ingredients and level Smithing:
the full Starsteel set requires level 73 Smithing (and level 70 Combat
to equip its armour), not an instant craft at level 70.

## Existing rare-material supply

The world currently has four meteorite deposits (one on the
south-western trail), seven aether deposits and sixteen coal nodes.
The production loop is intentionally supply-limited:

- Starsteel armour: 84 meteorite fragments and 112 coal.
- Myrrenite armour: 112 aether ore and 84 coal.
- Black Iron armour: 84 cobalt ore and 56 coal.

Those totals are substantial, but a reduction to ore recipes would
also increase the amount of rare gear and affect the game's economy.
No resource count, ore chance, respawn time, node location, smelting
recipe or gear bar cost is modified in this pass.

The most meaningful follow-up is measuring the actual time required
for a player to earn **28 crafted bars and six useful items**, including
mining, banking, moving between stations and interrupted batches.
Idealized single-node XP/hour is not a substitute for those sessions.

## In-game planner

The anvil retains its regular single-recipe batch interface. The
new compact *Set materials* details element is collapsed by default
and provides:

- Armour + shield or optional sword comparison.
- Pieces already owned in equipment slots, pack, bank or banknotes.
- Bars still required for pieces the player does not own.
- Bars available in pack/bank and the net number remaining to smelt.
- Required raw materials minus amounts in pack, bank or banknotes.
- Relevant Smithing gate, and total XP for making the entire set.

Banked and noted items **do not** automatically supply the workstations;
players must withdraw or unnote them first. The planner is read-only,
does not mutate saves or items and never automatically crafts a set.
Crafting still proceeds one item at a time through the regular
1 / 5 / 10 / All queue.

## Verification

`tests/full-set-smithing-plan.test.cjs` checks all seven recipe
budgets and tier requirements, equipped/bag/bank/noted ownership,
resource deductions, collapsed anvil UI and a real 28-bar Starsteel
smelting queue followed by each of the six equipment crafting queues.
It verifies exact XP, ingredient consumption, backpack placement and
save compatibility. Existing Mining, Forestry, Fishing, Cooking,
combat and Smithing tests remain in CI.

No physical-device usability test is claimed.
