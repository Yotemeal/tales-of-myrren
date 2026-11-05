# River spacing and second crossing

The river now sits farther from the village (400 × 285 base radii), with asymmetric bends, small bank irregularities and varying width. The mining supply cottage and west fence move 30 pixels inward. East and west bridges connect to village paths and dry banks.

Paths stop with a grass margin at ordinary riverbanks. Only bridge approaches continue across the channel. Removed detached north/south path stubs. Scenery and fixed props use full visual-footprint checks before drawing; resource spawning keeps an 80-pixel bank clearance. All existing fixed props and colliding fences remain visible with the new layout. Fishing nodes follow the actual connected shoreline, keeping the changed river-mouth spots within casting range.

Validation:
- node tests/village-layout.test.cjs passes: 1,440 river continuity samples, two independently accessible bridge routes, no unintended third crossing, 24-pixel building clearance, 212 path tiles checked against bank overlap, 16 reachable fishing spots, 300 safe-position samples.
- Actual game source executes in the existing synthetic DOM/canvas test: saves, equipment, coins, XP and durability preserved; outdoor smelting/forging and house entry pass.
- Production JavaScript syntax passes. All fixed props and colliding fence footprints are dry.
- Browser preview inspected the actual game with both crossings, asymmetric banks, clean path ends and clear roof/prop separation. Live deployment checked after publication.

No combat, crafting recipes, equipment rendering or save-format changes.
