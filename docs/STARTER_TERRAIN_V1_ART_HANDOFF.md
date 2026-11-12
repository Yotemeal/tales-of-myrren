# Tales of Myrren — Native Terrain V1 (ART REVIEW ONLY)

**Game:** `Yotemeal/tales-of-myrren` · **Baseline:** 16×16 world tile, original Kez V2 21×27.  
**Status:** New visual asset. **NOT integrated in the live game; no art approval is implied.**

## Why the ground is first

All future Crater Camp paths, Bramblewood woodland objects, ancient ruins, goblin mines and Direwood should share a consistent native-pixel ground palette. The Kez base sprite and PR #78 equipment architecture are *not* being redesigned. The terrain is the first *new* foundational asset to settle before building the rest of the environment.

## Source files

- `public/assets/terrain/starter_terrain_v1.png`: real, lossless PNG atlas, **128×112** px, 56 tiles.
- `public/assets/terrain/starter_terrain_v1.json`: full names, indices and directional mask metadata.
- `tests/starter-terrain-v1.test.py`: image dimension, cell count, alpha and junction checks.
- `tests/starter-terrain-v1-browser.test.cjs`: actual-browser, test-only game art substitution. **No production JS changes.**
- The downloadable Work handoff ZIP also contains `author_terrain.py`, the fully reproducible offline pixel-art authoring script, the 56-tile labelled preview and a tile-only composition. Never use the larger preview as an engine atlas.

All tiles are fully opaque native pixels. To keep the game asset small, the PNG uses a **lossless indexed palette**. The browser decodes the exact same RGBA pixel colours.

## Atlas rows (8 columns)

| Row | Tile indices | Purpose |
|---|---|---|
| 0 | 0–7 | Forest grass variants |
| 1 | 8–11, 12–15 | Worn dirt variants, ancient ruin paving |
| 2 | 16–19, 20–21, 22–23 | Water, corrupted grass and gravel |
| 3–4 | 24–39 | All 16 grass-to-dirt path connector masks |
| 5–6 | 40–55 | All 16 water and grass bank connector masks |

Bit-mask mapping: **N=1, E=2, S=4, W=8**, each corresponding to a neighbouring tile using the same category. `0` is isolated, `15` is fully surrounded/interior. A mask 15 tile **must never leave small green checkerboard holes** in road or water interiors. Connected exits keep a full-width central road/water connection, while disconnected sides receive only a subtle 1–3px grassy fringe. This avoids narrowing existing game paths and prevents the checkerboard holes observed in the first art draft.

Grid metadata maps `tileId` to pixel source origin by `sx=(index % 8)*16`, `sy=Math.floor(index / 8)*16`.

## Implementation requirements (only AFTER visual approval)

1. Add a dedicated source image preload and error telemetry to the existing `MyrrenEnvironment.terrain()` renderer, not a duplicate world generator.
2. Select a real PNG cell; draw with integer placement and `ctx.imageSmoothingEnabled=false`. Do **not** rebuild terrain via runtime rectangle/ellipse painting.
3. Preserve the existing `MyrrenWorld.pathKind`, `waterDistance`, `inWater`, `craterWall` and save/spawn coordinates, including 1600×1600 world size. The southern river and broken usable bridge are **NOT present in the current live map** and are a separate migration.
4. Path masks should derive from existing neighbouring path classifications; water masks should derive from the existing water field. Do not make image colour authoritative for collision.
5. Compare existing and proposed terrain under real Kez, same camera position, desktop 1100×700 and 390×844 mobile in Chromium. Ensure no new asset causes lost mobile input focus or hides interactive objects.
6. Test saves, combat, mining six-yield release, fishing, forging and equipment UI after making the actual renderer integration.
7. Leave existing resource art experiments PR #82 and fishing PR #81 independent; Work's equipment foundation PR #78 remains paused for final armour visual approval.

**New asset progression after approval:** camp/service props and ruined foundations; all five approved trees and all mining sources; riverbank/fishing and broken bridge; monster and wildlife source sheets; then final approved armour skins. Don't generate new Kez body art.

## QA proof semantics

The CI screenshots are from the **actual browser game renderer**, but the new PNG rendering is injected into the fetched `myrren-environment.js` response *inside the QA browser only*. This is not a production feature flag or a live-game merge. Any comparison that has visible current tree or collision overlays should remain labelled and reviewed as such.

**Do not merge this draft PR automatically.**
