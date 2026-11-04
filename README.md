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

- `public/index.html` — current deployable game.
- `index.html` — preserved copy of the same game build at repository setup.
- `backups/original-baseline.html` — untouched baseline backup.
- `wrangler.jsonc` — Cloudflare Worker static asset configuration.

Always edit `public/index.html` for future game updates.
