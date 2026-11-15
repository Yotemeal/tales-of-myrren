# Tales of Myrren — V19F-matched world art direction

**Reference:** character idle, walking and sword-attack GIFs supplied by the owner on 15 November 2026.
**Status:** foundational visual specification and audit only; no production sprite, character, camera or gameplay changes.

## Preserve the approved character

- The approved 24×32 native V19F hero (front, left, right, back) is the style and scale benchmark: warm layered brown hair, cheek scar, olive outfit, dark outline, and readable compact proportions.
- Do not redraw its face/eyes, change its dimensions or gait, or silently substitute older Kez V2 graphics.
- Respect the fixed 2× camera and existing 16×16 world grid. Keep anchors, collisions, equipment ownership, save state and multiplayer unchanged while changing art.
- Equipment still needs native V19F directional poses. Do not stretch the old 21×27 equipped fallback onto the approved hero.

## Visual rules for new resource and world artwork

- Use deliberately placed hard-edged pixels, dark clean outlines, strong readable silhouette and limited grouped shading. No airbrush gradients, halos, white/grey stray pixels or painterly texture.
- Use muted olive, warm wood and earthy stone tones compatible with the character; give each metal and magical material distinct, controlled highlights.
- Transparent backgrounds, consistent light direction, fixed feet/base anchor, zero unwanted overlap into interaction labels.
- Source-to-world drawing must preserve native pixel structure at a uniform integer scale. Do not rely on huge painted PNGs shrinking into 24-world-pixel rocks.
- Verify actual size in gameplay at the approved fixed camera rather than judging only large preview PNGs.
- Keep the recently approved compact, translucent HUD and world-map/settings/bag icons; adjust icon art separately from layout or input behavior.

## Current mismatch verified against main on 15 November 2026

The resourceSprite() renderer in public/myrren-environment.js draws all tree files at **144 world pixels wide** and all ore files at **24 world pixels wide** (both with aspect ratio preserved). Native source sizes:

| Resource | Source PNG | Current world width | Finding |
|---|---:|---:|---|
| Alder, Bramblewood, Duskwillow, Elderthorn, Ironbark, Redleaf, Starroot | 96×96 each | 144 | 1.5× non-integer enlargement |
| Tin | 153×133 | 24 | Large downsampling |
| Copper | 167×134 | 24 | Large downsampling |
| Iron | 162×136 | 24 | Large downsampling |
| Coal | 164×138 | 24 | Large downsampling |
| Black Iron | 203×147 | 24 | Large downsampling |
| Obsidianite | 161×135 | 24 | Large downsampling |
| Meteorite | 162×134 | 24 | Large downsampling |
| Myrrenite | 161×184 | 24 | Large downsampling |

The figures above are measured from repository files, not inferred from the owner's GIF sizes. These are art-source/rendering issues; **do not change world render sizes or collision to conceal them**. Existing tree images also look notably brighter and more detailed than the approved character. That comparison is a review priority, not a claim that replacement art was approved.

## First art replacement sequence

1. **Copper pilot:** hand-author a transparent native copper sprite around the existing 24-world-pixel render width. Preview in-game alongside V19F and existing ore nodes. Preserve footprint, item ID, collision and selection.
2. **Alder pilot:** preserve the current 144-world-pixel target width and base anchor, but supply artwork authored at a matching native resolution or a verified integer source-to-world factor. Review canopy silhouette and colour before converting the other six trees.
3. **Village and camp props:** bring houses, signs, bridges/path edges, forge, anvil, chest and camp objects into the same outline/shading system without changing gameplay geometry.
4. **Monsters, wildlife and pets:** use hero scale for silhouettes, keep pets smaller than the player, and preserve approved creature names, stats, AI and drops.
5. **V19F gear:** produce native front/left/right/back weapon, armour and shield layers with validated hand alignment; then safely retire the equipped Kez V2 fallback.

## QA and repeatability

- Run: node scripts/audit-art-native-scale.cjs (read-only table). Add --json for tools or --strict to fail on art-scale mismatches.
- Current asset inventory intentionally fails --strict. Do not add --strict as a required CI check until replacements are accepted.
- Validate both mobile orientations at fixed 2×, idle/walking, resource occlusion, pixel edges, and equipment across four directions.
- Run the existing Node and browser suites as available; record actual tests, do not claim iPhone Safari QA without performing it.
- New art should land in an isolated branch and be visually reviewed before any replacement or deployment.