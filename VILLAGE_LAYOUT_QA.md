# Village layout, open blacksmith and waterways

## Changes
- Cottages are distributed around the central village: hall northwest, mining supplies west, bakery southwest, fishing supplies east; the northeast blacksmith is entirely outdoors.
- Furnace, anvil and supplies rack have independent world interactions. Smelting/forging use the existing recipes, requirements and menus. The smithy has no house, roof, door or interior transition.
- One continuous river surrounds the village, with an east timber bridge as its only crossing. A connected southeast channel feeds the reshaped lake. Rendering, water collision, spawning exclusions and shoreline fishing positions share public/myrren-world.js.
- Lake banks use pixel masks, shallow water and occasional reeds instead of rectangular stone shoreline tiles. Fishing nodes show animated shoals, glints and broken surface ripples.
- Saved inventory, XP, equipment, durability, coins, tokens, jobs and save format are preserved. If an old coordinate now lies in water or a cottage footprint, only position moves to the nearest safe land.

## Verification
Run: node tests/village-layout.test.cjs

Passed in the available JavaScript runtime:
- 1,440 river continuity samples.
- Flood-fill confirms an exit via the bridge and no exit when the bridge is blocked.
- All five service approaches are dry; all sixteen fishing nodes are reachable within 24 pixels of dry shore.
- 300 old-water-position recovery samples land on nearby dry ground.
- Executes the actual game source with synthetic DOM/canvas: outdoor furnace smelts bronze with the existing recipe; outdoor anvil forges/equips a sword; four cottages enter normally; the open smithy stays outdoors and walkable.
- Snapshot round-trip preserves sample inventory, equipment, XP, coins, tokens and durability.
- Executes the actual outdoor renderer, including the new water masks, bridge and smithy stations, rejecting non-finite rectangle coordinates.
- 21 existing save, crafting, equipment, combat and character functions were compared byte-for-byte to parent a0c82a8807b2e60aab574b1c422fbd60bfca8125 and are unchanged. The simulation function changes only the open-building collision exemption.

## Verification limit
The browser/execution environment was unavailable for this revision. No live visual walkthrough or screenshot verification was possible. The tests above are geometry, source-preservation and synthetic runtime tests, not a substitute for visual review.
