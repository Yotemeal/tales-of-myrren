# Combat audit — 2026-11-09

Status: audit only; no live combat tuning or integration.

## Verified from main/public/myrren-game.js
- Seven regular monsters: slime (1/5 HP), goblin (5/10), boar (8/14), wolf (12/20), bear (22/42), cave bear (40/150), aether bear (70/520).
- Enemy max hit is recalculated from hpAt(monster level) and MR, not just the initial MT.max constants.
- Player HP: 10 + round(level * 1.5 + level^2 / 40).
- Defence reduction: min(0.45, 0.5 * defence / (defence + 70)).
- Player hit chance: clamp(0.55 + (combatLevel - monsterDefence) * 0.03 + attackBonus * 0.01, 0.25, 0.95).
- Successful damage: uniform integer from 1 through 2 + floor(combatLevel / 4) + attackBonus.
- Directional swing: begins with a 110 ms pending strike; target action attacks every 1.6 seconds. Verify SWING_IV before comparing DPS.
- Combat kill XP: max(1, round(monsterHP * monsterXPM)); awarded once by killMon.
- killMon pays local player directly. This is not a verified authoritative multiplayer boss reward system.
- Seven sword tier Combat requirements: 1, 10, 20, 30, 40, 55, 70; bonuses 1, 3, 6, 12, 17, 22, 30.

## Risks / proposed checks
1. Compare directional vs targeted attack sustained DPS at each equipment tier; ensure hit frequency is consistent and that the directional swing does not hit multiple enemies unintentionally without an explicit cleave design.
2. Check enemy damage and effective HP across levels and gear tiers, including defence diminishing returns, food use and equipment durability.
3. Simulate time-to-kill and XP/hour for legal enemy progression routes; measure respawn, travel and downtime before adjusting values.
4. Verify death/return reset, overkill, multiple hits on the same tick, XP once per kill, and no reward on an invalid kill.
5. Keep shared boss contribution, XP, coin budgets and rare rolls in an authoritative dedicated path. Do not reuse local killMon payouts for multiplayer bosses.
6. Preserve saved equipment IDs, Combat unlocks and attack timing when replacing visual sprites; do not let V4 animation frames change damage resolution.
7. Compare boss design targets against actual server implementation and test solo/group kill times with fixed RNG seeds.

## Safety
Do not merge old balance/250-ehp-launch-skills directly: on audit it was 369 commits behind main and 23 ahead. Port changes selectively with tests. This audit intentionally changes no gameplay code.
