# Approved Bronze armour — source-derived sprite production (13 November 2026)

**Status:** first transparent full-body composite source atlas completed locally; **not live, not independent equipment layers, not merge-ready**. The original approved Bronze appearance and animation concept is the authoritative visual reference, not the rejected V2 procedural overlays.

## Reference identity

- Approved concept image: `a_detailed_pixel_art_spritesheet_on_a_dark_navy_bl.png`
- SHA-256: `efaf7a296bb7b9aeb321193c8ac53daa02909719f91efa1fb456d387f5f90029`
- Original illustration: 1536 × 1024 px, a labelled board with 4 directions and 4-frame idle/walk/attack/death studies.
- Base character remains the **approved Kez** (dark brown outfit, gold front buckle, matching dark eyes, no back buckle, consistent brown hair). Bronze keeps his face visible under the open helmet.

## Generated source-derived artifact package (separately delivered in conversation)

`Myrren_Bronze_01_Game_Source_Atlas.zip` contains:
- `public/assets/characters/kez-v3-bronze/bronze_composite_poses_16x4.png` — a **transparent 1664×648 RGBA atlas** with **104×162 padded source cells**, 16 columns × 4 directional rows.
- `bronze_composite_manifest.json` — exact source cuts, offsets, cell mapping, source SHA, and explicit release blockers.
- `review.html`, `README.md`, and Python QA verifier.

`Myrren_Bronze_Individual_64_Frames.zip` contains 64 separate transparent cropped pose PNGs and verification code. `Myrren_Bronze_02_Animation_Previews.zip` contains four-direction walk and attack GIFs plus a complete contact sheet. These are **handoff files stored outside this GitHub branch**, **not** assets uploaded to GitHub; do not assume game loads them.

## Frame map

| Sprite atlas rows | Direction |
| --- | --- |
| 0 | front |
| 1 | right |
| 2 | back |
| 3 | left |

| Sprite atlas columns | Action |
| --- | --- |
| 0–3 | idle |
| 4–7 | walk |
| 8–11 | attack |
| 12–15 | death/collapse |

All frames use a shared ground anchor in each padded cell, `(52,159)`. Source pixels are copied from the approved illustration, with the dark background removed into alpha. The atlas cells remain at the original extracted-art resolution; **104×162 is not the final visual size in the world**. 32×40 display sizing was too lossy in prior reviews.

## QA performed outside GitHub

- 64 source-derived RGBA pose PNGs and 64 unique occupied atlas cells.
- All individual sprites exactly reconstruct the atlas, including transparent cell padding.
- No empty frames, no source panel labels, no obvious neighbour bleed after fixing right-attack third frame and death pose bounds.
- ZIP CRC integrity passed; validation scripts in the delivered package pass.
- Visual inspection of four directions, walking, attacking, and collapse.

**Critical distinction:** the illustrated front/back/side *full-body composites* are real image assets but **cannot be equipped as six independent wearable items**. They are not a source of missing under-helmet hair or armour layers. They also do not produce new sword/shield direction variants or interchangeable weapon animations. The approved source fourth attack frame includes a baked sword slash; it must not be doubled by the game weapon renderer.

## Release blockers (do not bypass)

1. Reauthor six separate wearable parts (helmet, body, legs, boots, gloves, shield) from the approved look, **without replacing them with procedural coloured rectangles**, and ensure each is aligned to approved Kez.
2. Fill the complete true native sprite atlas: base idle/walk/punch/sword/hurt/death, front/back/left/right, visually consistent with the approved design.
3. Keep every material separately authored: Bronze 2, Iron 3, Steel 4, Black Iron 5, Obsidianite 7, Myrrenite 6, Starsteel 8. Mix armour per slot; preserve face, foot anchors and approved colours.
4. Fit each approved sword to the dominant hand and shield to the offhand, including rear/side occlusion, no double slash.
5. Validate browser screenshots against **real Crater Camp** on phone/desktop, verify multiplayer, inventory, saves, combat and skilling remain stable. Keep all work draft until visual signoff.

**No live game or already-approved PNG has been replaced.**
