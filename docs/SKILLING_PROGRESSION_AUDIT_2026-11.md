# Skilling progression and gameplay-flow audit — November 2026

## Scope and confidence

This audit reads the shipped resource, XP, equipment, cooking, inventory and
Smithing tables, then exercises input logic in
`tests/skilling-loop-audit.test.cjs`. It covers milestones **1, 10, 20, 30,
40, 55, 60, 70, 85, 95 and 100**.

This is an automated **model**, not observed gameplay XP/hour. A proper
playtest must still measure player travel, intermittent gathering, repeated
resource selection, banking, competing players, equipment acquisition and
bait purchases.

## Progression anchors

- Level 10: 1,154 XP; level 30: 14,353 XP; level 70: 3,253,985 XP.
- Level 85: 29,454,989 XP; level 95: 123,460,189 XP.
- **Level 100: 249,604,271 XP.** The final 85–100 stretch accounts for
  220,149,282 XP. There are no new gathering tiers after the current last
  resource unlocks, so late levels mainly represent longer mastery goals.
- Milestone rewards and Smithing rates remain **unchanged** in this PR.
  Immediately changing XP again from an unconstrained single-node benchmark
  risks overcorrecting an economy limited by travel and materials.

### What rate calculations actually mean

For a node at the player's current skill level and best accessible tool:

```text
chance = clamp(base + (skillLevel - nodeRequirement) * 0.025
               + max(0, toolMaterial - 2) * 0.06, 0.05, 0.92)
attemptTime = 1.8 seconds for Mining and Forestry,
              3.3 seconds in sustained Fishing (2.4 action + 0.9 recast)
idealSuccessfulActionsPerHour = 3600 * chance / attemptTime
optimisticSingleNodeActionsPerHour =
    3600 / (attemptTime / chance
            + depletionChance * averageRespawnSeconds)
XP/hour = successfulActionsPerHour * XP per successful gather
```

The first rate assumes instant access to an inexhaustible fresh node. The
second rate assumes *one node*, waited on perfectly (no bank/travel/interaction
time), with average respawns. These are **upper-bound reference models**,
not minimum or maximum guaranteed player rates. The playable forest, mine
and lake contain several finite resource nodes with real spacing.

Example at level 1 using base equipment:

- A Tree (25 XP/log, 34% success, 50% depletion, 10–16s regrowth) gives
  about **17,000 XP/hour** only if the resource could never deplete, versus
  roughly **7,600 XP/hour** when waiting on one replenishing tree.
- Copper (18 XP/ore, 32% success, always depletes, 6–10s recharge) gives
  about **11,500 XP/hour** without depletion, versus **4,800 XP/hour**
  when repeatedly working the same rock.
- A shallow fishing spot (28 XP/catch, 38% success, 20% depletion,
  8–14s recharge) gives about **11,600 XP/hour** without depletion, versus
  **9,300 XP/hour** on one spot.

Even those single-node figures omit walking and the player's time spent
restarting each gathering action after a depletion. A better calibrated
real-play target requires recorded sessions on a mobile device.

## Inventory and supply-chain checks

The backpack holds **36 slots**: each stackable resource type uses one
slot, whereas finished equipment occupies one slot *per item*. Coins do
not occupy a slot. Coal pouch and banknote rules have separate existing tests.

Each completed four-bar sword requires the following gathered ingredients,
assuming all ores are transformed into ingots:

| Tier | Ore needed for one sword | Smithing XP: smelting + forging |
|---|---|---:|
| Bronze | 4 copper, 4 tin | 16 + 28 = 44 |
| Iron | 8 iron | 40 + 76 = 116 |
| Steel | 8 iron, 4 coal | 72 + 140 = 212 |
| Black Iron | 12 Black Iron ore, 8 coal | 140 + 480 = 620 |
| Obsidianite | 12 Obsidianite chunks, 8 coal | 240 + 900 = 1,140 |
| Myrrenite | 16 Myrrenite ore, 12 coal | 400 + 2,200 = 2,600 |
| Starsteel | 12 meteorite fragments, 16 coal | 960 + 6,000 = 6,960 |

The resource unlock for every required ore is no higher than its bar's
Smithing unlock. All seven finished-item chains are testable with existing
resources; no additional resource or save migration is needed.

There are currently **four meteorite deposits** and **six Myrrenwood trees**.
Late-game resource scarcity should be assessed with travel and cooldowns
before changing XP again. Fishing catches require bait when using a rod,
including when fishing in shallow water with a rod instead of a net.
Cooking consumes one raw fish per attempt, awards XP on success only, and
uses its own 1.5-second per-item timer.

## Corrected interaction problem

When several resources occupy the character's interaction cone, the action
button previously selected the closest undepleted node **even if it could
not be gathered**. For example, a locked iron deposit could repeatedly
intercept Mining while an accessible copper rock was in the same reach.

The new selector prefers the closest **currently harvestable** resource:
correct skill level, equipped and usable tool, available bait where needed,
and enough inventory space. The nearest blocked node is retained as
a fallback when none are harvestable so the existing explanatory warning
("need higher level", "equip tool", "need bait", "pack full") still appears.

**Resource tapping remains exactly inspection-only**: tree, fishing spot
and ore show their name and skill requirement, nothing else.

## Follow-up priorities

1. Manually record actual resource routes and bank trips on iPhone at
   levels 1, 30, 55, 70 and 85; log XP per 15 minutes and the fraction
   spent moving/waiting, rather than tuning using modelled maxima.
2. Use these timings to decide whether a better gathering path or nearby
   resource placement is warranted. Avoid further broad XP changes until
   the bottleneck is identified.
3. Audit late-game ingredient availability for full equipment sets, rather
   than only an individual sword, before adding another tier.
