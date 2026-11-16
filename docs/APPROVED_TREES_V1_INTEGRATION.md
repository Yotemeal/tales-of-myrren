# Approved Twelve Trees — Production Integration

**Source of truth**: user-uploaded final sheet `D0810579-8FA6-482E-A83C-C5CCAD7C3BEA.jpeg`, not subsequent rejected Oak redesign.

## Assets
All 24 PNGs are copied byte-for-byte from the user-reviewed native pack; every SHA-256 and native width/height are listed in `docs/APPROVED_TREES_V1_MANIFEST.json`. None recoloured, reworked, animated or stretched. 12 complete tree sprites, 12 individually matching stumps. Trees draw as static full-size images at unchanged world anchors, under the fixed 2× camera.

## Existing save/progression compatibility
- Legacy resource key `tree` displays Pine; 30% of those exact existing node coordinates are relabelled Birch, both still award existing `logs` (generic Logs) with the same level, XP, odds, cooldown, and price. No new item type or node is created.
- `oak` remains Oak logs; `maple` remains Maple logs; `elder` is now visually Willow, with the existing `elder` item ID displayed as Willow logs; `myrren` is visually Ironbark, with the existing `myrren` item ID displayed as Ironbark logs. Prices, skill levels, XP and saved inventories do not change.
- Variant A/B is derived solely from coordinate hash, 70/30 intent; matches between full and stump and persists after regrowth, without a save schema change.
- Decorative outer showcase uses only approved six species. Forest-edge impassable boundary and monumental ancient scenic trees remain separate and unchanged.
- Map/resource positions, water, NPCs, ore nodes, monsters, world collision, equipment, melee and crafting are unchanged.
- Native tree size metadata is reused for tapping canopy hitboxes and label placement; root anchors unchanged.

## QA gates
1. Verify hashes/dimensions/alpha for 24 PNGs; tests for deterministic 70/30 variation, trunk-to-stump matching, re-spawn and no cropping.
2. Run mainline Node and browser tests including gameplay and tree QA at 2×.
3. Merge only if CI is green, then verify actual Cloudflare build 98 and all 24 sprite paths before declaring deployed.

## Not in scope
Terrain/palette rework is **next**, not now. No ambient wind, falling leaves or new regions in this patch.
