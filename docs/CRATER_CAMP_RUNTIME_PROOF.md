# Crater Camp props — runtime proof and independent fire-layout study

**Status: draft visual QA only; no mainline merge or approval of the full camp.**
This branch is based on the source PNG art in PR #85. The revised V2 blacksmith anvil is the specific design the user approved. Other new art, especially the cooking fire, still needs visual approval.

## Preview modes
- Default `/` — existing art and original cooking fire at world (976,710), unchanged.
- `/?camp-props-proof` — original native PNG camp props at their **existing** positions, including fire at (976,710). Existing procedural fallback if the atlas is missing or invalid.
- `/?camp-props-proof&campfire-layout-proof` — **additional opt-in experiment**: use the same original PNG sprites, but position the cooking fire at (864,850). The cooking reach check follows this **same** point. No save schema, cooking XP, rates, inventory, furniture or world collision changes.

The approved 21×27 Kez character and all seven metal systems are unchanged. Source PNGs are authored at native resolution, with 64×64 atlas cells and foot pivot (32,56), no runtime art resizing.

## Why a separate layout study?

The former cooking fire (976,710) sits only about 36 world pixels from the furnace (941,720). The new campfire and furnace sprites are approximately 56–64 pixels wide, so the art overlaps and looks like two furnaces. The proposed study point (864,850) is over 150 pixels from the furnace and over 115 from the anvil, while remaining on the dry village floor. It is also separated from the four current lantern anchors and south access path.

Normal gameplay and the regular PNG sprite proof do **not** move this station. The new location is not yet approved and should be evaluated at native game zoom on desktop and mobile.

## Engineering constraints

- `CAMPFIRE` in `public/myrren-game.js` is the single source for **draw location, depth order and `nearFire()` cooking reach**.
- Every preview is opt-in; a missing/corrupt image invokes the established procedural fallbacks without breaking banking, jobs, forging, movement or cooking.
- No NPC, merchant, bank, station or bridge positions are altered, nor does this experiment adjust map collision.
- `tests/native-camp-props-runtime.test.cjs` captures fallback, PNG art, missing-image fallback and separated-fire experiments on both mobile and desktop. The screenshot artifact is for art review, not evidence of approval.
- `tests/native-camp-props-v1.test.py` validates the original PNG dimensions and alpha, the approved anvil anchor, and the exact decoded pixels of the five unchanged atlas rows.

## Release gating

The **anvil** is approved in principle by user review but must pass full native-art and browser tests. The **fire-layout study** is **not approved**. Keep both PR #85 and dependent PR #86 as drafts until tests pass and the user has reviewed actual full-resolution camp screenshots. Do not silently move the fire in the live release.
