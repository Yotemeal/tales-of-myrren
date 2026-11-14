# Tales of Myrren — V19B Character Asset Lock & Integration Handoff
**Date:** 15 November 2026 | **Repository:** Yotemeal/tales-of-myrren

## Approval and source of truth
- The user accepted **V19B** on 15 Nov: “Perfect that’ll do for now”; treat this exact four-direction movement as the **current accepted working baseline**, not a final game deployment approval.
- **Front/back final visual and motion targets** are the two original GIFs supplied by the user. Their SHA-256 checksums are in `manifest.json`. They show **small visible hands from behind** (do NOT hide them). No redesign, re-mirroring, forced symmetrical boot steps or procedural pixel corrections.
- **V5 native left/right** six-frame animations and eye proportions were explicitly approved earlier and are LOCKED. The 12 original native PNG checksums are in `manifest.json`; copies in V19B were checked byte-for-byte.
- Master design: original 24×32 front sprite, layered medium-brown hair, white eyes with black pupils, cheek scar, olive cloak/gold clasp, tan shirt, brown belt and boots. Do not replace it with older prototypes.
- **V19B's native atlas and idle atlas are staged in this branch** with exact original PNG bytes. Original GIFs, V5 ZIP and frame-by-frame previews are retained in the standalone handoff archive; they are NOT uploaded to this branch as GIF binaries.

## Native asset contract
- Walk atlas `public/assets/myrren-v19b/myrren_walk_4x6_native.png`: **144×128**, cells **24×32**, **6 columns × 4 rows**.
- Row 0 = front/down, 1 = left, 2 = right, 3 = back/up. No forced mirroring.
- Frame cadence = **110 milliseconds** per frame; 660 ms full cycle; continuous time index `Math.floor(now/110)%6` when moving.
- Idle atlas `public/assets/myrren-v19b/myrren_idle_4dir_native.png`: **96×32**, 4 cells in the same direction order.
- Standalone approved original front-facing `public/assets/myrren-v19b/myrren_front_game_ready_24x32.png` preserved for reference.
- Alpha transparency and nearest-neighbour pixel rendering. Preserve each **full 24×32 cell** on a fixed anchored canvas; never dynamically recenter by visible bounding box per animation frame. Keep frame registration consistent, including feet. Do not shift limbs or hair to satisfy a renderer crop.
- See `public/assets/myrren-v19b/manifest.json` for SHA-256 locks and all twelve V5 side PNG hashes.

