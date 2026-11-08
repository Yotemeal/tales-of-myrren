# Character renderer contract (Kez V2)

**Authoritative game entry point:** `public/index.html`. Cloudflare deploys `public/` from `wrangler.jsonc`. Root `index.html` is only a retirement notice; `backups/` stores the old game. Neither is a live entry point.

## Active pipeline

- `public/assets/kez-v2/kez_v2_atlas.png`: **84×162 PNG**, 4 columns × 6 rows, **21×27 native source-cell pixels**.
- `public/kez-v2-atlas.js`: single base-character draw path; native integer pixel sizes, feet at `(x,y)`; no 80% downsampling or transparent frame edge repair.
- `public/kez-v2-equipment.js`: compact worn equipment overlays. Slot order is **head, body, legs, boots, shield, gloves**. Material IDs remain **2 Bronze, 3 Iron, 4 Steel, 5 Black Iron, 7 Obsidianite, 6 Myrrenite, 8 Starsteel**. No new save IDs.
- `public/myrren-game.js`: `drawPerson` dispatches players and peers to `drawKezV2`; procedural drawing remains only for shopkeeper NPCs. Discontinued player-renderer functions were removed.
- `public/wardrobe-v5.js` continues to supply approved larger gear **inventory icons**. It is not the in-world character renderer.
- `public/forged-swords-v1.js` supplies approved sword art. Kez V2 holds the blade from the dominant hand at 60% tool draw scale; rear-facing weapons draw beneath the base character, and glove colour covers the grip.

### Native sprite anatomy — do not upscale parts independently

All offsets are native **1-pixel units** relative to the planted feet at `(x,y)`. These have been checked against Kez V2's actual drawn silhouette (not the old 40px/64px character).

| Region | Native relative Y | Constraint |
|---|---:|---|
| Helmet crown | −26 to −21 | Keep the authored hairline visible on front/side poses |
| Face and eyes | approximately −14 to −12 | **Never draw chest, pauldrons or central helmet guards here** |
| Torso and pauldrons | −11 to −3 | Chest bottom meets the leg tops; the shoulders must not bob into the face |
| Gloves and sword grip | −8 to −4; grip at −7 | Dominant-hand sword and gloves use the same socket |
| Legs and boots | −5 to 0 | Feet remain planted even when the walking sprite moves |
| Offhand shield | −10 to −2 | A thin profile behind the side pose; wider shield on front/back |

Changing gear geometry requires running `node tests/kez-v2-rendering.test.cjs`, which checks face clearance and native bounds for all seven tiers, including walking frames. Screenshots of idle, attack, rear-facing weapons and dyes come from `tests/kez-v2-browser.test.cjs`.

**Idle direction:** A stopped player uses frame 0 of the row matching their last facing. Front portrait idle can use row 0 with `animateIdle=true`. The 6 rows are: idle, front, back, left, right, side attack. Up/down attacks retain their direction rather than snapping to a sideways slash. There are no dedicated up/down attack sprite rows in Kez V2 yet; tool motion handles those directions.

### Locked Myrrenite full-face helmet (material ID 6)

The latest **approved helmet close-up** supersedes the earlier open-visor Myrrenite artwork. It has a teal domed shell, tall gold central crest and jewel, gold horizontal brow, a deep-black horizontal eye opening, a black descending **T-shaped** central slit, and teal cheek plates with a central nose guard. The face is intentionally enclosed; **do not apply the open-face eye-clearance rule to Myrrenite**.

This helmet is implemented as **four independently authored 15×17 native-pixel masks** (front, right, mirrored left, rear) in `public/kez-v2-equipment.js` under `MYRRENITE_MASKS`. The rear is a solid teal shell with a gold central spine, not a face or false eyes. Rendering uses run-length grouped sprite pixels at the native 21×27 player scale, without resampling or altering the character atlas. Gold (`#efc653`) and the dark visor (`#060f18`) are locked even with an existing cosmetic dye equipped. All other six helmets and all combat statistics are unchanged.

Run `tests/kez-v2-rendering.test.cjs` to verify the crest, T visor, mirrored profile, rear and dye preservation. Chromium's `myrren-kez-v2-myrrenite-helmet.png` output is the in-game visual review. The supplied reference was an enlarged close-up, so small-scale pixel shapes are deliberately simplified for readability; do not describe the result as a pixel-for-pixel copy of the reference image.

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
