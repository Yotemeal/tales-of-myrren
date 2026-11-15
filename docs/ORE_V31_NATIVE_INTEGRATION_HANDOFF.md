# V3.1 approved mining ores — native integration review
**Date:** 16 November 2026. **Status:** isolated draft, no deployment or merge.

## Art
The user approved the image sheet **Tales of Myrren / Cleaned Mining Sprites (Refined)**, version V3.1 (SHA-256 `ae78b56ff87075200b9647a52b58ef0281fb6bb2be6f33429ffaec5b87f8a17f`). These 40×28 transparent PNGs were reconstructed from that large rendering, not exported as exact native source pixels by the image generator. Source conversion necessarily reduces very small details. QA: binary transparent alpha, one connected opaque silhouette each, 20–24 colours, unique SHA-256. Original V19F 24×32 character checksum preserved (`748ad641d103dc91228327c91abbc058bf685fad21011f809076ed47028c69a2`).

## In-game renderer
- All live, nondepleted ore nodes use native world width **40px** × source height **28px**, unscaled world 1×. Fixed camera 2× means **80×56** screen pixels.
- The old renderer shrank nominal 24px ores by **0.72** to 17.28px, causing visibly undersized resource art. This targeted change corrects that without changing resource coordinates, player collision/range, mining attempts, vein depletion, respawn, XP, Forging or saves.
- When a node is depleted, it still draws its legacy procedural fallback at **0.72×** world scale to avoid sudden collision/appearance changes. No enlarged stump.
- Approved new PNGs are stored under `public/assets/resources/v31/`. Trees and the earlier original ore files remain byte-identical and available for rollback.
- Native art aliases resolve existing IDs: `cobalt` → Black Iron; `aether` → Myrrenite; `obsidianite` → Chromium; `meteorite` → Iridium. Original item IDs and legacy equipment/forging names are **not renamed in this art PR**. This means the Chromium and Iridium artwork will temporarily correspond to old in-game names until a separate tested progression and display-name migration.
- Cache version in the HTML/runtime now matches at numeric build **95** and environment asset tag **14**, correcting a pre-existing build-marker mismatch while refreshing the changed renderer.

## Verification
- `node --test tests/ore-v31-native.test.cjs` checks PNG sizes/hashes, hero checksum, visual aliases, actual environment.drawImage world coordinates and retained depleted fallback 0.72.
- `node tests/ore-v31-browser.cjs` uses Chromium to load every new sprite in a real browser at 2× along with the approved hero and saves a screenshot to `/tmp/myrren-ore-v31-2x-preview.png`.
- Full regressions / iPhone browser playtest and overlap inspection still required. In particular, larger visual footprints may overlap adjacent nearby mining nodes; verify before merge.
- **Do not merge/deploy without explicit owner approval.** Previous rejected art PR #114 and blocky pilot #115 are not part of this implementation. Retain PR #116 as an earlier 28×20 review branch, not an implementation prerequisite.

## Next action
Inspect the CI browser image and full in-world placement. Fix any clipping or repeated texture issues, then handle display names and rarity progression separately without changing saved internal IDs or balancing blind.
