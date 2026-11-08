# Tales of Myrren

The live game is served as a static HTML asset. The deployable copy is `public/index.html`.

## Cloudflare automatic deployments

This repository is prepared for Cloudflare Workers Builds.

1. In Cloudflare, open **Workers & Pages** and select the existing Worker named `tales-of-myrren`.
2. Open **Settings → Builds** (or **Builds & deployments**) and connect this GitHub repository: `Yotemeal/tales-of-myrren`.
3. Set the production branch to `main`.
4. Set the build/deploy command to `npx wrangler deploy`.
5. Leave the root directory as `/`. The deployment configuration is in `wrangler.jsonc`.
6. Save and run the first deployment.

After that, commits to `main` will trigger a new deployment. The game URL stays the same.

## Files

- `public/index.html` — game document and script order.
- `public/myrren-game.js` — game state, controls, simulation and interface logic.
- `public/myrren-ui.css` — responsive game interface.
- `public/kez-v2-atlas.js` and `public/assets/kez-v2/kez_v2_atlas.png` — authoritative 21×27-pixel Kez V2 player/peer sprite renderer.
- `public/kez-v2-equipment.js` — native fitted six-slot, seven-metal equipment visuals (preserves existing save IDs).
- `public/wardrobe-v5.js` — existing approved armour icons and art reference; **not** the gameplay player renderer.
- `docs/CHARACTER_RENDERER.md` — exact renderer/asset contract and art release requirements.
- `public/myrren-world.js` and `public/myrren-environment.js` — shared geometry and rendering.
- `index.html` — **non-game retirement notice**; do not edit it for gameplay or deployment.
- `backups/root-index-pre-canonical-2026-11-08.html` — exact archived root game from before this cleanup.
- `backups/original-baseline.html` — untouched baseline backup.
- `wrangler.jsonc` — Cloudflare Worker static asset configuration.

Edit the files in `public/` for future game updates. Keep script order intact and bump the game script URL version in `public/index.html` when changing the runtime. The root `index.html` is only a notice pointing to the canonical public entry, and `backups/` contains archived snapshots. Neither is a Cloudflare deployment entry point.

## Checks

Run from the repository root:

```sh
node --check public/myrren-game.js
node --check public/kez-v2-atlas.js
node --check public/kez-v2-equipment.js
node tests/kez-v2-rendering.test.cjs
node tests/inventory-capacity.cjs
node tests/save-inventory.test.cjs
node tests/bank-notes.test.cjs
node tests/village-layout.test.cjs
node tests/v31-neck-seams.test.cjs
node tests/v31-prestige.test.cjs
```

The two sprite tests require `@napi-rs/canvas` (or the Codex runtime copy). Other tests use Node built-ins. The synthetic game runtime checks logic; desktop/mobile browser checks are still needed for layout and real input.

The inventory holds 36 occupied slots. Coins do not occupy a slot. Capacity checks account for consumed ingredients and coal-pouch storage. Loading an older overfull save keeps its items; new occupied slots are blocked until space is available.


## Bank chest and banknotes

The personal bank chest stands southwest of the village square, separate from the job supply crate. Stand nearby and use the action button (or tap the chest). Drag items within either grid to save their positions. Hold an item or right-click for quantity controls; the More button in item details provides a keyboard-accessible alternative.

Deposit, withdraw and sell menus support 1, 5, 10 and all. Depositing notes restores the item to bank storage. The Banknotes withdrawal toggle produces a stackable note; notes cannot be equipped, eaten or used in recipes. Shops that accept the original item accept its notes at the same price. Untradeable coal pouches cannot be noted.

Bank contents, notes and both slot layouts are included in all existing save paths and export codes. Earlier save codes remain supported. Personal-bank access requires proximity; selling requires the matching shop. Player-to-player trading is not implemented in this static deployment; it needs an authoritative shared transaction system.

## Character rendering release process

Kez V2 is the only active player/remote-player model in the current renderer branch. The older V31 and 384×640 approved character files remain as historical QA references and must not be loaded as fallback player artwork. Keep sprite rendering at its native pixel scale and preserve the seven stable material IDs. Character and equipment changes require CI plus browser screenshots (see `docs/CHARACTER_RENDERER.md`). The currently fitted small-scale armour is not yet a pixel-perfect conversion of the approved larger armour references.
