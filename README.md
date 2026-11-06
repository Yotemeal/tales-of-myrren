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
- `public/v31-equipment.js` — native armour layers and item icons.
- `public/myrren-world.js` and `public/myrren-environment.js` — shared geometry and rendering.
- `index.html` — preserved copy of the same game build at repository setup.
- `backups/original-baseline.html` — untouched baseline backup.
- `wrangler.jsonc` — Cloudflare Worker static asset configuration.

Edit the files in `public/` for future game updates. Keep script order intact and bump the game script URL version in `public/index.html` when changing the runtime. The root `index.html` and `backups/` files are historical copies, not deployment entry points.

## Checks

Run from the repository root:

```sh
node --check public/myrren-game.js
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
