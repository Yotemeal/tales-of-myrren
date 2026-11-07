# Crater + Forging integration gate

Source: PR #24 (`plan/crater-creatures-and-skilling-pets`), target: `main`.
User approved integration of the entire crater project, including creature designs, encounters, loot, and three redesigned skilling pets.

## Confirmed blockers (2026-11-07)
- PR #24 currently reports `mergeable=false` and remains draft.
- Branches diverged; main contains Forging, Living Anvil, and its 3% equipped bonus/reaction, absent from the crater branch.
- Both branches modify `public/myrren-game.js`; blindly selecting either version would remove features.
- Crater PR explicitly identifies unfinished runtime asset crops, animation pivots/directions, wildlife/encounters, cave layout, and numeric balance. Do not claim these are complete.

## Integration requirements
1. Merge the two versions of `public/myrren-game.js` semantically: retain all six skills, smelting, equipment crafting, the Living Anvil, and the new three pet controllers and exact fractional XP bonus handling. Preserve save migrations and default/preview isolation.
2. Bring across all crater modules, supplied reference assets, tests, and documentation. Update `public/index.html` load order without disabling normal game mode.
3. Ensure pet bonuses are applied exactly once to matching skill XP only when following; ensure forging pet reactions occur only for successful production.
4. Run Forging, core save/inventory, pet, creature, boss reward, and combat regressions; run browser/mobile smoke tests before production activation.
5. Resolve conflicts and only merge after validation. No force pushes or overwriting either source branch.
