# Tales of Myrren — approved three-stage ore integration and tree continuation
Date: 16 November 2026. User has approved an image with **full / middle / depleted** visuals for all eight ores.

## Production ore visual contract
- Current approved FULL sprites in `public/assets/resources/v32/ore_*.png`: eight individual locked 40×28 native RGBA images. No changes.
- Current approved DEPLETED sprites in `ore_*_depleted.png`: eight individual native small broken rubble files. No changes.
- Eight new MIDDLE sprites in `ore_*_mid.png`: composed directly from the approved 40×28 original pixel material in layers, reduced and chipped, while keeping each ore's mineral colour. SHA-256 listed in `docs/ore-v33-three-stage-manifest.json`.
- All three have the same 40×28 transparent canvas and ground anchor; the in-game fixed 2× camera is unchanged. No old procedural art fallback.

## Behaviour
Uses existing `n.oreLeft`, successful-gather count and `n.back` respawn timestamp. NO new save fields, no balancing changes.
- FULL: unmined node, over floor(vein/2) remaining, or just respawned with zero stale charge count
- MID: 1 through floor(vein/2) ores left, shown immediately on success
- DEPLETED: current time less than `n.back`, the existing exhaustion respawn timer
- Copper & Tin (6 charges): mid at 3 ores left; Iron & Coal (5): mid at 2; Black Iron (4): mid at 2; Obsidianite/Chromium & Myrrenite (3): mid at 1; Meteorite/Iridium (2): mid at 1
- Missed hits do not reduce vein charges. No new resources or XP are added.
- Legacy gameplay keys `cobalt`, `aether`, `obsidianite`, `meteorite` remain intentionally unchanged for save and forging compatibility, despite their visual aliases Black Iron, Myrrenite, Chromium and Iridium.

## Testing
`node --test tests/ore-v32-native.test.cjs tests/ore-v32-depleted.test.cjs tests/ore-v32-mid.test.cjs`; mainline/renderer/mobile browser regressions. Review page `public/ore-v32-native-review.html` includes all 24 native PNGs. Confirm on iPhone: no image jump, no hard edge seams, no outdated rocks, proper 2× sizing.

## Trees next — important constraints
The owner says current in-game trees do **not** match the approved visual direction. DO NOT assume an older tree concept is the final approved production asset. Historical boards `Tales of Myrren Forest Asset Guide.png` and `Tales of Myrren Tree Lineup v2.0.png` show Bramblewood, Alder, Ironbark, Elderthorn and Starroot, but their Starroot name was rejected in later discussions. Ironbark is a preferred name. Preserve V19F hero, camera and approved ore work. Next task: inspect the current native tree PNGs and exact visual references; agree a fresh original, easy-to-pronounce lineup, then create accurate native sprites before any tree deployment. Tree scripts currently map gameplay IDs `tree`, `oak`, `maple`, `elder`, `myrren`; keep those internal IDs and woodcutting behaviour save-compatible.

No exact remaining conversation token counter is accessible. This GitHub handoff preserves continuation.
