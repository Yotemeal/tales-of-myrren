# V31 native-scale world plan

## Art scale
- V31 player is the reference: **32×40 source pixels, drawn at 32×40 game pixels**. No fractional downsampling.
- World tile size remains 16 pixels initially. Character occupies approximately two tiles in width and two-and-a-half in height.
- Do **not** increase the canvas CSS zoom to solve scale; that magnifies the whole scene without improving relative proportions.

## Migration in safe stages
1. **Player native-scale rendering**: update sprite size, hand/tool anchors, name labels and hurt effects. Retain `?classicSprite=1` rollback.
2. **Visual footprint audit**: compare doors, shop façades, interiors, trees, ore rocks, NPCs and interactable objects against V31. Make new pixel art at appropriate dimensions.
3. **Collision and access audit**: only after art is approved, align entrances, path clearance and interaction ranges. Avoid altering world positions, resource spawn coordinates or save schema until compatibility is tested.
4. **Map expansion**: add new areas/roads and distribute scenery without changing existing saved coordinates. Test camera limits, minimap, NPC routing, combat and gathering.
5. **Equipment overlays**: create aligned 32×40 overlays for each direction/frame and each armour slot. Existing armour-aware procedural renderer remains active until then.

## Release gates
- Test idle/walk for all four directions, combat effects, health flash, names, and movement in interiors and outdoors.
- Confirm collision does not block doors or allow walking through objects.
- Verify gear, saving/loading, multiplayer positioning, resource gathering and mobile viewport.
- Do not merge world footprint or map coordinate changes without a migration test and rollback plan.

**This branch is stage 1 only.** It intentionally does not resize buildings, change map geometry, alter physics or save data.
