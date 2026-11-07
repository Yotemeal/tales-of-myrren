# Mainline content development rules and Crater handoff (2026-11-07)

**Working branch:** `main`. **Reference only:** PR #24, `plan/crater-creatures-and-skilling-pets`. Do not replace `public/myrren-game.js` with the older Crater branch version: it predates Forging and Living Anvil.

## Work's implemented foundations (not all live)
- Approved creature registry: Forest Rat (1), Goblin Miner (5), Wild Boar (8), Dire Wolf (12), Goblin Guard (16), Cave Guardian (18), Forest Troll (22), Jewelheart Guardian (30).
- Passive wildlife: deer, rabbit, squirrel, raven, fox.
- Three skilling pets: Timber Glider (Forestry), Geode Mole (Delving), River Otter (Fishing). Preview movement controllers and precise summoned-only 3% XP accounting exist in `public/skilling-pets.js` on PR #24; they are not yet the normal-mode implementation.
- Goblin rock projectile simulation, dodge/collision checks, reference-frame fitting, and isolated Crater preview.
- Jewelheart contribution/encounter and reward modules; preview boss reward activation is deliberately disabled and unique drop rates are not final.
- Source art: six R1–R6 reference boards, 167 exact crops across 61 clips. These are not clean production atlases.

## Safe mainline work now
- Add new item and creature **design records**, dialogue, quests, area descriptions, crafting recipes and balance tables as standalone files with tests, without enabling unfinished Crater runtime code.
- Extend existing live systems in small isolated changes only, preserving Forging, equipment, Living Anvil, save load, inventory, and combat.
- Keep monster IDs, levels, reference art, existing approved pet identities, and boss reward rules aligned with PR #24. Avoid introducing duplicate implementations or alternate monster names.
- For any runtime change: test existing game paths and confirm no duplicate XP, damage, or loot grants; do not assert browser/mobile validation from unit tests alone.

## Still outstanding in PR #24
Production-transparent art cleanup, sprite anchors and missing directional poses; full creature AI/spawns; cave and arena layout; final boss encounter integration and numeric loot balance; complete mobile browser QA. Do not present preview systems as shipped.

## Next content-friendly milestones
1. Define stable item IDs, crafting materials, monster drop categories and level bands in a standalone design/data module.
2. Add tests for IDs and cross-reference them with existing live items and Work's approved monster roster.
3. Introduce small, separately switchable runtime content only after each set of tests passes.
4. Integrate Crater modules selectively when ready, retaining all newer mainline mechanics.
