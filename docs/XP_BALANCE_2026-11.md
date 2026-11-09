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
- **Smithing (superseded):** The November 9 balancing pass initially
  increased XP for ingots and used a 1.5x per-bar forging multiplier.
  Following a comparison with Curse of Aros on November 10, this has
  been replaced with smaller bar rewards and tier-specific anvil XP;
  see the updated Smithing section below.
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
original XP thresholds, cooking reward ratios, Aros-informed Smithing
reward ratios and elite kill XP. Real playtesting should measure time to
unlock tiers, bank-trip friction, depletion frequency, food/bait supply and
solo/co-op boss fight duration before a second tuning pass.

## Smithing rework — November 10, 2026

The [Curse of Aros Smithing wiki](https://curseofaros.wiki/wiki/Smithing)
shows low XP from smelting bars relative to forging finished equipment:

| Aros metal | Smelt one bar | Forge a sword | Bars per sword |
|---|---:|---:|---:|
| Bronze | 3 XP | 20 XP | 4 |
| Iron | 8 XP | 56 XP | 4 |
| Steel | 14 XP | 100 XP | 5 |

Aros level thresholds are 768 XP at level 10 and 16,982 at level 30,
according to [its XP table](https://curseofaros.wiki/wiki/XP). Myrren's
thresholds at those levels are 1,154 and 14,353 respectively. The games
therefore have broadly comparable *early/mid-level XP thresholds*, but
Myrren's smithing awards before this correction were around four times
the Aros examples. We should not directly copy every Aros reward: Myrren
uses different metal tiers, ingredients, item costs and late-game systems.

### Myrren reward comparison

XP amounts listed are before any applicable Smithing pet bonus.
The equipment column uses a four-ingot sword in Myrren.

| Metal | Old bar XP | New bar XP | Old sword XP | New sword XP | Anvil share of total chain |
|---|---:|---:|---:|---:|---:|
| Bronze | 14 | 4 | 84 | 28 | 64% |
| Iron | 35 | 10 | 210 | 76 | 66% |
| Steel | 65 | 18 | 390 | 140 | 66% |
| Black Iron | 160 | 35 | 960 | 480 | 77% |
| Obsidianite | 350 | 60 | 2,100 | 900 | 79% |
| Myrrenite | 700 | 100 | 4,200 | 2,200 | 85% |
| Starsteel | 1,150 | 240 | 6,900 | 6,000 | 86% |

The formula for a finished piece is `barsRequired * forgeXpPerBar`,
where `forgeXpPerBar` is set independently for each metal tier. Smelting
rewards follow `SMELT[].xp`. This prevents a formula that accidentally
inflates furnace rewards when equipment XP is rebalanced.

At the first three tiers, a complete ore-to-sword sequence yields 44
(bronze), 116 (iron), or 212 (steel) XP in Myrren. For the equivalent
Aros recipes the totals are 32, 88, and 170 XP. Those differences reflect
our slightly different XP thresholds and, for steel, different bar counts.

The correction is deliberately more substantial than a simple XP shift:
the previous reward totals were high even for completed items. High-level
materials remain slower and rarer to acquire; we do not copy Aros's
unusually large rewards for special materials or items that cost far
more bars or require different boss resources.

### Invariants to preserve

- The 1–100 level thresholds and all previously saved XP are unchanged.
- The `forging` save key is unchanged; the screen continues to say Smithing.
- Material and equipment requirements, duplicate crafting, loot economics,
  per-action durations (1.5s smelt; 2.5s forge), pet bonuses and level-up
  presentation remain unchanged.
- Batch sizes (1 / 5 / 10 / All) use the same XP per created item as a single
  craft; no repeated-input or multi-craft multiplier is introduced.
- XP/hour benchmarking of the furnace alone is *not* a measure of complete
  Smithing progression: ore acquisition, travel, banking, pack slots and
  anvil availability constrain actual rates.
