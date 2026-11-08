# Authored character artwork contract (not yet integrated)

This replaces the **art pipeline**, not combat or the save format. The current
21×27 procedural Kez V2 remains the live visual until the assets below exist
and pass a real in-world visual review. Do not substitute recoloured wardrobe
icons, a resized 176×276 concept, or V4's experimental weapon animation.

## Native art and display
- Native cell: **32×48 transparent RGBA pixels**, nearest-neighbour rendering.
- Proposed world display: **24×36** at the existing foot anchor, pending
  side-by-side gameplay-scale approval. This is *not* a collision size change.
- Each atlas: **128×576** = four columns × twelve rows.
- Columns: 4 frames per pose. Rows (in order): front idle/walk/attack,
  back idle/walk/attack, left idle/walk/attack, right idle/walk/attack.
- Artwork is original Myrren art, inspired by the readability of Curse of Aros,
  not copied sprites. Maintain silhouette and gold/teal T-visor of approved
  Myrrenite, and seven distinct approved metal-tier looks.

## Files expected
`public/assets/authored-character/base.png` plus
`<material-id>-<slot>.png` for each existing material ID
`2,3,4,5,7,6,8` and slots `head,body,legs,boots,shield,gloves`.
This is 43 atlases total. Each transparent slot image contains *only* that
piece, positioned on the exact same foot anchor as the base for every pose.
Do not draw a second sword or baked-in white slash in body/armour frames.

## Rendering rules
- No procedural equipment approximations, no per-part independent scaling.
- Correct dominant hand and sword grip, independent shield in offhand.
- Side shields behind torso; front/back shields draw after armour for now,
  subject to review of hand occlusion in approved directional art.
- Attack frame and equipped sword timeline must be authored as a coordinated
  animation, not a spinning sword over a frozen body.
- Preserve existing gear indices, dyes, multiplayer state, hitboxes, movement,
  equipment inventory and save IDs.

## Current status and release gate
`public/authored-character-renderer.js` is an **isolated opt-in renderer**.
It is deliberately NOT referenced by `public/index.html` or `myrren-game.js`.
It refuses to draw until the base and all equipped slot images load with
the exact dimensions; no misleading fallback to blocky art.

First-pass **base character and six-piece Myrrenite atlases** are now generated
by `scripts/build-authored-myrrenite.py`, with source-cell tests and an actual
layered contact sheet published by GitHub Actions. These are **first-pass
hand-authored pixel shapes, not visually approved art**. They have not been
reviewed at 24×36 in the real game, and the sword animation remains separate.

Next: inspect the GitHub Actions contact sheet, refine any incorrect shapes,
then test in-world screenshots at 24×36 before producing the other six tiers. A full atlas requirement is
deliberate so an incomplete image cannot be treated as production-ready.

Run `node tests/authored-character-renderer.test.cjs`.
