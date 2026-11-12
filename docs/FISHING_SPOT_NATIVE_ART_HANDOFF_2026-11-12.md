# Tales of Myrren — fishing spot visual rebuild brief

**Status: design / native-art proposal, NOT APPROVED OR INTEGRATED.** No production code, fishing economy, node positions, collisions or sprites are changed by this document.

## Why fishing needs a separate asset pass

Current `public/myrren-game.js` calls `MyrrenEnvironment.fishing(ctx,n,x,y,now)`, defined in `public/myrren-environment.js`. It draws three small, coloured rectangular fish marks, concentric broken ripples and an occasional splash. The five types are currently variations on that procedure, **not individual authored transparent sprite sheets**.

The player prefers simple, clean, readable pixel art with a restrained Curse-of-Aros-like scale, but entirely original Myrren art. Repainting these same ripples using more canvas rectangles does not resolve the style mismatch.

The current game uses a lake for all 16 seeded fishing spots; the approved southern river and broken usable bridge remain **future map concepts**. Do not move any fishing spots as part of an art integration.

## Proposed first native asset — approval required

**A transparent, nearest-neighbour fishing cue atlas**, authored pixel by pixel at native resolution.

| Property | Initial proposal |
|---|---|
| File | `public/assets/fishing/fishing_spots_v1.png` |
| Native cell | 32×24 px |
| Arrangement | 4 animation frames across × 5 types down |
| Atlas size | 128×120 px |
| Anchor | Centre of water surface: (16,12) in cell |
| Frame timing | 150–250ms each, restrained looping movement |
| Draw size | Exactly 32×24 game pixels; avoid further fractional scaling |
| Required transparency | Native alpha, no antialiasing, 1px crisp boundaries |
| Source | Original, hand-authored pixel art — **do not crop or shrink concept posters** |

These are suggested dimensions for a **reference test**, not an approved or already implemented production specification. They should be compared with Kez's native 21×27 body at normal zoom first.

Suggested row mapping:

| Row | Existing node key | Required fishing level | Visual cue proposal |
|---|---|---:|---|
| 0 | `spot1` | 1 | Small, pale minnows beneath a low-contrast surface ripple |
| 1 | `spot2` | 12 | A slightly deeper bluish shoal, subtle dark water pocket |
| 2 | `spot3` | 25 | A readable trout-like silhouette and occasional single break in the surface |
| 3 | `spot4` | 40 | Two quick, streamlined fish shadows; no large particle ring |
| 4 | `spot5` | 70 | Distinct curved eel movement, muted violet water accents, never neon flooding |

The visible splash should be **a few pixels**, while the full 32×24 cell retains transparency so the game water stays visible. Separate decorative reeds belong to the shoreline world layer, not floating atop every fishing spot.

## Integration requirements — AFTER visual approval

1. Use the current `spot1`–`spot5` keys and position/visibility rules. Existing nodes are generated deterministically, and respawning a depleted spot must continue to work.
2. Preload the atlas in `MyrrenEnvironment` with a `load` and `error` fallback. Use the current procedural cue if the PNG is unavailable; do not make the resource disappear.
3. Draw the selected cell using integer destination coordinates and `imageSmoothingEnabled=false`. Frame advance only changes `sourceX`; water surface anchor remains stable.
4. Reuse the existing cast/hit feedback; do not layer an unrelated huge glowing UI marker above the water. Keep the existing tap/hover level label.
5. Preserve net vs rod requirements, bait checks, fishing level requirements, inventory capacity, XP, catch chances, depleted timer and save compatibility.
6. Provide actual Chromium screenshots from the current game, both portrait mobile and desktop, showing the water cue with Kez standing at a reachable shoreline. Include the existing cue beside the proposed new cue for comparison.
7. Verify spot1–spot5, node tip, cast animation, successful/failed feedback, depleted and respawn states, inventory award and mobile touch input.
8. Keep visual replacement in a separate PR from the southern river/bridge map migration. No geometry or hitbox changes.

## Files and references for Work

- **Current renderer:** `public/myrren-environment.js` → `fishing` function.
- **Interaction:** `public/myrren-game.js` → `drawSpot`, `nodeOK`, `readyToGather`, `facingNode`.
- **Existing level/table keys:** `spot1,spot2,spot3,spot4,spot5`; level requirements 1,12,25,40,70.
- **Visual evidence:** PR #80 GitHub Actions artifact `myrren-game-world-scale-real-chromium-not-approved`, which records desktop/mobile gameplay scenes of all five real fishing spots beside Kez.
- **Scale baseline:** Kez V2 21×27, native world tiles 16×16. Trees draw 144 world px, ore draws 17.28px (documented in PR #80) — do not inherit their scale mistakes.

## Definition of done

A proposed reference pixel sheet that is recognizable in normal gameplay, is **not** a redraw of an existing commercial game's sprites, retains alpha quality, has stable anchoring across all four frames and shows clear visual differences among five fishing categories.

**No default-on change until the user approves it.**
