# Forging merge readiness

Status: **NOT YET VERIFIED FOR MERGE**. This branch changes live runtime logic but is not deployed.

## Implemented
- Sixth skill registered in the game UI, with save normalization for old saves.
- Smelting and forging award Forging XP instead of Delving XP.
- Crafting requirements staggered across seven metal tiers.
- Initial XP: smelting = existing recipe XP; equipment = 2 × smelt XP × ingots consumed.
- Static contract test added at tests/forging-skill.test.cjs.

## Critical balancing finding
The current level-100 XP curve requires **249,604,271 XP**. Starsteel body armour currently gives **12,000 XP per item** (6 ingots × 1,000 smelt XP × 2), requiring roughly 20,000 high-tier items for late-game progression. A 35-hour Forging target would require approximately 1,981 sustained XP/second averaged over the entire journey, including production, banking and interruptions. The current runtime uses instant button clicks for smelting and forging; no action timer or production throughput cap is enforced. Therefore the 35-hour target is **not established**, and click-spam throughput could distort both progression and economy.

## Before marking ready for review
- Run `node --check public/myrren-game.js` and `node tests/forging-skill.test.cjs`, plus all repository README regression checks.
- Browser test new character and old saved character, including save/export/import and skill panel.
- Verify level requirements and material consumption for all seven tiers and all equipment kinds.
- Add timed production or another measured throughput control, then calibrate XP and resources to 35 EHP.
- Audit NPC buying/selling and item production for coin-profit and inflation exploits.
- Confirm late-game training from 79 to 100 remains achievable.
- Inspect UI for mobile and desktop.

Do not merge or deploy until these checks pass.

## Follow-up implementation and verification status (2026-11-07)
- Added 1.5-second smelting and 2.5-second equipment forging cooldowns to prevent rapid input duplication. Cooldown starts only after validation succeeds.
- Added GitHub Actions workflow at `.github/workflows/forging-checks.yml`, running JavaScript syntax, Forging behavior and existing inventory/save/bank regression tests.
- Extended `tests/forging-skill.test.cjs` to execute isolated production functions and assert XP allocation, cooldowns, level locks and resource consumption.
- GitHub API returned **zero workflow runs and zero commit statuses** at the time of inspection. Do not interpret this as a passing test result.
- XP thresholds calculated from runtime: level 70 = 3,253,985; level 78 = 10,602,570; level 90 = 60,554,361; level 100 = 249,604,271.
- At 12,000 XP per Starsteel body, 2.5-second forging cooldown alone gives a theoretical 14.4-hour lower bound from zero XP, excluding gathering, smelting, travel, banking, unlocks and failed actions. This does NOT establish the 35 EHP target.
- The PR must remain draft until checks run successfully and browser save/import/economy checks complete.

## Verified CI and first progression calculation (2026-11-07)
GitHub Actions run **42363759799** for commit `39fc894` completed successfully. Its JavaScript syntax, Forging regression contracts, and core save/inventory regression steps all passed.

An optimistic tier-by-tier simulation (unlimited purchased ingots, best 6-ingot body recipe available at each tier's base level, no banking or travel, 2.5s per craft) estimates only **14.63 hours** to level 100. This is a *lower bound*, not a playable route: body recipes actually require tier base +8, and materials are finite. The final Starsteel segment dominates (~14.26h).

Important: the original 35 EHP target cannot be claimed from the current XP/cooldown parameters. Do not set an arbitrary longer click cooldown without assessing gameplay feel. Consider production batches, crafting durations and bank/ingot supply, then benchmark a valid unlock-by-unlock route. Separate purchasing (efficient EHP) from self-mining (Delving + Forging combined hours).

A browser smoke test and real saved-character migration are still needed; successful CI is not a substitute.
