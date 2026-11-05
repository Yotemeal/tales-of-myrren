# Elderwood environment overhaul

Replaces the environment drawing layer with a consistent, native-pixel woodland palette. Includes contiguous grass and quieter trails/plaza, water and slate shores, five resource tree types plus stumps, ancient strangler figs, six ore rocks, all village building facades, market props, well, job board, lanterns, fences, plants, crates/barrels/sacks, brook/bridge, waystone, and coordinated interior colours. Outer southeast woodland retains restrained green corruption. Character and creature art are preserved.

`public/myrren-environment.js` renders only. It has no storage, network, game-state or collision APIs. Static sprites cache by kind, variant and depleted state; water, smoke and fishing remain animated. The existing doorway positions, world boundary, water predicates, resource positions, level requirements, item IDs, stats and save format are retained. Occluding resource trees and the central waystone fade around the local character.

## Validation

- JavaScript syntax checks pass for the game, environment module and review page.
- Compared against main at 2454f5a7ebcc3163c3281e8fe473a8bd8a1c9a39: the entire simulation, input, save, inventory, economy, collision and world-generation source preceding the drawing section is byte-identical, excluding the added script loader.
- Frame loop and save bootstrapping after the rendering section are byte-identical.
- Character/V31/equipment, creature, combat animation and pet rendering source is byte-identical.
- Render harness covers all terrain coordinates, resource types/depleted states, shops, props, water and stable sprite caching, rejecting non-finite draw coordinates. Passed with over 790,000 drawing operations and 44 cached asset variants in the harness.
- Browser reviewed the actual game, scene previews and complete asset atlas; exercised four direction inputs, attack input and backpack, and reloaded the local game with saved name and inventory retained. No current renderer exceptions observed. This is an environment-art change, not a combat balancing change.
- Preview runs the same game source in an external script adapter because the local HTML preview transforms inline SVG strings. Production retains the original inline game structure.

## Review

`/environment-preview` shows village, ancient woodland and lakeside scenes plus the reusable asset atlas. It uses the production renderer and approved V31 feet atlas. The review does not load or write saved progress.
