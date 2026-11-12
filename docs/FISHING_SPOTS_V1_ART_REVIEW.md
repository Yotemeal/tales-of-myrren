# Fishing spot V1 — native PNG for visual review

**Artwork prepared, not approved or integrated.** This branch contributes a real PNG asset and metadata. It does NOT load it in the live game.

## Files

- `public/assets/fishing/fishing_spots_v1.png` — original native RGBA sprite sheet, **128×120 pixels**.
- `public/assets/fishing/fishing_spots_v1.json` — stable row mapping and anchor.
- `tests/fishing-sprites-v1.test.py` — confirms all twenty 32×24 cells contain valid transparent, uncropped, distinct art.
- `scripts/preview-fishing-spots-v1.py` — builds a labelled nearest-neighbour visual review image and animated GIF; background in preview is **not** part of source art.
- The branch GitHub Actions artifact contains the committed PNG and review media.

## Format and animation mapping

5 rows, 4 frames per row. Read only the correct cell, from `x = frame * 32`, `y = row * 24`.

| Row | Gameplay node | Level | Appearance |
|---:|---|---:|---|
| 0 | spot1 | 1 | Three pale minnows and subtle ripples |
| 1 | spot2 | 12 | Blue-grey trout near the surface |
| 2 | spot3 | 25 | Warm, salmon-coloured fish shadows |
| 3 | spot4 | 40 | Two streamlined tuna shapes |
| 4 | spot5 | 70 | Animated curved violet-grey aether eel |

Cell size: **32×24** world pixels. Display at **32×24**, integer destination only, `ctx.imageSmoothingEnabled = false`; source draw should be `ctx.drawImage(image, frame*32, row*24, 32, 24, destX, destY, 32, 24)`. Suggested animation pacing is 220 ms per frame. Suggested water-surface anchor is (16, 12) within every cell.

These sizes and designs are the first **review candidate**, not final art authorization. They match the game’s existing 16×16 world grid more closely than giant UI-like indicators.

## Work integration instructions — **wait for visual approval**

Once the user approves the artwork, Work should replace the *normal visual draw path only* in `MyrrenEnvironment.fishing()`. Keep fishing mechanics unchanged: spot positions, equipment checks, bait, levels, XP, drop rates, inventory rewards, depletion/respawn timers, multiplayer and saves. The app must load an image and select a frame; canvas rectangle/ellipse drawing must not recreate the artwork.

No dependency on the Kez V2 equipment renderer. Do not merge PR #78, PR #79, PR #80 or any other experiment as part of the fishing art.

Do not add `?fishing-proof` or make the PNG default-on until approved. After approval, test all 5 fishing types with desktop and mobile screenshots taken from actual gameplay; confirm tap targeting and existing action feedback work. If the asset fails to load after integration, log a visible diagnostic and preserve interactions instead of making spots unclickable.

## Visual QA rules

No opaque rectangular backgrounds or anti-aliased sprite pixels. Each of 20 frames has fully transparent borders, a stable cell origin and at least three distinct motion poses per type. Aether eel remains muted rather than neon. Current game river and bridge concepts are not in production; these sprites are intended to work over the existing lake too.

For the upstream environment audit, refer to [draft PR #80](https://github.com/Yotemeal/tales-of-myrren/pull/80). In particular its approved 21×27 bare Kez character is the fixed scale; do not resize Kez to fit art.

## Definition of completion

The source PNG and the row/column metadata are present in GitHub, independent tests pass, preview images are accessible, and no production game code changes. **Integration is a later, user-approved task.**
