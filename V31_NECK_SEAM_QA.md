# V31 neck and profile seam repair

Cause: helmetBase cleared rows 0–24, then reconstructed visible facial skin. Row 24 also contains the original dark neck/under-jaw outline. Reconstructing skin could not recover those pixels, leaving missing profile outlines and a fully transparent row in 52 helmet poses, including rear views and some right-facing walking frames.

Fix: clear and reconstruct only rows 0–23. Keep the original row-24 neck/under-jaw pixels and the untouched torso below. Equipment artwork, item IDs, stats, animation timing, movement, crafting, environment and save code are unchanged. Asset references advance to v7.

Validation:
- Added tests/v31-neck-seams.test.cjs. It fails against the deployed pre-fix renderer with an erased neck/under-jaw pixel assertion.
- The fixed renderer passes all 192 helmet poses: 1,890 original neck-outline pixels checked, complete helmet/face/profile connectivity to the shoulders, and pixel-identical body/feet below the head.
- Existing tests/v31-prestige.test.cjs passes all 49 mixed helmet/shield combinations across 32 poses, unique shield/helmet silhouettes, dyes, icons, combat poses, foot padding and exact unequip restoration.
- Enlarged pixel inspection and browser review covered both side profiles and rear views, including the previously broken right-facing walking frames. Production source verified after deployment.

Run with @napi-rs/canvas available:
node tests/v31-neck-seams.test.cjs
node tests/v31-prestige.test.cjs
