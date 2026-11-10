# Tales of Myrren — art rebuild brief (2026-11-11)

**Status:** Direction approved for implementation planning. **No new art is approved yet.** This branch must not replace production character, armour or resource assets until visual QA has passed.

## Design intent

A compact, legible, hand-authored 2D pixel RPG with the approachable feel of a classic gathering/combat MMO. Inspired by the readability and rewarding gathering of Curse of Aros, but develop original artwork, identities and systems. Avoid dense effects, over-detailed sprites and cash-shop-style visual noise. User-supplied **Kez V2** character is the visual anchor; the supplied ore cluster silhouettes are the approved direction. User-supplied seven-set armour chart is a **design reference**, not a wearable, frame-aligned spritesheet. Existing trees and fishing effects require substantial improvement.

## Verified production architecture (main at review time)

- Deployed entry: `public/index.html`, not root `index.html`.
- Active character: `public/assets/kez-v2/kez_v2_atlas.png`; 84×162 overall, 4 columns × 6 rows, **21×27 per native frame**. `public/kez-v2-atlas.js` anchors all frames to the planted feet. Row 0 idle, 1 front walk, 2 back, 3 left, 4 right, 5 side attack. Do **not** replace this with discontinued V31/64px character artwork.
- In-world armour: `public/kez-v2-equipment.js` draws programmatic overlays at **21×27**. Slots are `[head, body, legs, boots, shield, gloves]`, rendering the shield under the body in side views. Current overlays are **unapproved temporary fitting art**, despite functional tests.
- Front-only seven-tier full-body reference: `public/assets/kez-v2/smithing_armour_front_atlas.png`, **176×276 per figure**. Metadata: `smithing_armour_front_atlas.json`. Do not crop this directly onto the 21×27 walk/attack frames. **Latest approved Myrrenite helmet close-up supersedes the reference sheet's helmet:** teal plate, vertical gold crest/diamond, continuous gold brow, dark T-visor, cheek guards.
- Ore files: `public/assets/resources/ore_*.png`; environment draws ore at **24 pixels wide**, preserving aspect ratio.
- Tree files: `public/assets/resources/tree_*.png`; `public/myrren-environment.js` draws all standing trees at **144 pixels wide**, preserving aspect ratio. 24 animated horizontal slices create gust movement; this can visibly distort canopy/trunk. Resource positions and stump state are authoritative game data, not visual-only.
- Fishing: `public/myrren-environment.js::fishing` currently draws three small shoal pixels, two partial rings and occasional sparkles; improve within existing spots and cooldowns.
- World tile size: **16 game pixels**. Character collision, gathering distances, in-world coordinate system, health bars, save equipment IDs and multiplayer positions must remain intact.

## Phase 1 — solve armour properly before remaking the world

**Decision:** Do **not** brute-force scale the 176×276 reference into 21×27; do **not** silently upscale the Kez V2 base or change world zoom. First prototype a **new hand-authored native 32×48 character + equipment layer art budget**, preserving the Kez V2 head/hair/face identity and chibi proportions. This is a provisional visual hypothesis, NOT an approved renderer replacement, world footprint or collision change. Compare against existing 21×27 in a real game scene at 1× and 2× phone zoom. If 32×48 looks oversized versus a 16px tile or loses Kez's look, evaluate an intermediate native-resolution proposal before integrating. A larger canvas with padded empty pixels is NOT equivalent to more art detail.

Prototype **Bronze (2)** and **Myrrenite (6)** first, as low/high complexity extremes. Art must be genuine pixel art, not interpolated photographic concept crops. Author full front, back, left and right for idle, walking, bare-fist attack, sword attack and death before final renderer integration. Share one pixel grid, one character centreline, one foot baseline, and per-pose sockets.

Armour piece layers:
1. Helmet (open-face Bronze, full-face Myrrenite), obey hair/eyes and faceplate depth.
2. Chest with **arm-attached** pauldrons, never a fixed rectangle floating across the face.
3. Gloves and dominant-hand grip sockets.
4. Leg armour per thigh/leg so knees move while walking.
5. Boots on planted feet without sliding.
6. Shield on the **off-hand**. Side view: thin shield profile behind the character, not a face-on floating shield; rear/front views order by depth.
7. Sword on dominant hand with hand covering the grip. Avoid duplicate blade or baked-in slash.

Keep independent equipment slots; Bronze head + Steel chest + Iron legs + Starsteel boots + Myrrenite shield + Obsidianite gloves must all fit correctly. High-tier dyes tint accents only, not canonical metal or gold/visor features. Don't alter all seven item IDs: **2 Bronze, 3 Iron, 4 Steel, 5 Black Iron, 7 Obsidianite, 6 Myrrenite, 8 Starsteel**.

Tiers: Bronze warm hammered copper; Iron muted neutral metal; Steel cool blue-silver; Black Iron charcoal/eggplant with restrained mauve; Obsidianite deep violet/magenta; Myrrenite teal/gold with distinctive full visor; Starsteel ivory-white/gold with a different helmet/chest silhouette, not only brighter colouring. These are palette/silhouette goals, not permission to change progression.

**Exit gate:** side-by-side screenshots of all 7 full sets, all 4 facings, idle/walk/fist/sword, shields and mixed slots. User-approved before replacing production renderer. Must pass `tests/kez-v2-rendering.test.cjs` or updated equivalent **plus** manual phone-size screenshots.

## Phase 2 — trees (after scale is approved)

