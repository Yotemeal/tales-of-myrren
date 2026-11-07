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
