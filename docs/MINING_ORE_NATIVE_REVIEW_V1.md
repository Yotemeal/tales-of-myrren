# Tales of Myrren — Eight native ore sprites (visual review only)
**16 November 2026. Status:** 7 new native-art candidates + 1 byte-identical approved Black Iron art reference. **Do not merge/deploy without a yes/no decision.**

## Exact visual contract
- Eight individual native PNG files, **28×20 RGBA**; transparent background; nearest-neighbour display. The review board uses enlarged pixels, not downsampled fantasy illustrations.
- The approved 24×32 V19F hero remains locked and unchanged. At fixed camera 2×, a 28×20 ore would occupy 56×40 screen pixels if rendered at world 1×. This is a **scale mock-up only**, not a screenshot from the running game.
- The owner approved a **squat rounded rock** with small **embedded jewel/mineral exposure** (not protruding fantasy crystals, huge glowing veins, or angular stacked slabs). Black Iron's previously approved actual native sprite is preserved byte-for-byte.
- Shapes: copper squat mound, tin twin-lobed low rock, iron broader heavier boulder, coal small jagged pile, Black Iron owner-approved round rock, Chromium long low rock, Iridium higher crest, Myrrenite compact dark boulder. Mineral colours are earthy copper, pale silver, rust, charcoal, glossy black, violet-grey, silver-blue and turquoise.
- Approval is **individual**; the new seven are candidates until owner judges the complete set.

## Safe staged source
All new ore images are only in `public/assets/art-review/mining-ores-v1/ore_*.png`. The original reference remains at `public/assets/art-review/black-iron/ore_black_iron_v1_28x20.png`. Production `public/assets/resources` ore PNGs, the mining renderer, player camera, collisions, gathering/forging mechanics, inventory and saves remain unchanged.

**Important production mapping:** The game's legacy `cobalt` resource key represents Black Iron and `aether` represents Myrrenite; current gameplay also contains Obsidianite and Meteorite/Starsteel. Chromium and Iridium are *proposed new art labels*, **not** safely migrated gameplay names. A later, separately approved implementation must preserve item/save compatibility, recipe and XP gates, unlocks, node distribution and combat equipment tiers.

## QA completed
- Local Pillow inspection verified every PNG 28×20 RGBA, binary alpha, single connected opaque component, no more than 16 colours per sprite, unique SHA-256 identities.
- Exact SHA-256 manifest is `docs/mining-ore-native-review-v1.json`.
- Owner-approved Black Iron's SHA-256 stays `b02a06067cc2137deff34bb0f31eff4764c7f6e61343a7ee7537c82e43d2108c`.
- Exact V19F hero checksum stays `748ad641d103dc91228327c91abbc058bf685fad21011f809076ed47028c69a2`.
- Targeted repository test: `node --test tests/mining-ore-native-review-v1.test.cjs`.
- Isolated browser page for visual review: `public/mining-ore-native-review-v1.html`. **No physical iPhone QA or live in-game visual test claimed.**

## Next
Await owner yes/no on eight-sprite artwork, refine individually if needed, then integrate full native set with world renderer once art is accepted. Do not assume 28×20 files automatically render at intended 2×: current game has a secondary `ctx.scale(.72,.72)` on ore draw calls, which must be assessed before production implementation. Prior draft PRs #114/#115 contain **rejected** artwork and must not be merged for this purpose.
