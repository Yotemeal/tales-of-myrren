# Kez V2 Bronze integration on Crater Camp build 88

**Draft QA handoff — opt-in character artwork only.**

This branch starts from the real merged Crater Camp release on `main` (commit `4697e68fe4fba4efa61c7af1af7613510d7f9fe0`), and selectively ports the equipment renderer foundation from draft PR #78.

## Existing work preserved
- **Mainline Crater Camp**: native terrain, six camp objects, the approved anvil V2, courtyard campfire, bank and forge/cooking interactions, native asset fallback, and `?legacy-camp-props`.
- **Kez V2 base sprite**: the original 21×27 character sheet and approved proportions are unchanged. The opt-in proof sheets do not overwrite it.
- **All 7 armour tiers**: the legacy procedural equipment fallback remains the default whenever a native material atlas has not been loaded. No gear data schema changes.
- **Multiplayer**: added optional direction, face, damage and death pose fields from #78; older payloads continue to have a legacy-facing fallback.
- **Game mechanics**: movement, monster AI, gathering, combat damage, drop rates, XP, item stats and inventory remain unchanged.

## Opt-in proof

Open the game with `?bronze-proof` on this branch to load authored native Bronze layers and proof attack/collapse sprite sheets from PR #78. In normal mode, all existing equipment rendering remains as before, on the new camp background.

The latest sword-readability integration is build **96** (build 95 was the original compatibility port). `public/myrren-game.js` receives the character pose, sword grip, death, animation and network fields from #78 without overwriting its build 88 terrain or campfire changes. `public/index.html` retains the environment v13 and camp module v2 while loading Kez atlas v18 and equipment v8.

## Release gate
- Run the original Kez paperdoll, sprite, browser, equipment-atlas, and gameplay integrity tests **on this combined branch**.
- Run mobile/HUD, mining, forging, combat, native terrain, camp art and cross-art browser checks again.
- Review `?bronze-proof` side by side on desktop/mobile. Especially sword in dominant hand, rear shield silhouette, proper helmet face cutout, feet on ground and no white pixels.
- **Do not merge** based on passing CI alone: Bronze is still a visual proof and its artwork needs a separate user sign-off. The user has approved the camp's working look and anvil, not the new armour sheet.

This branch should replace the old conflicting PR #78 only after visual QA and future user review. It has no dependency on rewriting the camp.
