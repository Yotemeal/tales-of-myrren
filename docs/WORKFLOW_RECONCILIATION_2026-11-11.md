# Tales of Myrren — Work handoff and obsolete-work audit
**Reviewed:** 2026-11-11 (Australia/Brisbane)  
**Production authority:** `main` at `b72186c9b7` (merged PR #74).  
**Review method:** compared the current main source, existing documentation, GitHub merge history, open PR diffs and GitHub Actions status. Original Work chat internals are not a substitute for repository verification.

## Rules for continuing safely

- Keep the existing **21×27 Kez V2** player sprite `public/assets/kez-v2/kez_v2_atlas.png`, current player/remote renderer, seven material IDs **2/3/4/5/7/6/8**, item/save schema, Cloudflare entry point `public/index.html`, and real character equipment slots. Do not introduce retired V31/V3 art as a fallback.
- The current production **procedural** worn armour is unapproved visually. Introduce **authored transparent PNG equipment layers** on an isolated branch, with existing character and native frame size as the source of truth. No 32×48 replacement character is approved.
- Do not automatically merge old branches into `main` (especially #24/#33); older `myrren-game.js` snapshots lack newer forging, mining and combat changes. Migrate selected assets/modules with explicit comparison and regression tests.
- Keep reviewed, authored visual references and existing pet/item IDs; do not overwrite user-approved source images merely to make overlays line up.
- Work only on small branches, with reproducible asset metadata, clear non-production previews, tests and real-game screenshots before merge.

## Already shipped on main — do NOT schedule again as new work

| Old request / earlier plan | Verified current state | Action |
|---|---|---|
| Fix starter ore disappearing after first hit | PRs [#73](https://github.com/Yotemeal/tales-of-myrren/pull/73) and [#74](https://github.com/Yotemeal/tales-of-myrren/pull/74) merged. Copper/tin currently sustain **6 successful ore awards** per vein, with tiered counts on other rocks; mining script cache bumped to v84. `public/myrren-game.js` has `vein` resource definitions. | **Done.** Test live browser caches if the game still shows one-hit depletion; don't rebalance from old test assumptions. |
| Add better pickaxe speed and early mining success | Included in #73, with pickaxes faster by tier and copper/tin base chance 42%. | **Done.** Gather measured session data before changing again. |
| Add/repair furnace and anvil batch interfaces | #59, #60, #63 merged; dedicated Smithing workstations are on main. | **Done.** No duplicate interface needed. |
| Improve Smithing/skill XP and full-set cost planning | #61, #62, #69 merged, including set-material deficit planner and achievable high-tier gates. | **Done provisionally.** Observe actual travel/XP before another broad XP rebalance. |
| Basic boss loot duplicates / contributor-weighted roll core | #71 merged; shared reward distribution is a *local/pure model*, not real multiplayer; coins and solo boss loot already exist. | **Done locally.** Do not reimplement independent browser-side group payouts. |
| Melee target-locking, kiting, health bars, hit/death feedback, warning circles | #50–#58 and #70 merged to main. | **Done for present client combat.** Server authority remains separate. |
| Remove redundant minimap, canonical game delivery, save conflict prevention | #36–#49 merged; `public/index.html` is canonical; old root file is retired. | **Done.** Do not resurrect duplicate root code or a minimap. |
| Kez V2 facing idle and correct sword swing | #26, #32, #34, #35, #39, #40 merged; currently `public/kez-v2-atlas.js` is authoritative. | **Done functionally.** Worn armour image quality still unfinished. |
| Forest chopping/regrowth and Fishing/Cooking feedback | #65 and #66 merged. | **Gameplay feedback done.** User-requested tree and fishing **art replacement** remains open. |
| Rare ore south-west route and in-game full-set calculator | #68 and #69 merged. | **Done.** Preserve resource positions/counts unless a measured gameplay issue requires a change. |

## Obsolete or superseded PRs (closed without merge)

- **[#30](https://github.com/Yotemeal/tales-of-myrren/pull/30), directional idle:** old opt-in preview implementation is superseded by later merged Kez V2 idle PRs #34/#35/#39/#40; do not merge its older renderer diff.
- **[#31](https://github.com/Yotemeal/tales-of-myrren/pull/31), Kez V3 art study:** documentation-only and its 32×48 out-of-repo concepts are not approved game art; superseded as an active direction by preserving Kez V2.
- **[#33](https://github.com/Yotemeal/tales-of-myrren/pull/33), authored larger character:** its own PR notes visually inadequate 32×48 silhouettes. It holds useful *research and tools*, not approved art, and must not replace live characters.
- **[#75](https://github.com/Yotemeal/tales-of-myrren/pull/75), later 32×48 Bronze/Myrrenite attempt:** explicitly rejected by the user. Keep its commit history as a reference but do not merge or claim the sprites are approved.

Closing a superseded PR is only housekeeping; GitHub branches/commits remain available. It does **not** delete historical experiments, approve a new design, or affect `main`.

## Unfinished, valuable Work streams — preserve

### 1. [#72 Server-owned boss combat](https://github.com/Yotemeal/tales-of-myrren/pull/72)
- The branch includes simulated trusted-session command validation, player positions and health, server-owned Cave/Aether bear combat, a transactional room/outbox/account ledger, proof-of-concept Durable Objects, authentication adapter, and offline tests. All live boss enemies on main **remain browser-owned**, with presence-only multiplayer.
- Keep the separate branch, never merge the server prototypes directly into the static asset deployment. It requires trustworthy persistent player/account progression and inventory, actual Cloudflare Durable Object lifecycle, authentication/security, end-to-end client integration and two-device/reconnect testing.
- Next safe unit of work: run `scripts/test-boss-offline.sh` on an available Linux/Node environment; reconcile its test contract with current main; make an explicit production migration / rollback plan. Avoid client-declared loot credits and duplicate XP.
- Current PR body reports a successful isolated test run at `2a72ba1`; it is **not proof of live multiplayer implementation**.

### 2. [#24 Crater creatures, wildlife and skilling pets](https://github.com/Yotemeal/tales-of-myrren/pull/24)
- Contains the eight-creature roster, approved reference crops, three specialised pet controllers, goblin projectile simulation, preview-only 3% matching-skill XP logic and preliminary Jewelheart service modules.
- **Do not merge wholesale:** branch is from 7 November and includes older runtime replacements. The provided source crops still need transparent cleanup, accurate anchors, full directional poses, new map zones, NPC AI, and actual mobile gameplay QA. Its boss reward prototype also overlaps today's merged #71 and unmerged #72; reconcile rather than duplicate services.
- Work's concept **River Otter** is still not the mainline fishing-pet drawing: main currently routes fishing to `drawTerrapin`. Preserve fishing-pet ownership and save IDs during any future asset swap.
- The base game also has a Forging `Living Anvil` pet; do not erase it simply because the old three-pet concept sheet omits it.

### 3. Art and world cohesion
- Native transparent equipment assets need to align to Kez V2 **per pose and per slot**. `docs/KEZ_V2_PAPERDOLL_WORKFLOW.md` already has a **7-tier experimental generator** from old Wardrobe art. It is a *test harness*, not the final approved art. Do not waste time rebuilding that whole generator before evaluating its limitations.
- Latest user requests: better trees (specific silhouette, sensible world scale, wind without tearing) and believable fishing shoals/ripples. Current `myrren-environment.js` still draws all standing tree images at a universal width of 144, with 24 animated horizontal bands, and fishing as tiny fish rectangles/ring effects. The gameplay harvesting and Fishing/Cooking XP features are separately complete.
- No environmental asset change should alter mining depletion, tree regrowth, fishing catches, loot, collision or saves.

## Active work in this new asset-sheet branch

- `public/assets/armour/bronze_layers_21x27.png` — 84×972 indexed transparent PNG representing six equipment layers × six animation rows × four frames, each 21×27.
- `public/assets/armour/bronze_layers_21x27.json` — exact slot/frame mapping.
- `public/bronze-sprite-lab.html` and `public/bronze-sprite-lab.js` — **isolated** visual checker that composes the original current character and the PNG equipment with correct front/side/back shield depth. Allows switching to current procedural equipment for comparison. **Not** added to `public/index.html`.
- **Limitations:** first-pass Bronze pixels are not approved final art; screenshots from the actual branch preview and mobile world need review, especially front/back/side, walking offsets, fist/sword hands, shields, idle breathing and equipped/unequipped mixed slots. Do not enable the atlas in production yet.

## CI and operations reality

- Production main `b72186c9b7` had successful mainline integrity, Kez V2 renderer, Combat balance and deployed-mining verification runs on 10 November 2026.
- The older 32×48 PR #75 has many cancelled queued runs and two lingering queued runs at its final head. These are not evidence of failure or success. Do not burn CI minutes on rejected art.
- The user's Linux self-hosted runner service previously reported `exit-code`; when work resumes on CI, verify `systemctl status`, recent `journalctl` and runner service account/workdir. Never claim remote self-hosted runner health from PR metadata alone.

## Recommended order (updated)

1. **Finish the visual Bronze native sheet proof**, adjust the art to original character anatomy and review real mobile/desktop screenshots. **Don't replace gameplay yet.**
2. Convert the other six sets **only after Bronze approval**, reusing the same independent slot/frame atlas format and the locked Myrrenite visor design.
3. Replace trees and fishing visuals as separate graphics-only PRs, preserving gameplay and gathering logic.
4. Resume #72 as an isolated secure multiplayer service, run full Node/offline suite and design the authoritative saved-character migration; do not ship provisional cross-player rewards.
5. Selectively migrate #24 transparent creature/pet sprites, animations and content only once current renderer and authoritative combat interfaces are clear.

**Release criterion:** a PR is not finished because a unit test passed; it must preserve saved progression, item IDs, current game systems and mobile gameplay quality.

### Audit cleanup actually performed

- **Closed** #30, #31, #33 and #75 as superseded, with explanatory PR comments; no branches or previous art/history deleted and nothing merged to production.
- Set the still-unfinished Crater #24 back to **draft**; its creature/pet content remains available for selective integration.
- Kept server-boss #72 **open as draft** and untouched. It is the current isolated multiplayer-authority workstream.
- Created a separate Bronze transparent-PNG asset review with a source atlas, manifest, viewer and a 144-cell transparency/frame integrity test. The asset is still **visually unapproved**; only legs, boots and gloves show walk-frame variation, with no full hand-authored animated armour/chest/shield/attack release yet.
