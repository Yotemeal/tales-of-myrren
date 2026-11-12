# Tales of Myrren — Work handoff and obsolete-branch audit (12 November 2026)

**Status:** Documentation + isolated mobile-QA diagnostic branch; **not a game, sprite or world update**.

## Current repository baseline

- Production branch: `main` at `b72186c9b756c78c0c63bfb055ef8935aa0cec39`, last game release change PR #74 (mining 6-yield veins/v84).
- Work's active draft: **PR #78** (`art/kez-v2-equipment-foundation`), 21×27 Kez V2 equipped atlas foundation, experimental `?bronze-proof` switch. It contains **PNG-based** Bronze gear proof layers, character punch/sword/collapse proof sheets, frame/feet socket metadata, and appearance state for peers. The team has **not approved its artwork or merged it**.
- Original Bronze exploration: PR #76, draft. PR #78 explicitly incorporated its experimental Bronze asset reference; **do not independently merge #76 or duplicate its renderer**.
- World-scale concept: PR #77, draft. Includes reference-size contracts and an isolated scale lab. It is **not** new production 16×16 terrain art, trees, ore art or map geometry.
- Old experimental 32×48 work: PR #75 closed unmerged; **do not resurrect 32×48/44×69 Kez base** merely to fit higher-detail armour concepts. Current brief preserves 21×27 native body unless user expressly approves a resize.
- Boss architecture: PR #72, draft; server-authoritative combat & loot entitlement is a separate unfinished technical stream. **Do not merge with character or environment graphics by default**.
- Early creature/pet concept: PR #24, draft; references the original roster, skilling pets and isolated preview logic, **not complete mainline implementation**. Its `public/myrren-game.js` predates later Forging and mining updates.

## Why the latest CI job failed

Mainline integrity on PR #78, workflow run **43123904962**, has **core PASS, mobile FAIL**. Actual self-hosted Linux runner job log:

```
node tests/mainline-mobile-hud.test.cjs
page.waitForFunction: Timeout 30000ms exceeded.
at tests/mainline-mobile-hud.test.cjs:106:18
```

At line 106 the mobile test has clicked `[data-ui-open="gear"]` but the `#modal` element remains hidden. This does **not** establish that the actual player gear system is broken: the test fixture restores a player at `x:100,y:100`, outside the protected camp around `(800,800)`, and keeps the game running through a save-conflict test before opening the menu. The game deliberately rejects opening a menu while the player is dead (`openModal(t){if(me.deathAt!=null)return;...}`). Combat/death is a **plausible hypothesis**, not proven by the old log. The old test also supplied `{timeout:5000}` as Playwright's *second*, rather than *third*, `waitForFunction` argument; that meant the default 30s timeout was used.

**This branch's narrow, non-gameplay test changes**:

1. Restore test player at `(800,840)`, the standard sheltered camp respawn point; keep all save, inventory, cross-tab conflict and UI assertions intact.
2. Pass the timeout as the actual third Playwright argument.
3. If opening equipment still fails, capture real browser diagnostics (modal hidden state, target hit-testing, toast status, HUD/intro visibility) and `/tmp/myrren-*-equipment-open-failure.png`.
4. Upload failure captures using the existing `myrren-mobile-hud-qa` artifact action.

**Do not mark the underlying issue as resolved** until this workflow completes successfully on GitHub; do not copy this test adjustment directly into Work's draft without comparing branches.

## Current approved vs unapproved art decisions

**Approved for visual direction, not shipped as native sprites:**
- Original **bare-chested** Kez identity: tousled dark purple-brown hair, simple face, dark shorts. 21×27 live Kez V2 atlas remains authoritative for positions and frame order. Do not use newly generated *blue shirt* characters.
- Seven existing metal tier names: Bronze, Iron, Steel, Black Iron, Obsidianite, Myrrenite, Starsteel. **Meteorite is mined then used to produce Starsteel**. Material IDs/saves are fixed in game; never introduce extra metals from AI concepts.
- Compact, readable Curse-of-Aros-inspired **proportions only**, not copied art, imported CoA files, bulked-up pseudo-3D equipment or procedural armour substituted for native sprites.
- Existing original woodland reference concepts: Bramblewood, Alder, Ironbark, Elderthorn, Starroot; original ore cluster visual references, plus Coal and the other three resources. User has explicitly requested visual review before implementation.

**Story/world design decisions:**
- A small Crater Camp **survivor outpost**, **no houses**: Traveller Gus with horse/cart, open blacksmith furnace/anvil, odd jobs board, central storage, essential supplies, rest fire.
- Crater walls and ancient ruined city fragments around the camp; southern forest exit.
- Dense beginner woodland with Copper, Tin and early Iron resources, wildlife and low-risk enemies outside the camp.
- Northeast path to goblins emerging near mining tunnels and disturbed ancient ruins.
- A river with basic fishing, a damaged **usable** southern travellers' bridge, and a visibly dark corrupted Direwood beyond the southern waterline.
- The current game does **not** implement that whole concept map: `public/myrren-world.js` currently defines `bridges=[]`, `bridge=null`, `onBridge() => false`, a lake around `(1250,1055)`, and five service-building footprints. **Do not report the concept bridge, river boundary or Direwood as live gameplay.**

## Next safe development sequence

**Work should finish PR #78 first:** identify the actual Kez V2 base identity, validate body/helm/weapon/shield attachment sockets in all directions, demonstrate bare and Bronze modes at native scale in actual browser screenshots, and verify remote-player appearance, save state, death, UI and all CI. Do not add all tiers or merge before user sees the real screenshots.

**Visual design stream after that:** author a tiny, reviewable **original native-pixel** starter-region vertical slice: a seamless 16×16 grass/grass-to-path/worn path set; two trees (Bramblewood/Alder); two 20–24px copper/tin rocks; a mossy ruin pillar and fallen log. Use the approved Kez bare sprite as a fixed *scale ruler*. At 1×/2×/mobile screenshot sizes, ensure readable terrain, consistent native pixel density, clear character and interactive-resource silhouettes. Do not downscale 150px ore paintings into 17px PNGs or stretch square tree PNGs and call that production art.

**Map integration comes last:** preserve save coordinates, interactive object IDs, combat, server authority and node economy. Draft a new connected map layout and migration plan before actually moving the fixed world geometry or opening the river crossing.

## Release gates

- Mobile and desktop browser checks show the real `public/index.html` runtime; CI is green, no save/inventory regression.
- No weapon in the wrong hand; side shields appear in profile rather than facing forward; equipment follows movement, hit and collapse frames.
- Source sprite files exist as real native-alpha PNGs with reproducible manifests, not reference-board crops or procedurally painted approximations.
- No collision/path/map/saved-position alterations inside a visual preview PR.
- Work and art changes are isolated; PR #78 owns equipment; this branch owns only test diagnostics and project status.

**Do not merge experimental branches automatically.**
