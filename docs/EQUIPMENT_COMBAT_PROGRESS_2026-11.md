# Equipment power and boss pacing audit — November 2026

## Intent

This is a conservative balance pass over the existing seven sword and armour
tiers in Tales of Myrren. It does not redesign the combat system, overwrite
saved equipment, change crafting/ore costs or add bosses.

The baseline combat formulas remain:

```text
Player attack interval: 0.9 seconds
Player chance to hit: clamp(0.55 + (combatLevel - enemyDefence)*0.03
                            + attackBonus*0.01, 0.25, 0.95)
Player hit: uniform integer from 1 through
            (2 + floor(combatLevel/4) + attackBonus)
Armour damage reduction: min(0.45, 0.5*defence/(defence+70))
Enemy chance to hit: clamp(0.75 + (enemyLevel-combatLevel)*0.008
                           - defence*0.0012, 0.35, 0.9)
Enemy hit: uniform integer from 1 through enemy.max
           (with armour reduction and a minimum of 1 on a successful hit)
```

These rules produce meaningful accuracy and damage progression from swords
while armour reduces **both** the chance of taking a hit and the resulting
damage. Boss warning circles are avoidable; the mathematical benchmark
below assumes a stationary character who never dodges, eats or disengages.

## Gear comparison

The six-piece armour set is helm, platebody, gloves, legs, boots and shield.
A same-tier sword adds attack but no defence. Rings and amulets are excluded
from this comparison, since they do not have seven full tiers.

| Equipment | Required Combat | Sword attack | Six-piece defence | Reduction from armour |
|---|---:|---:|---:|---:|
| Bronze | 1 | 1 | 13 | 7.8% |
| Iron | 10 | 3 | 26 | 13.5% |
| Steel | 20 | 6 | 47 | 20.1% |
| Black Iron | 30 | 12 | 75 | 25.9% |
| Obsidianite | 40 | 17 | 94 | 28.7% |
| Myrrenite | 55 | 22 | **118** (previously 110) | **31.4%** (previously 30.6%) |
| Starsteel | 70 | 30 | 145 | 33.7% |

Myrrenite previously improved expected Aether-bear damage taken by only
about **5.1%** against an Obsidianite six-piece set at Combat level 55.
Its rare ore and coal costs are substantially higher.

The improvement is now spread across all six Myrrenite armour pieces:

| Piece | Prior defence | Updated defence |
|---|---:|---:|
| Helm | 16 | 17 |
| Body | 32 | 34 |
| Gloves | 9 | 10 |
| Legs | 24 | 26 |
| Boots | 10 | 11 |
| Shield | 19 | 20 |

This raises the full set by **8 defence**, increasing the actual expected
damage reduction against Aether bear at level 55 to around **7.5%**
relative to Obsidianite. Starsteel then remains a worthwhile step:
at level 70, it gives about **8.6%** additional expected reduction
relative to Myrrenite. The increase is moderate and leaves the enemy's
health, damage, level, AI and loot untouched.

## Boss pacing

The test computes DPS and expected kill time from the *actual* enemy
definition, selected sword bonuses, player combat level and shared
900-millisecond player attack interval:

| Encounter | Player gear | Expected solo kill time |
|---|---|---:|
| Cave bear (150 HP), Combat 30 | Black Iron sword | ~29 seconds |
| Cave bear (150 HP), Combat 40 | Obsidianite sword | ~12 seconds |
| Aether bear (520 HP), Combat 55 | Myrrenite sword | ~65 seconds |
| Aether bear (520 HP), Combat 70 | Starsteel sword | ~21 seconds |

These are **stationary mathematical approximations**, not gameplay
measurements. Moving, misses, temporary boss telegraphs, resource
competition, latency, food consumption, target changes and cooperative
damage all change real completion times.

The current progression fits the intended design: a sufficiently equipped
Combat-30 player can attempt Cave bear but kills it much less efficiently
than a better-geared player, and Aether bear is difficult below its own
tier but remains soloable with high-level gear and smart play. Higher
gear should trivialise *some* obsolete basic monsters—this is expected
progression—but the same-tier bosses retain meaningful fight length.

## Compatibility and QA

- No sword attack changes, new damage multipliers, increased boss HP or
  defence curve rewrites.
- No save schema changes or migrations. Existing Myrrenite armour pieces
  receive their updated defence automatically, including duplicates.
- No changes to armour bar costs, material quantities, Smithing levels,
  XP, rare ore success chances, enemy XP, coins or drop tables.
- `tests/equipment-combat-progression.test.cjs` checks all seven real
  equipment definitions and level gates, defence contributions and
  actual damagePlayerFromMonster output, upgrade value at fixed combat
  levels and scenario-specific boss fight pacing. Other regression
  suites continue to protect crafting, player saves and renderer.

No manual physical-device boss playtest is claimed.
