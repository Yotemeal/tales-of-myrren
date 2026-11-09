# XP balance — November 2026

## Intent

Keep the existing 1–100 XP curve, save keys, item requirements, combat timing and
resources unchanged. Balance the *rewards per successful action* so Forestry,
Delving and Fishing have similar practical training choices throughout the
currently implemented level bands. Rare materials should still be valuable,
not made common by boosting their gather chance.

The table below is **theoretical XP/hour** for the best available gathering
node at each level, based on the current tool unlock, success chance and action
interval. It assumes uninterrupted station time with unlimited nodes, no
respawn/depletion, no inventory or bait constraints, no travel and no buffs.

| Skill level | Forestry | Delving | Fishing |
|---|---:|---:|---:|
| 1 | 17k | 12k | 12k |
| 30 | 92k | 103k | 60k |
| 55 | 221k | 405k | 303k |
| 70 | 603k | 852k | 474k |
| 85 | 1.29m | 1.25m | 1.21m |

**Do not present those figures as observed gameplay XP/hour.** In actual play,
nodes deplete, tools and bait have costs, characters travel and players bank.
These numbers compare *reward scales*, not complete progression speed.

## Changes

- **Forestry:** Improve oak, maple, elderwood and Myrrenwood XP. At level 70,
  Forestry's modeled best rate rises from 441k to 603k XP/hour.
- **Delving:** Reduce the most lucrative Black Iron, Obsidianite, Myrrenite
  and meteorite XP awards. At level 70, modeled best rate drops from 1.18m
  to 852k XP/hour, without increasing ore supply.
- **Fishing:** Improve XP on catches beyond shrimp to reward rod training and
  bait usage. At level 70, the best modeled rate rises from 261k to
  474k XP/hour.
- **Cooking:** Increase XP per successful cooked fish. Failure probabilities
  and raw-fish requirements are unchanged, so this remains supply-limited.
- **Smithing:** Increase XP for ingots, reduce the forging multiplier
  from 2.0 to 1.5, yielding approximately 40% of ore-to-gear XP at the
  furnace and 60% at the anvil. The *whole chain* changes by under 6%;
  1.5s bar timing and 2.5s equipment timing remain unchanged.
- **Combat:** Keep all five regular monster kill rewards. The Cave bear now
  awards 1,050 XP rather than 4,500 and the Aether bear 3,120 rather than
  114,400. These encounters remain worth doing for loot and their unique
  mechanics, not as XP exploits.

## Safeguards and future evaluation

Existing XP and skill levels are unaffected because the XP threshold table and
`save.xp` format did not change. Reward payouts for actions performed after
this change use the new values. Boss coins, unique drops and loot tables are
unmodified.

`tests/xp-progression-balance.test.cjs` checks the ten milestone bands,
original XP thresholds, cooking reward ratios, smithing material-to-gear
reward budgets and elite kill XP. Real playtesting should measure time to
unlock tiers, bank-trip friction, depletion frequency, food/bait supply and
solo/co-op boss fight duration before a second tuning pass.
