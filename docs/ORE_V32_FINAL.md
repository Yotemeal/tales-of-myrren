# Tales of Myrren — FINAL approved mining ore set v3.2
**16 November 2026 (Brisbane).** Owner explicitly authorised uploading **all eight** ore assets after approving the final iron-shading reference.

## Exact asset contract
Eight transparent native **40×28** PNGs in `public/assets/resources/v32/`, with integer-pixel edges. All render at native 1× world size under the existing fixed 2× game camera. The following visuals are preserved byte-for-byte from V3.1: Copper, Tin, Coal, Black Iron, Chromium, Iridium, Myrrenite. **Only Iron changed:** 37 hard pixels at its lower-left foot, darkened and blended into the contact shadow. Original alpha silhouette and all other regions are unchanged. Every file and visual alias is in `docs/ore-v32-final-manifest.json`.

The owner-approved final reference board SHA-256 is `b5dca062c0053c4c9a11e442638f5b61b838cbb562dc84f14f44832af397ef94`. This was an image rendering; native PNG source is not claimed to be byte-identical to the board. The seven previously approved native sources remain the exact ones the owner tested in-game. Full-quality original board was provided in the conversation; native PNG previews can be viewed at `/ore-v32-native-review.html` in a branch/live environment.

## Safety and compatibility
- Production `public/myrren-environment.js` loads all eight from the versioned `v32` folder; the HTML environmental script tag increments 14→15 to avoid old mobile browser caches.
- `v31` remains untouched for rollback. Tree artwork, rendering and naming remain **unchanged**. Tree approval/rework is the **next separate phase**.
- No edits to approved V19F hero, scripts drawing character, combat, HP, XP, mining drop/depletion/spawn/respawn, world/positions/collisions, Forging recipes, gear, saves or multiplayer. Internal material IDs and user saves remain stable: cobalt→Black Iron art, aether→Myrrenite art, obsidianite→Chromium art, meteorite→Iridium art.
- Crucially, the last two are VISUAL aliases only. Do not rename the gameplay items or rework progression without a separate coordinated migration.

## Verification
- `node --test tests/ore-v32-native.test.cjs` verifies PNG hashes, native RGBA, seven byte-identical legacy visuals, 37 changed Iron colour pixels, unchanged alpha geometry, visual aliases, camera and unchanged character.
- `node tests/ore-v32-browser.cjs` loads all eight at the fixed 2× game scale in real Chromium and emits `/tmp/myrren-ore-v32-2x-preview.png`.
- `node --test tests/ore-v31-native.test.cjs` still retains prior V3.1 asset checksums for rollback.
- Run full CI before merging, and confirm updated live Cloudflare assets before claiming deployment.

## Next task
Begin approval/reference audit for TREES: user says current live trees are **not** the approved set. Recover the last actual approved reference, avoid restoring obsolete Starroot naming or accidentally modifying ore assets.
