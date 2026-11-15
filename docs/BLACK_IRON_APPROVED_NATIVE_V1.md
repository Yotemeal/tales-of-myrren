# Tales of Myrren — approved Black Iron concept / native sprite V1
Date: 16 November 2026 (Australia/Brisbane)
Status: **Approved visual concept; native 28×20 reconstruction awaiting in-game visual review. NOT merged/deployed.**

## Visual source of truth
The owner explicitly approved the picture `tales_of_myrren_black_iron_review.png` (SHA-256 `ce2407b2c841d0aea8307c3e97ed87234c40a5004a0f303a448422c37bb3f628`), a two-panel concept image with a large Black Iron rock and a smaller scaled version alongside the olive-clad brown-haired character. This concept is distinct from previous rejected mining asset concepts and from the former 32×24 block-shaped Black Iron pilot.

**Preserve these distinguishing details:**
- One compact, squat, naturally rounded charcoal-grey rock (not stacked square boulders, tall stone pillars, or a faceted mountain).
- Gentle upper-left highlight and front/lower-right darker faces, crisp pixel edges, no gradients at production resolution.
- Two *partly embedded* glossy black mineral/jewel exposures: a small one low on the left, a larger diagonal one on the upper-right face. Mineral highlights are silver/grey glints, not neon.
- A short angular fracture/step across the lower-right face. No spikes, huge protruding crystals, excessive glow or elaborate landscape dressing.
- Stone remains visually lower than the hero while wider than the hero's body.

## Native asset
`public/assets/art-review/black-iron/ore_black_iron_v1_28x20.png`
- Exact **28×20 RGBA, hard-edge pixels, transparent background, 14 colours including transparency**. 412 opaque and 148 transparent pixels, 1 four-connected opaque component.
- SHA-256: `b02a06067cc2137deff34bb0f31eff4764c7f6e61343a7ee7537c82e43d2108c`.
- The approved *character* is the exact V19F 24×32 PNG at `public/assets/myrren-v19f/myrren_front_game_ready_24x32.png`; its SHA-256 is `748ad641d103dc91228327c91abbc058bf685fad21011f809076ed47028c69a2`. Do not modify it.
- With the fixed 2× camera, native hero appears **48×64** screen pixels; this ore would be **56×40** screen pixels if drawn at world 1×.
- This V1 asset was reconstructed directly from the approved pixelated concept by sampling 28×20 grid cells, limiting stone colours and cutting a binary alpha mask. It is a **faithful reconstruction**, not a byte-identical game sprite exported by the image generator. It must be assessed in actual gameplay before claiming visual parity.

## Why this is an isolated artwork-only branch
Previous draft PR #114 had the overly flat V2 multi-ore sprite set; PR #115 had an unapproved blocky 32×24 Black Iron and renderer experiment. **Do not merge either as the final Black Iron source.** This branch begins directly from `main`, with *no changes to* `public/assets/resources/ore_black_iron.png` or gameplay.

In `public/myrren-game.js`, `drawRock` currently applies `ctx.scale(.72,.72)` to all ores; in `public/myrren-environment.js`, `resourceSprite` draws the ore at 24 world pixels wide. For full-size native rendering **after visual approval**, update only the Black Iron (`n.k === 'cobalt'`) path:
1. Load this approved candidate into `public/assets/resources/ore_black_iron.png` or an explicitly mapped equivalent.
2. Select render width 28 for Black Iron (not the current 24).
3. Apply world scale 1 rather than .72 for Black Iron only, maintaining current foot/ground anchor and nearest-neighbour sampling.
4. Keep `cobalt` as Black Iron's current **internal** resource ID; do not rename in saves or break existing equipment.
5. Preserve other ore rendering, mining hit/dust effects, collisions, selection, XP, forging recipes, saves, gameplay, fixed 2× camera, pets and approved character atlas.
6. Test crowded node placement, occlusion and collisions on phone and desktop before any merge.

## Review and test
- Open `/black-iron-approved-native-review.html` when hosting the **branch's** `public` directory. It shows the exact sprite at native 2× beside the locked V19F front master, and a nearest-neighbour zoom.
- Run `node --test tests/black-iron-approved-native-art.test.cjs`. This is an art-source integrity test, **not** an in-game rendering test.
- The same pixels and full visual reference comparison are in the conversation review ZIP; the approved concept image is not a production sprite.

**Next:** owner reviews V1 native preview at 2×; if accepted, integrate only the Black Iron image/renderer with focused render and gameplay tests on a distinct follow-up branch/commit. Other seven ores remain untouched.
