# Crater Camp: Native Terrain + Camp Prop Integration Proof

**Status: draft test branch only. Not approved for main.**

The terrain implementation in draft PR #84 and the six camp sprites in draft PRs #85/#86 independently pass CI. Both touch the live world-rendering path; this integration proof checks that they coexist without accidentally replacing each other's changes.

## Merged technical scope
- Native 16×16 terrain from PR #84. Retains water/shore and path variant selection and the explicit corruption biome guard; original procedural fallback remains available if the atlas fails to load.
- Approved revised anvil V2 and other five native 64×64 camp prop cells from #85, loaded by #86's separate `myrren-camp-props.js`. No change to source art or anchors.
- `public/myrren-game.js` combines terrain selection with existing world entity sprites instead of copying an older version wholesale.
- `public/index.html` requests the terrain-compatible environment script (v13), opt-in camp prop module (v1) and a fresh game script version (v87).
- Original cooking fire world coordinates and interaction remain default. `?camp-props-proof&campfire-layout-proof` still evaluates the alternative courtyard position; no approval is implied.
- Unchanged old saves, equipment, multiplayer, player/mob AI, resource system, loot/XP, shops and UI.

## Real-game QA

`tests/crater-combined-art-browser.test.cjs` loads the production game and records actual Canvas draw calls for both PNG sources on desktop and mobile. It checks:
1. Native terrain alone with original camp sprites by default.
2. Both native terrain and native prop atlases simultaneously using `?camp-props-proof`.
3. Both atlases and the alternative campfire position using `?camp-props-proof&campfire-layout-proof`.

Six screenshot scenes and a JSON report are uploaded by the Native Crater Camp prop art QA workflow, along with the existing individual asset QA. The terrain's own 16-scene browser proof and mobile game integrity workflows also run on this branch.

## Approval and release safety

This is a **cross-branch compatibility test**, not an attempt to merge unfinished art to `main`. PR #87 (this branch) targets draft PR #86. Its merged-source history includes draft PR #84 for traceability, but neither source branch is modified. User has approved only the revised anvil design; no complete terrain or courtyard fire placement approval has been inferred.

Before adopting changes into the live game, visually review full-screen combined screenshots and verify the merged result against current main and the separate Kez V2 equipment branch (#78). Keep mobile and native pixel QA passing; do not replace approved character art.
