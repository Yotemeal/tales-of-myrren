# V31 helmets and material shields

Six distinct helmets with increasing presence and detail, plus exactly one shield design per material. Front, left, right and rear views represent the same equipment, not additional variants.

| Existing material | Helmet | Single shield design | Existing requirement |
|---|---|---|---|
| Leather | Trailwarden cowl | Timber buckler | 1 |
| Bronze | Suncrest helm | Crescent pelta | 1 |
| Iron | Iron Sentinel barbute | Riveted heater | 15 |
| Steel | Winged armet | Heraldic kite | 25 |
| Black Iron | Dreadcrown | Spiked bulwark | 45 |
| Myrrenite | Sovereign crown | Prismatic aegis | 75 |

Helmets track the native head anchors in all eight animation rows. Leather and bronze retain the approved visible face; enclosed helms cover it. Plumes shift and high-tier mineral/ember details animate. Shields follow the arms, show material-specific edges in profile and straps on the rear, and visually brace during existing weapon swings. This introduces no blocking mechanic or stat change.

The existing 128×320 atlas contract and 32×40 frames remain intact. Helmet removal restores the original source head. Chest, leg and boot artwork is unchanged. Equipment rendering now covers the local player and peers; NPC shopkeepers retain their previous appearance. Inventory/shop icons use the actual helmet and shield artwork.

## Validation

`node tests/v31-prestige.test.cjs` (requires @napi-rs/canvas) passes:
- 49 independent helmet/shield combinations × 32 poses.
- Six different helmet silhouettes and six different fixed shield silhouettes.
- Shield resting geometry stays fixed across idle frames; lighting may animate.
- Head equipment leaves the approved torso, leg and foot pixels unchanged.
- Transparent foot padding and frame boundaries remain intact.
- All four visual combat stages, material dyes, icons and exact unequip restoration.
- Production game and review script syntax.

Additional checks:
- Differential pixel comparison against parent equipment renderer: all six existing matching chest/leg/boot sets and mixed sets are identical across every pose when helmets/shields are unequipped.
- 21 simulation, combat, crafting, environment and save functions compared byte-for-byte to parent 6f66e6b20d5c921f5536259012ac6590459332e5: unchanged.
- Browser reviewed all tiers/directions and animated walking/combat brace. An isolated local game save exercised equipped Myrrenite helmet/shield on V31, attack input, backpack icons and saved gear restoration. No live player save was modified for testing.

Existing item IDs (including cobalt_* and aether_*), requirements, recipes, durability and save schema remain unchanged. No environment assets or geometry change.

Review: /v31-equipment-preview
