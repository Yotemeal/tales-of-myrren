# Tales of Myrren — V3.2 full and collapsed depleted ore render
**Date:** 16 November 2026. User explicitly requested old ore assets **removed** and exhausted nodes represented as a **smaller broken-down variant of the same material**.

## Exact materials (save-compatible)
The current live ore assets `/assets/resources/v32/ore_{name}.png` are unchanged at 40×28 native RGBA. A second, manually composed PNG `ore_{name}_depleted.png` for each material uses its original stone and exposed mineral colours. The depleted silhouette is a small 13–15 pixel tall, ~30px wide rubble pile contained **within the same 40×28 transparent canvas**, retaining ground placement. This is not a faded/shrunk copy of the full rock, and not the rejected procedural old sprite.

## Behaviour
- Normal ore: full V3.2 sprite.
- On vein exhaustion: preloaded matching `ore_*_depleted.png`, not a procedural rock.
- On existing `n.back` timeout: full ore reappears.
- No changes to ore ID, mining yields, depletion/respawn timer, nodes, collision, skilling, forging, economy, equipment, saves, V19F hero, camera, or trees.
- If a PNG cannot be loaded, no retired procedural rock is drawn; check asset delivery rather than silently substituting rejected art.
- Gameplay and HTML versions are bumped to `window.MyrrenBuild=96`, `myrren-game.js?v=96` and `myrren-environment.js?v=16` to invalidate the cached old renderer on iPhone.

## Removed obsolete art
Retired eight original pre-V3.1 `public/assets/resources/ore_*.png`, all eight `public/assets/resources/v31/ore_*.png`, the obsolete V3.1 review page/manifest, and old V3.1 test files. These files remain recoverable through Git history, but are not shipped in the current public asset directory.

## Verification
`node --test tests/ore-v32-native.test.cjs tests/ore-v32-depleted.test.cjs` validates approved full-ore SHA locks, eight distinct small rubble PNG SHA locks, renderer material mapping and three state/URL contracts, no legacy fallbacks, unchanged world anchor, and matching build versions. `node tests/ore-v32-depleted-browser.cjs` loads all 8 depleted variants in real headless Chromium along with V19F and saves a screenshot.

The polished high-resolution approval sheet is a visual reference only: the production sprites are the locked native V3.2 art. The tree art remains unchanged pending its separate review.
