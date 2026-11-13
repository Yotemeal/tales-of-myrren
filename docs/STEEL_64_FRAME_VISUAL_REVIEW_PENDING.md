# Steel armour concept — source-derived animation review (13 November 2026)

**Status:** candidate visual artwork requiring review; **not** wearable armour or a game-ready animation. Approved Bronze and reviewed Iron remain unchanged.

## Identity
- Metal: **Steel**, material ID **4**, Forging requirement **Level 20**.
- Candidate illustration: `a_polished_pixel_art_sprite_sheet_in_the_same_styl.png`
- Source SHA-256: `527005897090001f80f11cb22500b4d6347a3d9780189e6c73592e0f7172b8ea`
- Source label correctly reads Forge Lv. 20.

## Actual assets prepared (not uploaded to GitHub)
`Myrren_Steel_01_Atlas_And_Review.zip`: **1792×680 transparent full-suit atlas**, 16 columns × four rows, **112×170 source-derived cells**, plus contact sheet, four direction idle preview, Iron/Steel appearance comparison and idle/walk/attack/death GIFs.

`Myrren_Steel_02_Individual_64_Frames.zip`: **64 individual transparent PNGs** and exact reconstruction/QA manifest. Four directions (front/right/back/left), four actions (idle/walk/attack/death), four frames per action. Foot anchor is **(56,167)** in each source cell.

## Visual objective
Keep the accepted Kez identity, silver-blue brighter hardened plate, an elevated rigid central helmet ridge, heavier pauldrons, layered chest/belt, full greaves and boots; visibly more crafted than Iron, but less enclosed and less bulky than Black Iron. Front face remains visible; rear head no eyes/front buckle.

## Tests actually completed
- All 64 sprite cells nonempty with consistent common foot anchoring.
- Transparent RGBA source-derived sprites; source masks and per-frame alpha inspected.
- Individual PNGs reconstruct the corresponding atlas cells pixel-for-pixel.
- ZIP CRC and manifest material ID/Forging 20/source SHA checks pass.

## Unfinished and non-mergeable
- The preview illustration is **not** accepted by user until reviewed.
- Atlas consists of **full-body composites, not six independent equipable wearable pieces**.
- Slash arc baked into final attack frame. Must remove/separate before independently rendering equipped swords.
- No independently authored right/back/left helmet/chest/legs/gloves/boots/shield wearable layers for mixed gear.
- Native in-game pixel size and actual desktop/mobile browser integration not tested; source atlas is **not** a 112×170 in-world player.
- Missing barehand/punch, hurt animation, multiplayer gear and original attack/grip verification.
- PNG assets exist in user download artifacts, **not in GitHub source** or live game.

Do not merge as gameplay until production art and regression gates pass.