Use the supplied ore/resource style as a consistency anchor. The game has species art files for bramblewood, alder, ironbark, elderthorn, starroot, redleaf and duskwillow. Distinguish trees by **silhouette and canopy structure**, not just recolouring a generic blob. Cluster foliage naturally, use a grounded trunk, branch highlights and consistent outlines. Elderthorn larger, fuller and ancient-looking. Make species-specific native sizes instead of a universal 144px width **after** validating gameplay spacing against actual character, doors, paths, collision and canopy occlusion. Keep interactions based on trunk footprint, allowing canopy overlap and transparent fade when the player walks underneath.

Replace horizontal-band gust deformation with stable trunk and hand-authored, low-amplitude canopy/leaf motion, ideally separate overlays. Sparse, staggered falling leaves only; no visual seam, tearing, obvious looping or flicker. Preserving transparent edges is mandatory. Do not silently affect cooldowns, forestry XP, wood yield, or spawning.

## Phase 3 — fishing spots

Render modest, believable activity rather than a continuous glow ring: occasional small underwater silhouettes with coherent swim directions, surface ripples on intervals, tiny intermittent bubble trails / a surface break. Species/type can affect darkness and motion, not confusing gameplay colour coding. Keep spots legible at 1×, avoid screen-filling particles, and keep animations deterministic per node. Remove ripple/alpha state leakage so other world rendering isn't affected. No changes to fish types, XP, cooldowns, inventory, catches or water geometry.

## Phase 4 — world consistency

Compare in the SAME screenshot: base character, Bronze/Myrrenite armour, ore, trees, water/fishing, doors, buildings, foes, pets and UI. Priorities: visual scale → silhouette language → pixel density → restrained palettes → animation quality → performance. Do not independently upscale assets to solve perceived size mismatch. Test near water, crowded tree clusters, behind foliage, on bridges and at the camp village.

## QA and integration discipline

- Use a review branch and independent preview page. Keep `main` playable.
- Preserve any working saves, item IDs, multiplayer render state, collision, world positions, skill levels, gathering progression and equipment logic. No sweeping renderer rewrite until reference prototypes pass.
- Native pixels must be drawn with `imageSmoothingEnabled = false` and consistent integer anchors. If display zoom is fractional, measure resulting pixel sizes and eliminate shimmering.
- Run `node --check` on new JS, focused renderer tests, armour/sword and save tests, then browser automation and **actual screenshot review**. CI passing alone is not pixel-art approval.
- Assess idle, walk, attacks, death, no shield, shield, mixed sets, portrait, dyed variant, player vs remote multiplayer peer, zoom 1×/2× and resource overlap.
- Do not label visuals "finished" until screenshot review. Keep a short before/after QA note with actual artifacts, not claims.

## Safe first execution

1. Open `/art-fit-lab.html` from a preview build of this branch. It intentionally renders the **current** live armour and reference without swapping anything in production.
2. Hand-author Bronze and Myrrenite 32×48 proof-of-concept sprites with front/back/left/right pose layers in a separate assets directory. Compare against the current character and world to decide resolution.
3. After art-scale approval, implement data-driven piece masks/frames and equipment depth sorting for all seven tiers. Then tackle trees, fishing and integrated world QA.

**Do not deploy this branch's art placeholders as replacement production sprites.**

## Working prototype delivered on this branch (2026-11-11)

An independent, *unapproved* 32×48 native-pixel demonstration now exists.

- `public/art-prototype-32x48.js`: original source-grid pixel painting, with separate helmet, body, gloves, legs, boots, shield and sword layers. Two trial materials, Bronze (2) and Myrrenite (6), including mixed-tier composition, four actual facings, four walk-frame phases and distinct sword-strike poses. The character is an **experimental Kez-like redraw**, not an approved copy of the Kez V2 atlas.
- `public/art-prototype-preview.html` and `art-prototype-preview.js`: a self-contained visual review of front/left/right/back idle, walking, fists and sword; 16-pixel world tile comparison with the current 21×27 sprite; no writes to saves.
- `docs/art-review/bronze-myrrenite-directions.png`: programmatic contact sheet rendered from the prototype JS. Rows: Bronze, Myrrenite. Columns: front, left, right, back (idle).
- `docs/art-review/bronze-myrrenite-motion.png`: programmatic contact sheet rendered from the prototype JS. Rows: Bronze, Myrrenite. Columns: front idle, front walk, front fist, front sword impact.
- `tests/art-prototype-32x48.test.cjs`: checked 128 tier/direction/motion/frame combinations; integer source pixels; source-image isolation; authentic Myrrenite front T-visor vs back plate; no modification of six-slot input; four distinct sword poses. New test and JS syntax checks are connected to `.github/workflows/kez-v2-regressions.yml`.

**Scope is strictly research/art QA.** This prototype does not load in the production `public/index.html`. The live 21×27 Kez V2 character, seven real armour tiers, existing functional paperdoll test pipeline, saves, multiplayer and combat remain intact. 32×48 may prove too large relative to 16-pixel tiles; don't promote it without phone-size review.

**Known limitations:** Front and side motion silhouettes are authored but need a professional art pass against the user's supplied base character; high-level gear detail needs better per-material artistic rendering. Directional sprite walking, shields, sword attacks, death, dyes and remote players still require integrated production tests if this art scale is selected. Only the pixel logic was exercised in a V8 harness; at this point CI browser/device approval is still pending.

## Next Work execution

Compare the existing experimental 21×27 export from `scripts/build-kez-v2-paperdoll.py` against the new 32×48 hand-authored proof. **Neither is automatically approved.** Prefer the smaller solution if it offers comparable readability at actual game zoom; never independently upscale source parts. If the prototype passes the scale/style checkpoint, replace the placeholder anatomy with authored full four-direction frame assets, then implement the independent equipment atlas while keeping the old renderer behind a preview feature flag until QA passes.
