# Tales of Myrren — native Crater Camp essentials V1

**Status: original native pixels committed for visual review, NOT INTEGRATED.**

This is the first camp-prop batch under the [user-approved Crater Camp style](https://github.com/Yotemeal/tales-of-myrren/blob/design/starter-region-layout-and-asset-contract-2026-11-12/docs/APPROVED_CRATER_CAMP_VISUAL_DIRECTION_2026-11-12.md). The concept image locks the atmosphere, palette, forest/cliff styling and survivor camp layout, but is NOT game-ready source art.

## Source files and sprite contract

- `public/assets/camp/camp_props_v1.png`: **256×384 pixel lossless indexed PNG**, exact RGBA when decoded; 4 columns × 6 rows, **64×64 per cell**.
- `public/assets/camp/camp_props_v1.json`: complete per-prop row mapping, frame count, source native dimensions, foot anchors and original interaction hooks.
- `tests/native-camp-props-v1.test.py`: verifies frame bounds, alpha, native 21×27 Kez reference, distinct animated frames, planted-foot stability and no production integration.
- The standalone original source PNGs and editable offline Python drawing script are in the complete Work handoff ZIP, together with a labelled review sheet, static camp scene and looping GIF.

| Atlas row | Prop name | Source native px | Animation |
|---:|---|---:|---|
| 0 | Storage chest / bank | 48×36 | one static frame |
| 1 | Odd jobs board | 64×56 | 4 timing frames (2 paper-corner poses) |
| 2 | Blacksmith anvil | 48×38 | one static frame |
| 3 | Open stone furnace | 64×64 | 4 contained fire/smoke frames |
| 4 | Campfire | 56×46 | 4 fire frames, stone ring fixed |
| 5 | Lantern | 24×48 | 4 timing frames (2 flame poses) |

The single uniform atlas uses a **(32,56) foot anchor in every 64×64 cell**, and per-prop native offsets are recorded in the manifest. At actual runtime, draw one cell at the entity's existing anchor with `ctx.drawImage(atlas,frame*64,row*64,64,64,Math.round(x)-32,Math.round(y)-56,64,64)`, `imageSmoothingEnabled=false`. Do not scale the atlas to fit a new player or move an object to fit the art.

## Existing game hooks and game safety

The original game still paints the following appearances directly in code. **Do not replace interactions or location logic.**

- `drawBankChest(x,y)` and `SPOTS.bank` keep opening the same banking/storage interface and the same save inventory.
- `drawBoard(x,y)` and `BOARD` keep the same quest/job data and proximity prompts.
- `MyrrenEnvironment.smithyPart(ctx,'anvil',x,y,now)` and `('furnace',...)` remain at the original `MyrrenWorld.stations` coordinates, with the same forging interface.
- `drawLamp(x,y,now)` keeps existing `LAMPS` positions; image art replaces the post + flame, but a *separate, restrained lighting overlay* can stay for ambience after testing.
- The approved **campfire prop artwork has no new cooking/station logic**. Inspect current in-world fire placement and rest/cooking logic before assigning any interaction; the sprite itself doesn't add gameplay.

**The repository's current world map is NOT the concept map.** It still contains five existing service-building footprints and lacks the approved southern fishing river and broken usable bridge. Do not relocate anything as part of a prop preview.

## After visual approval: safe integration steps for Work

1. Inspect the real `public/myrren-game.js`, `public/myrren-environment.js` and `public/myrren-world.js` first, and preserve the drawing order and interaction prompts. Work may be integrating the ground independently. Use the latest `main`; do not paste an old `myrren-game.js`.
2. Load and cache the atlas once. Use clear asset-load logging and a working fallback until the asset is confirmed present in the live release.
3. Substitute only the image draw path for the mapped sprites. Keep existing label and bank/job/forge prompt logic as-is. Do not duplicate old procedural art *behind* a new PNG.
4. Draw native frames with integer destination coords, no interpolation, and the atlas foot anchor. Ensure frame looping doesn't move the plank/stone bases or object collision footprint.
5. If the full furnace also includes existing floor tiles, keep their draw order and don't accidentally paint the furnace twice.
6. Verify real desktop/mobile screenshots at normal gameplay zoom, before/after for the same entity, frame animation, and no clipping behind Kez, merchant or walls.
7. Run core movement, mobile HUD, banking, jobs, forging, save/restore, multiplayer appearance and monster/resource regression tests; **do not claim production-ready or merge until visual review**.

## Still outstanding

Trader Gus, his horse and the wagon require a **larger separate character/vehicle art pack**. The open blacksmith structure, provisions/sacks, banners and ornamental ruins also need native PNG refinement after this first essentials pack. Any such art needs separate visual review.

**No changes to main, equipment PR #78, terrain PR #83, farming/forging systems or world geometry were made by this art PR.**
