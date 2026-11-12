# Tales of Myrren — Complete asset production order

**Working direction:** original clean pixel art, native source files with reliable manifests, stable game IDs and real gameplay verification. **This is a production tracker, not a claim that listed assets are finished.**

## Status labels

- **LIVE:** explicitly verified from `main` and the real game's loader.
- **DRAFT:** an isolated original PNG implementation exists in a draft PR but has **not** been approved or integrated.
- **FOUNDATION:** working architecture / sprite layer support exists, but not all visual artwork is approved.
- **NOT STARTED:** no complete verified source sprites or integration.
- **AUDIT REQUIRED:** some code/graphics may exist; inspect Work's and main's assets before drawing replacements.

## Priority queue — build assets in this order

| Priority | Asset family | Production scope | Current status | Acceptance / blocker |
|---|---|---|---|---|
| 0 — preserve | **Original Kez V2 character** | 21×27, four directions, existing states | **LIVE** base PNG; Work PR #78 renderer **FOUNDATION** | Preserve original bare torso, hair, dark shorts; no redesign or blue tunic |
| 1 — first new art | **Starter ground** | 56 native 16×16 tiles: grass, path edges, ruined stone, gravel, water, corrupted grass | **DRAFT PR #83** | Pixel-perfect path/water edge continuity; actual Kez desktop/mobile shots; art signoff before live loader |
| 2 | **Camp and starter interactables** | Traveller Gus + horse/cart, campfire, odd jobs board, bank/storage chest, open forge, anvil, furnace, lanterns, supplies | **AUDIT REQUIRED**; several currently drawn in code | Original transparent PNG layers, stable anchors; zero economy/save/interaction modifications |
| 3 | **Core harvesting resources** | 5 trees (Bramblewood, Alder, Ironbark, Elderthorn, Starroot); 8 ores (Copper, Tin, Iron, Coal, Black Iron, Obsidianite, Myrrenite, Meteorite) | Current original source PNGs **LIVE**; 2 tree + 2 ore replacements **DRAFT PR #82** | Full native sprite size, wind animation, stump/regrowth, depletion; verify yield/XP unchanged; Starsteel comes from Meteorite |
| 4 | **Starting combat enemies** | Forest Rat Lv1, Cave Goblin Gatherer Lv5, Wild Boar Lv8, Dire Wolf Lv12 | **AUDIT REQUIRED** | Real alpha animations (idle/walk/attack/hurt/death), four directions where needed; no invisible hitboxes |
| 5 | **Fishing & water feedback** | 5 types `spot1`–`spot5`, ripples/splashes, shore reeds, fish silhouette poses | **DRAFT PR #81** original PNG | All normal visuals image-based after art approval; maintain catches, bait, XP, equipment and spot positions |
| 6 | **Advanced monsters and boss** | Cave Goblin Protector Lv16, Cave Guardian Lv18, Forest Troll Lv22, Jewelheart Guardian Lv30 | **AUDIT REQUIRED** | Precise attack tells, damage/loot unaffected; boss star jewel appearance, solo/group visibility |
| 7 | **Passive wildlife** | Deer, rabbit, squirrel, raven, fox | **AUDIT REQUIRED** | Idle, roam/flee animations, correct creature scale and no AI behaviour changes |
| 8 | **Skilling pets** | Timber Glider, Geode Mole, River Otter, existing forging metal pet | **AUDIT REQUIRED** | Respect small size, skill-specific interaction, save ID; replace terrapin visual for approved River Otter only after explicit migration review |
| 9 | **World expansion** | Ancient ruined-city props, northeast goblin mining entrance, damaged **usable** southern river bridge, corrupted Direwood trees/roots | **DESIGN DRAFT PR #80** | A saved-position/collision map migration plan; `main` does not contain the southern river/bridge |
| 10 — hold | **Final equipment visuals** | Bronze, Iron, Steel, Black Iron, Obsidianite, Myrrenite, Starsteel armour, shields, swords, gloves/boots | **FOUNDATION PR #78**, final skins **PAUSED** | Resume only after user approves final armour visual direction; no body resizing or art churn |
| 11 | **UI/VFX finish** | Item icons, pickups, XP and coins, hit splashes, boss tells, skill animations | **PARTIALLY LIVE / AUDIT REQUIRED** | Preserve compact transparent rounded HUD and on-screen playability |

**All source images must be original.** Inspiration may include the readability/pacing of Curse of Aros, but do not import or trace its copyrighted assets.

## Every sprite-sheet delivery must include

A native source **PNG or exact atlas**, a stable machine-readable manifest, transparent pixel validation if the sprite is an overlay (ground tiles may be opaque), exact direction/animation/anchor mapping and desktop/mobile screenshots **from the real game**. A high-resolution AI concept image is not an atlas. An offline Python source generator is acceptable when it writes exact pixel-image assets ahead of time; drawing procedural shapes in the shipping game is not a replacement for completed sprites.

For a character or enemy: verify **idle / move / attack / hurt / death**, directional consistency and no clipping. For trees and ores: verify **available / depleted / respawn** and no changing mechanics. For scenery: verify **collision and walkable paths** while preserving saves.

## GitHub branch boundaries

- [PR #78](https://github.com/Yotemeal/tales-of-myrren/pull/78): technical Kez equipment foundation; **pause final armour art**.
- [PR #77](https://github.com/Yotemeal/tales-of-myrren/pull/77): existing world-scale lab; do not duplicate.
- [PR #80](https://github.com/Yotemeal/tales-of-myrren/pull/80): starter-region concept and geometry contract, no world migration.
- [PR #81](https://github.com/Yotemeal/tales-of-myrren/pull/81): fishing PNG proof, awaiting visual approval.
- [PR #82](https://github.com/Yotemeal/tales-of-myrren/pull/82): two native trees and two starter ore PNGs, awaiting visual approval.
- [PR #83](https://github.com/Yotemeal/tales-of-myrren/pull/83): native ground atlas, awaiting visual approval.

**No experimental PR should be merged automatically**; artwork/signoff and production gameplay regressions are separate release gates.

## Next concrete build after V1 tile approval

Create one consistent **Crater Camp essentials sprite-sheet pack** from the actual existing sizes: the odd jobs board, bank chest, anvil, furnace, rest/campfire and Trader Gus's horse/cart. First compare the existing in-game screenshot and reference compositions, then produce native PNG sprites with anchors and appropriate animations. Keep props' interaction triggers exactly where they are; the camp itself is not ready for coordinate migration.
