# Bronze native sprite-sheet QA — 2026-11-11

**Status: TECHNICAL PROTOTYPE; NOT APPROVED ART; NOT IN LIVE GAME.**

## Exact existing asset

- `public/assets/armour/bronze_layers_21x27.png` is 84 × 972 indexed transparent PNG.
- Each cell is exactly 21 × 27; 4 frames across, 6 animation rows per equipment slot, 6 independent slots, **144 valid cells**.
- Material ID remains **2 (Bronze)**. The original `public/assets/kez-v2/kez_v2_atlas.png`, renderer, character identity, item IDs, inventory, skills, animation hitboxes and save schema remain unchanged.
- `public/assets/armour/bronze_layers_21x27.json` supplies the physical slot order: shield, helmet, chest/body, legs, boots, gloves. This is deliberately different from the *player equipment array* order, which is helmet, body, legs, boots, shield, gloves. Translate by slot names, not array index.
- The body, helmet and shield sprites have exactly **one visually distinct cell** in each four-frame row, so they are **not finished walking animation**. Legs, boots and gloves have three distinct frames in each directional walking row. The side-attack row is static for every slot. Do not infer full animation coverage from 144 populated cells.

## Reproducible checks actually performed

- Verified exact file bytes for the committed indexed PNG: Git blob SHA `3929f01b4ef177be5fcc08ddb6b5a8d064fb04f5`.
- Local Pillow analysis verified PNG dimensions, hard binary alpha, all 144 frame rectangles nonempty, and animated legs/boots. The corresponding test `tests/bronze-sprite-atlas.test.py` is in the existing CI `paperdoll` job.
- Executed `tests/native-gear-layers.test.cjs` logic with the V8 JavaScript test harness: **PASS**, 144 src rectangles, true production Kez V2 idle/front/back/side frame semantics, stationary side/back always frame 0, 4-direction walk and sword strike source-frame selection, independent equipment slot controls, and shield depth (under on side, over on front/back).
- `public/native-gear-layers.js` is a **pure preview-only helper**, deliberately not imported by the production index. Its placement function matches the crop/foot-centre logic in `public/kez-v2-atlas.js`. It does not write player progress or modify item/gear arrays.
- `tests/bronze-sprite-browser.test.cjs` now does *actual Chromium* 980px and 390px review using the current Kez V2 PNG, then tests gear visibility toggles, old-vs-new overlays, frame changes, and immobilised back/side poses. Screenshots are uploaded by the existing Kez V2 CI browser job:
  `/tmp/myrren-bronze-four-directions.png` and `/tmp/myrren-bronze-mobile-lab.png`.
- **Chromium screenshots and CI results had not yet completed when this note was written.** Do not claim a real-world integration result without inspecting the run artifacts.

## Remaining artistic and functional blockers

1. Current Bronze art is a proof, not the expected visual finish. Keep the original Kez V2 face/hair/anatomy; refine open Bronze helmet, small bevelled chest and pauldrons, boots and properly shaped shield *as hand-authored source PNG* (not new JS rectangles).
2. Author per-frame moving chest/shoulder and shield/grip layers to coincide with actual character arms. Avoid a completely static chest on walking and never let the shield occupy the sword hand.
3. Front idle and back/left/right idle art must have their own correct layer position, not re-use moving walk frame 3 when standing still. The new preview fixes frame selection while final animation pixels remain outstanding.
4. Finish sword/fist attack layers, weapon sockets and death poses. No duplicate baked-in blade or white slash. The live sword renderer is separate; coordinate with its actual wrist pixels.
5. Test mixed tiers (Bronze/Steel/etc), dyes, inventory portrait and remote multiplayer avatar **after** other tiers have genuinely authored assets. No fallback to wrongly tinted materials or old 384 × 640 Wardrobe art.
6. Review world-scale proportions on a **real mobile gameplay screenshot** (16px tiles, ore scale, trees, NPCs, shields). The preview lab is not a substitute for full gameplay composition.
7. When QA passes, integrate with an opt-in toggle on a dedicated branch and run the existing renderer, inventory, save, combat, mobile and CI suite. No production merge before visual approval.

## Work implementation direction

Continue from PR #76, not obsolete #75. Use `/bronze-sprite-lab.html` to compare base, original overlay and PNG layers. First update the **PNG authored pixels**. Only revise the renderer if real frame fitting or depth ordering proves wrong. Do not rescale the whole game, replace the Kez V2 base or re-open the rejected 32×48 character direction.