## CURRENT LIVE CODE INSPECTED ON MAIN
At the time of handoff, `main` HEAD was `9b9b03710070ea38c5c2b83e14a24f6ebe232d88` (merged PR #97, fixed camera).
- **Canonical game entry** is `public/index.html`; root `index.html` is a retired redirect/notice.
- `public/myrren-game.js` calls `drawKezV2()` for players/peers.
- `public/kez-v2-atlas.js` currently expects **21×27**, 4 frames per direction, **130 ms** moving cadence; it computes bounding boxes and re-centres visible pixels to planted feet. Those assumptions must **not** be reused for V19B.
- `public/kez-v2-equipment.js` draws older **21×27** gear layers. These do **not** automatically align with 24×32. Existing weapon/hand sockets are tuned for the previous sprite; do not treat them as approved for the new character.
- `public/index.html` loads `/kez-v2-atlas.js`, `/kez-v2-equipment.js`, `/kez-v2-sword-motion.js`, then `/myrren-game.js`.
- Camera PR #97 is already on main; maintain fixed 2× camera, no pinch zoom or panning. Do not change camera to compensate for sprite dimensions.

## Next engineering work, in order
1. **Write a new 24×32 / six-frame character renderer adapter** on this branch using only these locked assets. Keep its frame-selection logic separate from the legacy Kez V2 atlas. Treat feet as one fixed cell anchor. Direction mapping from current game: `dv==='d'` front; `dv==='u'` back; `dv==='s' && f<0` left; otherwise right. For stationary idle use the corresponding idle atlas frame. Never crop/auto-center the visible pixels per frame.
2. **Exercise the adapter in an isolated browser preview / opt-in harness first.** Show genuine 2× gameplay-scale captures. Keep production `public/myrren-game.js`, `public/index.html`, player saves and camera unchanged during this step.
3. **Plan a 24×32 equipment/attack/hurt/socket pass**, explicitly checking swords/shields, six-slot gear, back shield depth, combat and unarmed actions. Old equipment cannot be silently overlaid at the wrong scale. Player and remote players must use a consistent renderer after approval.
4. Run checks: `node --test tests/myrren-v19b-assets.test.cjs`, `node --test tests/fixed-camera.test.cjs`, existing `tests/kez-v2-rendering.test.cjs` and other save/combat/multiplayer regressions. Then real browser screenshots, iPhone Safari, multiplayer.
5. Only after visual and gameplay verification and **explicit user approval** propose a merge. **Do not merge, deploy, or change the live camera**.

## Why this branch currently does NOT modify the live game
It preserves the precise accepted artwork before any risky renderer swap. The 24×32 source cells, six-frame animation cadence, equipment anchors and camera semantics must be integrated together. A direct sprite replacement of the 21×27 Kez V2 file would be a regression.

**Next chat:** Start with this document and its manifest. Treat these staged files as the current character movement baseline, NOT V9/V12/V18 or an earlier experiment. Original detailed conversation/handoff ZIP remains available outside GitHub.


## Isolated V19B native renderer — staged for testing
The same feature branch now also contains:
- `public/myrren-v19b-atlas.js` — separate 24×32, six-frame native adapter, 110ms cadence, no visible-bound auto-cropping, fixed cell/foot anchor, no Kez fallback.
- `public/character-v19b-preview.html` — isolated 2× CSS-scale walk/idle inspection page; does NOT load game, saves or multiplayer.
- `tests/myrren-v19b-renderer.test.cjs` — four Node VM tests for load/failure, frame/row timing, fixed draw rectangles and 24×32 assets.

The four Node adapter tests passed locally (Node 22). A headless Chromium screenshot attempt was blocked by the execution environment and did not produce a screenshot; **browser playback, real iPhone and multiplayer remain unverified**. The production `public/index.html`, `public/myrren-game.js`, `public/kez-v2-atlas.js`, equipment and camera remain unchanged. No PR, merge or deployment.

## Follow-on QA (15 Nov 2026)
- Ran V19B's **unaltered isolated renderer JS and PNGs** through Chromium using an in-memory asset URL shim because the execution environment blocks navigations to localhost and file:// pages.
- All **three canvas configurations passed**: 852×393 landscape at DPR3, 393×852 portrait at DPR3, and 1280×720 desktop at DPR1. Sprite animation changed frames; pause produced stable idle frames; browser JavaScript errors: none. Canvas CSS scale stayed exactly **2×**.
- Initial portrait preview made the page wider than its viewport. Adjusted ONLY the isolated preview HTML to provide horizontal scrolling for the 384-pixel-wide, 2× canvas; no scaling or blur.
- Added `tests/myrren-v19b-pixel-lock.test.cjs` and fixture `tests/fixtures/myrren-v19b-native-rgba-sha256.json`. It decodes PNG RGBA8 with Node built-ins, verifies the exact raw RGBA SHA-256 of **all 24 accepted V19B frames**, binary alpha and connected silhouettes, and the unchanged front/back upper body. Local combined tests: **7 passed, 0 failed**.
- This was a **Chromium in-memory canvas test**, NOT an HTTP website navigation, in-game test, iPhone Safari, multiplayer, or armour test. No runtime integration, merge or deployment.
- No user action needed until an accessible test build is intentionally prepared. Do not ask the user to open the opt-in preview on the production domain: it is staged only on the feature branch, not deployed.

## Opt-in in-game visual bridge (branch-only, not deployed)
- `public/character-v19b-game-preview.html` is a copy of the canonical `public/index.html` with **two extra script imports and a small test notice**. The canonical production HTML remains untouched.
- `public/myrren-v19b-optin-game-bridge.js` is loaded ONLY by that preview page and temporarily replaces the **draw method** of the legacy atlas object in memory, without modifying the game state.
- V19B is shown ONLY when the entity is unarmed, unequipped, not attacking and not flagged dead; other poses use existing Kez V2 to avoid mismatched 21×27 equipment. This is deliberately a **partial visual integration test**, not a final armour, combat or multiplayer renderer.
- `tests/myrren-v19b-optin-game-bridge.test.cjs` tests route selection, state immutability and idempotence. All **3 local bridge tests passed**, alongside the 7 existing V19B tests (**10 total, 0 failed**).
- No in-game browser capture yet: complete game navigation/integration remains unverified; physical iPhone Safari and multiplayer remain pending. Do not claim otherwise.
- No PR, deployment or merge. Ask for user approval before publishing any preview externally.


## Preview integration hardening (15 Nov 2026)
The opt-in preview exposed a real state contract bug: `drawKezV2` resolved the local player's death from `me.deathAt` but passed only raw player options to the atlas adapter. During death the new walking sprite could remain visible.

**Feature-branch-only correction:** `public/myrren-game.js` now resolves `deathAt` and `hurtAt` once and includes both in the renderer `state` object. The old drawing logic still uses exactly the same time values and composition. This is a small, targeted runtime source edit ON THE FEATURE BRANCH ONLY; production main remains unchanged.

**Safer preview bridge:**
- V19B only for `tool==='fist'`, exactly six zero equipment slots, no active swing, no death, no active hurt, and explicit resolved state.
- Unsafe or unsupported states (including gear portraits) continue using Kez V2 visuals. This remains a TRANSITIONAL opt-in bridge, not an approved final combat/equipment renderer.
- An on-page V19B/Legacy comparison toggle was added to `public/character-v19b-game-preview.html`. It affects only local renderer selection for the preview; never saves or sends this setting.
- The test toolbar now exists before asset scripts, so early ready/error events have a visible status target.

**QA:** 11 local tests passed in aggregate: 4 new bridge cases + 7 prior native atlas/asset tests. Four composition tests passed against a local extraction of the `drawKezV2()` function; the committed composition test also runs against the actual `public/myrren-game.js` file when executed in the checked-out repository, but the full repository/CI test run has NOT been performed here.

**Remaining gates:** Actual full-game Chromium playthrough and screenshots, browser navigation to a served preview, preservation of data on an isolated preview hostname, physical iPhone Safari, multiplayer, attacks and all equipment alignment. No merge, PR or deployment without explicit approval.

## Production-candidate wiring (NOT YET MERGED/DEPLOYED)
The user authorized integration into main **only if tested safe**. The feature-branch candidate loads the V19B native atlas and compatibility bridge before the game script in canonical `public/index.html`. The runtime build marker and script cache bust are both bumped to v92. The merged #97 fixed 2× camera is untouched. Save schema, gameplay movement, collision, combat and multiplayer protocol are untouched.

On all unarmed, unequipped, healthy/non-attacking players and peers, accepted V19B 24×32 walking + idle is drawn. Combat, injury, death, worn gear and held tools continue using existing 21×27 Kez V2 art, **so visible size/style changes are expected on these transitions** until new 24×32 combat/equipment overlays are ready.

Safety fallback: while V19B assets load or fail, game continues drawing Kez V2. A failed load emits an error and one fall-back event. `?character=legacy` forces Kez V2 for the full page session and cannot modify game saves. Asset files, V5 side frame hashes and V19B raw RGBA frames remain locked unchanged.

No merge until actual full-game browser validation and relevant CI (self-hosted runner) pass; no claim of physical iPhone or live multiplayer verification. No main-line changes yet.
