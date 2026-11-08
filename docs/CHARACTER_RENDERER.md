# Character renderer contract (Kez V2)

**Authoritative game entry point:** `public/index.html`. Cloudflare deploys `public/` from `wrangler.jsonc`. Root `index.html` is only a retirement notice; `backups/` stores the old game. Neither is a live entry point.

## Active pipeline

- `public/assets/kez-v2/kez_v2_atlas.png`: **84×162 PNG**, 4 columns × 6 rows, **21×27 native source-cell pixels**.
- `public/kez-v2-atlas.js`: single base-character draw path; native integer pixel sizes, feet at `(x,y)`; no 80% downsampling or transparent frame edge repair.
- `public/kez-v2-equipment.js`: compact worn equipment overlays. Slot order is **head, body, legs, boots, shield, gloves**. Material IDs remain **2 Bronze, 3 Iron, 4 Steel, 5 Black Iron, 7 Obsidianite, 6 Myrrenite, 8 Starsteel**. No new save IDs.
- `public/myrren-game.js`: `drawPerson` dispatches players and peers to `drawKezV2`; procedural drawing remains only for shopkeeper NPCs. Discontinued player-renderer functions were removed.
- `public/wardrobe-v5.js` continues to supply approved larger gear **inventory icons**. It is not the in-world character renderer.
- `public/forged-swords-v1.js` supplies approved sword art. Kez V2 holds the blade from the dominant hand at 60% tool draw scale; rear-facing weapons draw beneath the base character, and glove colour covers the grip.

**Idle direction:** A stopped player uses frame 0 of the row matching their last facing. Front portrait idle can use row 0 with `animateIdle=true`. The 6 rows are: idle, front, back, left, right, side attack. Up/down attacks retain their direction rather than snapping to a sideways slash. There are no dedicated up/down attack sprite rows in Kez V2 yet; tool motion handles those directions.

**Cosmetic dye:** Saved `dye` indices 0–3 tint high-tier enamel accents through the cached `colorsFor(materialId,dye)` function. Undyed equipment retains the approved seven-metal colours and all existing item IDs. The character portrait uses the same dye as gameplay.

**Missing image:** Never silently swap in the discontinued V31/approved/procedural player. A missing Kez V2 atlas must be visible as a loading/error issue; fix the asset path rather than changing sprite family.

## What still needs pixel-art approval

The native equipment overlays are a **small-scale fitting pass** with the seven approved metal colours. They do **not** contain literal converted frames from `smithing_armour_front_atlas.png`; that image contains front-facing **full-body references** and cannot be placed over walk/attack frames without separation and directional art. Do not claim the compact helmet, body, legs, glove, shield and boot shapes are the final approved artwork until checked in-game.

Before merging any revised armour art, verify: four directions (idle and move); front, side, rear and bare-handed attacks; shield behind the correct side-arm; sword hilt grip; head/neck seams; foot grounding; dye variants; 7 full metal sets and mixed pieces; character/world relative scale; 1× and 2× phone zoom; equipment portrait; save and multiplayer compatibility.

## Regression commands

```sh
node --check public/kez-v2-atlas.js
node --check public/kez-v2-equipment.js
node --check public/myrren-game.js
node tests/kez-v2-rendering.test.cjs
node tests/armour-progression.test.cjs
node tests/forging-skill.test.cjs
node tests/inventory-capacity.cjs
node tests/save-inventory.test.cjs
node tests/combat-kill-xp.test.cjs
```

`.github/workflows/kez-v2-regressions.yml` runs these on pull requests, the historical `@napi-rs/canvas` art tests, and a mobile Chromium playthrough. Its screenshot artifact includes all seven full armour tiers, four facing directions, attacks, and an equipment portrait.

**Release rule:** Do not merge renderer/asset changes straight into `main` without passing checks and inspecting the rendered gear on a real phone/browser. Preserve existing skill, combat, save, loot and NPC behaviour.
