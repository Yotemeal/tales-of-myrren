# TALES OF MYRREN — LOCKED STARTER-REGION VISUAL DIRECTION

**Visual style approval:** 12 November 2026, expressly confirmed by user (“Yeah that’s good lock it in”).  
**Status: APPROVED LOOK AND ATMOSPHERE; NOT A PRODUCTION MAP OR MERGE APPROVAL.**

## Exact approved picture

**Reference image filename:** `CRATER_CAMP_APPROVED_VISUAL_REFERENCE.png`  
**Image size:** 1536 × 1024  
**SHA-256 of original picture:** `0e9629cb04b8f59adfee6a50fe597acf01074870a8b666f654ed97de028b10e5`

The original approved concept image is retained unchanged in the deliverable `MYRREN_APPROVED_CRATER_CAMP_VISUAL_DIRECTION.zip` supplied with the user's visual review. Work must use that exact image, **not** earlier rejected concept sheets or generated blue-tunic character boards. This repository markdown is the text implementation specification, and the visual image is its authoritative aesthetic reference.

## Locked look — what future assets must match

- Crisp, readable, rich original **pixel-art action RPG** environment. Detailed natural texture but not noisy checkerboard ground or smooth painted gradients.
- Warm earth paths, lush but restrained greens, dappled golden forest highlights, cooler grey fractured crater stone, warm fires and forge, mossy ancient masonry, vivid but natural blue water and dark purple-black corruption.
- Dense varied surrounding forest with readable open paths, different tree silhouettes, modest beginner ore clusters, moss-covered foundations and broken stonework.
- A small **survivor camp, NOT a residential town:** single protected clearing among impact cliffs, campfire, open anvil/furnace/forge, odd-jobs board, storage chest, essential stall, Traveller Gus and his horse/covered trading wagon. **No houses** or street of enclosed shops.
- Native silhouette/proportion language stays compatible with original **21×27 Kez V2**: bare chest, dark shorts, dark purple-brown tousled hair. **Do not redraw the Kez base character from the concept art** or adjust his frame size.
- Distinct moods: inviting firelit camp -> vibrant woodland -> ancient ruin mysteries -> unsettling corrupted Direwood beyond river.

## Existing map decisions override artistic compression

The pictured concept includes decorative labels, an overview and a relatively close river/bridge. This composition is NOT a literal collision layout or instruction to relocate the river beside the camp. Retain the canonical constraints in `design/starter-region-v1.json`:

1. Crater Camp is central, bounded by fractured walls, with one collapsed **southern** land exit.
2. Bramblewood surrounds the outpost, starter gathering/ores and a walkable trail network.
3. Ancient city ruins primarily west/north; goblin mining emergence on the **northeast** route.
4. The beginner fishing river and damaged but **usable** travellers bridge are to the **south beyond the forest**, not inside Crater Camp.
5. Corrupted dark Direwood begins **south of the river**.

Original in-game map `public/myrren-world.js` still has `bridges=[]` and no completed southern river. Concept approval does not authorize moving existing coordinates, changing mining nodes, or altering save/collision compatibility.

## Exactly what this approval does and does not authorize

**Approved:** The displayed picture's broad colour, pixel-art quality, forest density, scenery/prop visual language and overall starter-region atmosphere. Future environment, camp structure, ruins, trees, ores and river artwork should be visually cohesive with it.

**Not automatically approved:** The current proposed 56-tile native terrain atlas in draft **PR #83**, individual prop sprite cells, the two tree/two ore replacement PNGs in draft **PR #82**, fishing sprite rows in draft **PR #81**, object dimensions, character redesigns, final armour appearances, animation maps, or changes to production map coordinates.

A 1536px **concept composition is not a game-ready tileset**. Create exact native 16×16 PNG tiles, transparent prop/item atlases and correct anchor metadata. Do not downscale or crop the concept image to fabricate source sprites. Test new art using real `public/index.html` gameplay screenshots at desktop and 390px mobile; check readability beside unmodified Kez, seams, collisions and animation anchoring. Only integrate art **after separate native-pixel visual review**.

## Next production sequence

1. Harmonise and approve 16×16 terrain under this **locked look** (PR #83 remains draft).
2. Create the **Crater Camp essentials** native prop pack: storage chest, odd-jobs board, open furnace, anvil, campfire, lantern, Trader Gus, horse + wagon.
3. Complete Bramblewood trees and ore source sheets with depleted/respawn states, preserving gathering mechanics.
4. Native riverbank/water/fishing, broken usable bridge, ruins and corruption biome props.
5. Creature/wildlife/pet art. Final armour **skins** remain paused while Work's PR #78 equipment renderer stays the technical foundation.

**No gameplay changes and no draft PR merges were performed by this approval.**
