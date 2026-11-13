# Tales of Myrren — native Bramblewood, Alder, Copper, Tin V1

**Status: four original native PNG atlases plus two stump PNGs; visual review candidate only.** No existing game art is overwritten. No live rendering, collision, resource, economy or save code changes.

## Authoritative appearance

Follow the earlier approved forestry concept: **Bramblewood = tapered layered evergreen conifer**; **Alder = rounded, yellow-green broadleaf with a substantial brown trunk**. The original proposal images are visual references; do not import concept poster pixels or use new character proportions. The sprite sheet uses independent pixel-authored RGBA art at its intended display size.

| Existing game resource key | Source file in this folder | Native display / cell | Content | Ground anchor |
|---|---|---|---|---|
| `tree` | `tree_bramblewood_v1.png` | 72×88 | Four low-amplitude breeze frames in a 288×88 atlas | (36,85) |
| `oak` | `tree_alder_v1.png` | 72×88 | Four low-amplitude breeze frames in a 288×88 atlas | (36,85) |
| `tree` depleted | `tree_bramblewood_stump_v1.png` | 72×88 | Full-size transparent cell containing the cut stump at the same root anchor | (36,85) |
| `oak` depleted | `tree_alder_stump_v1.png` | 72×88 | Full-size transparent cell containing the cut stump at the same root anchor | (36,85) |
| `copper` | `ore_copper_v1.png` | 24×22 | Two cells: live mineral veins, then depleted rock (48×22 atlas) | (12,20) |
| `tin` | `ore_tin_v1.png` | 24×22 | Two cells: live mineral veins, then depleted rock (48×22 atlas) | (12,20) |

### Native art/animation quality rules

- Native RGBA PNG with 100% transparent outside silhouette and **only 0/255 alpha** (no blurry anti-aliasing).
- No runtime 96→144 tree stretching or 153→17.28 ore shrink. Draw one native cell per entity at integer world-pixel destination using `imageSmoothingEnabled = false`.
- Trees sway only at their canopies. Trunk and ground pixels must stay fixed across all four frames. Suggested animation durations: 750,180,180,180 ms, looping with a long rest and short gust.
- The ore's dark stone silhouette stays identical between live/depleted; changing mining yields, XP, chances or respawn is not allowed.
- A felled tree uses a **separate native stump PNG** with the same cell dimensions and ground anchor; do not procedurally reconstruct stumps with canvas shapes.
- Keep these as **concept/scale review candidates**, not blanket changes to the other three trees or six ore tiers.

## Production rendering only after approval

The current game loads `/assets/resources/tree_bramblewood.png`, `tree_alder.png`, `ore_copper.png`, and `ore_tin.png` with `resourceSprite()` in `public/myrren-environment.js`. In `public/myrren-game.js`, `drawRock()` applies an extra `ctx.scale(.72,.72)` around ores, making the current live draw ~17.28 px wide.

When explicitly approved, Work should introduce an image frame reader for exactly these four resource IDs, **and remove the nested fractional scaling for the new native ore path**; preserve the old loader/fallback and existing resource visuals for all other IDs. Use image cells for normal available, depleted and tree gust states. Do not scale Kez to make assets fit.

Existing node coordinates, hitbox/interaction reach, depletion timings, 6-yield mining release, logs/ore award, inventory and server authority must remain identical. In particular, **do not merge or rewrite old `myrren-game.js` from PR #24 or experimental branches**.

### Test and review evidence

- `validate-v1.py` validates each native RGBA frame, stable tree anchors and ore live/depleted silhouettes.
- `tests/native-resource-v1-gameplay.test.cjs` captures actual browser screenshots at desktop and 390px portrait mobile with the source art overlaid only in a **test browser response**. Real live code remains untouched.
- `native-resource-art-v1.yml` publishes review media to GitHub Actions artifacts on the self-hosted Linux runner.
- Compare actual game **before/after** screenshots with a near-body scale ruler and inspect both live and depleted resource states.
- Review tree occlusion when Kez walks *behind* the canopy, visibility of ore against the ground, bush/tree path crowding, and interaction hitboxes.
- Validate mobile and desktop regressions independently, not just image unit tests.

These two trees are not all five approved trees. Ironbark, Elderthorn and Starroot art are separate later work.

## PR boundaries

Leave `main` and Work's character PR #78 untouched. Fishing PR #81 remains a separate artwork candidate. Use the world-scale PR #77 only as a reference; do not merge it with this PR automatically. The user must approve the actual screenshots before replacement goes live.

**Definition of ready:** six authentic RGBA PNGs with metadata, test suite passing, comparison screenshots, and explicit visual approval. **Definition of shipped:** separate implementation PR with real gameplay regression results and approved sprites. This PR is **not shipped**.
