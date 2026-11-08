# Kez V2 paperdoll atlas: staged asset workflow

**Status:** Experimental, not approved for production. It does **not** replace `public/kez-v2-equipment.js`.

## Purpose

Keep the approved **21×27 Kez V2 character** intact while moving from procedural rectangles to independent equipment sprites for every direction and frame. Mixed gear must remain possible. Existing 2/3/4/5/7/6/8 material IDs, saves, skills, combat and network messages must not change.

## Existing inputs

- `public/assets/kez-v2/kez_v2_atlas.png`: 84×162 character atlas, 4 frames × 6 rows
- `public/assets/kez-v2/smithing_armour_front_atlas.png`: 1232×276 approved **front** armour reference for 7 metal tiers
- `public/wardrobe-{bronze,iron,steel,cobalt,obsidianite,aether,starsteel}-v5.png`: older 384×640 directional source poses, **not current approved designs**
- `public/wardrobe-base-v5.png`: old comparison body
- `public/wardrobe-ownership-v5.png`: helmet, body, legs, boots and gloves attribution mask
- `public/shields-approved-v1.png`: existing seven-metal, three-view shield atlas
- `public/kez-v2-equipment.js`: latest corrected Myrrenite T-visor mask (authoritative override)

## Reproducible build

```sh
python -m pip install "Pillow>=11,<13"
python scripts/build-kez-v2-paperdoll.py --out /tmp/kez-v2-paperdoll
python tests/kez-v2-paperdoll.test.py
```

Generated files:
- `kez-v2-paperdoll-native-v1.png` — 588×972 transparent atlas; **7 material columns × 6 slot rows**. Every 84×162 item tile contains 4 columns × 6 rows of 21×27 native cells.
- `kez-v2-paperdoll-native-v1.json` — mapping metadata and explicit experimental status.
- `kez-v2-paperdoll-review.png` — seven-tier, four-direction comparison on actual Kez V2 artwork.

The `paperdoll` GitHub Actions job uploads these outputs as a review artifact. They are not automatically copied into `public/assets/`, and no live code loads them.

## Quality gate before integration

The old directional source uses **red Obsidianite, purple Myrrenite and blue/white Starsteel**, so its side/back images are not approved. The generator temporarily remaps those colours to the correct metal identities. This is useful to confirm masks, scale, frame mapping and slot ownership; it is **not a substitute for drawing final matching directional silhouettes**.

Do not enable the generated atlas in the live renderer until:
- Every front/left/right/back/walk/attack pose visually follows the latest approved tier silhouettes and the **gold-crested teal Myrrenite T visor**.
- Front gear does not replace Kez V2's actual body/face artwork; equipment can be mixed by slot and uses the correct offhand.
- Fitted swords/shields don't overlap hands, float or break the animation.
- Pixel edges are hard-alpha, no resized blur, no cropped feet, no stray pixels, all frame alignment is verified.
- Equipment panel and multiplayer rendering match; live inventory/saves remain unchanged.
- Native paperdoll and current gameplay tests pass; mobile Chromium screenshots are inspected.

**Do not overwrite the approved armour chart or replace the Kez V2 base atlas to disguise alignment issues.** The sprite generator and output are an intermediate asset production step, not a final armour release.
