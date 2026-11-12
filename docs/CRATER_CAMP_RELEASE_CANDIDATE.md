# Crater Camp Release Candidate — Native Terrain and Props

**Status: unmerged draft release candidate.** This branch was made from combined QA PR #87, including source terrain #84, camp art #85, and runtime preview #86. It is intended for review against `main`, not to replace the approved Kez V2 equipment project.

## Changes to live presentation

The current, provisionally accepted Crater Camp appears **by default** on this branch:

- Native 16×16 terrain with preserved water edges, paths and corrupted biome limits.
- Native six-prop 64×64 atlas containing the specifically approved **Anvil V2**.
- Courtyard cooking fire at world **(864,850)** instead of the old position (976,710). The Cooking interaction checks the same shared coordinate used for rendering and draw order.
- Existing chest, board, merchant, anvil, furnace and lantern interactions and coordinates are unchanged.
- No save schema, coin pouch, skilling XP, combat, multiplayer, NPC placement, level requirement, shop inventory, or equipment renderer changes.

**Important:** The user described the overall camp appearance as good enough for the **current working version**, not a permanent design lock. Further design iterations remain expected.

## Rollback and fallback

- The URL query `?legacy-camp-props` immediately restores the existing procedural camp props and **original fire location and cooking hotspot**, without changing saves.
- A missing or corrupt native camp PNG falls back to the existing procedural sprite draw functions for each prop. The courtyard fire keeps its anchor in this case, so cooking still works.
- The original procedural terrain rendering is preserved as a fallback when the native terrain atlas does not load.
- The special `?original-campfire-layout-proof` renders the *new* PNG props at the old campfire position, for review comparisons only; the new courtyard position is the default.

## Release gating and QA

- Validate source `public/assets/camp/camp_props_v1.png` exactly matches approved V2 atlas SHA `08fad0f9756cca187883bcb736813b43a319a6af`.
- Preserve the original 16×16 terrain and all six 64×64 prop cells, integer-aligned with smoothing disabled.
- `tests/native-camp-props-runtime.test.cjs`: browser rendering on desktop and mobile; six native rows; default courtyard, old layout comparison, missing PNG and legacy rollback; real Cooking menu at the moved hotspot and old spot inactive.
- `tests/crater-combined-art-browser.test.cjs`: native terrain with legacy props, native props at old fire anchor and **default combined** scenery on desktop and mobile.
- `tests/native-camp-props-v1-browser.test.cjs`: pixel-art before/after screenshots use `?legacy-camp-props` so the original art remains a genuine baseline.
- `tests/starter-terrain-v1-browser.test.cjs`, Mainline mobile/HUD, Kez paperdoll, combat, mining and forging regression checks continue to run.

All seven workflows must be green **on this release candidate's latest commit**, not only on older draft branches, before a merge is even considered. Review the real game screenshots for overlap and visibility, especially mobile.

## Merge policy and next development step

**Do not merge automatically.** This PR is the consolidated release candidate targeting main. Source branches #84, #85, #86 and compatibility PR #87 remain open as archival/review context until release. Once approved and merged, validate the deployed game and the rollback URL, then return to equipment work in PR #78, starting with native Bronze visuals and subsequent seven material tiers. Never silently overwrite Kez's approved character proportions or equipment animations.
