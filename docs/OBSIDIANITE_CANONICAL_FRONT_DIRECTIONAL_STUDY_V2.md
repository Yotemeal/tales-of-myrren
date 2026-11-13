# Obsidianite — canonical front preserved, directional candidate V2

**13 November 2026 — review asset, NOT a production release.**

## What changed

The **original approved Obsidianite FRONT** is preserved pixel-for-pixel as a standalone transparent PNG. The original dimensions are **142×239** and SHA-256 is `1acec039f713f3d1e7bdb4c06c63f1f5bc287b3df506ec29d29cfc70b56149ea`. It has a full violet helmet and ornamental forehead gem; **the eyes are covered**, but a small square **skin-coloured lower-face opening** must remain visible. It is not a fully blacked-out visor and is not the exposed-eyes face of the first new concept.

A later Obsidianite concept illustration `a_crisp_detailed_pixel_art_game_sprite_reference.png` (SHA-256 `65383764dcbfe7dc9f1c87a754434ec569756f1282ac230bde9ae7945e4fda0d`) has newly illustrated right, back and left character poses with violet crown details, pointed shoulder armour and hanging side plates. Three transparent source-derived direction studies were cut from those images, **without creating any fake procedural armour pieces**. These are not yet acceptable as final: the **side face window remains over-closed** and the very long back tabard differs from the original front tassets. The original front is never replaced by the new concept's misleading fully sealed visor.

## Completed verification

Local ZIP `Myrren_Obsidianite_Canonical_Front_Turnaround_v2.zip` contains four transparent PNGs (`front_canonical_UNCHANGED.png` and three new direction studies), `Obsidianite_Approved_Front_4_Direction_Review.png`, `obsidianite_canonical_front_directional_study_4x1.png`, `manifest.json`, `README.md`, and `verify.py`. The verifier checks:
- Pixel-accurate unchanged canonical front PNG file checksum and native dimensions
- Four RGBA sprites with transparent backgrounds and non-empty alpha
- Material ID 7, Forging 40, and all release gates false
- ZIP CRC integrity

This is a new local **four-direction visual reference**, not an in-game native pixel-grid atlas, and the individual cutouts have different source sampling/resolutions. They must be re-authored into one coherent pixel grid before game integration.

## Explicit remaining work

1. Re-author side helmet openings and the back armour details to match the exact front. Keep no eyes on any helmeted direction, but the small exposed lower face where the front-facing model has it.
2. Make a true base-character layer and six independent armour slots across four directions and all required animations; attack weapon swing should not have a baked slash.
3. Rebuild the full 64-frame source atlas from the corrected and visually signed-off four-direction designs; replace the old concept atlas with eyes showing.
4. Verify native on-screen size and gameplay in Crater Camp on real desktop/mobile browser; preserve saves, remote players, forging tiers and gameplay.
5. Remain in an unmerged draft. No gameplay release or visual approval is implied by the illustrator's generated “ready” label.

Current GitHub branch contains contract/docs/tests only; the image binaries are available as conversation download artifacts, not committed to repository. Do **not** claim game assets are uploaded or installed.
