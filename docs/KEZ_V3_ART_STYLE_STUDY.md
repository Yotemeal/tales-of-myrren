# Kez V3 visual-direction study — Tales of Myrren

**Status: DESIGN/ART STUDY ONLY. NOT VISUALLY APPROVED AND NOT IN THE LIVE GAME.**

## Direction agreed 2026-11-08

Take **readability, compact characters, restrained animation and clean pixel silhouettes** as broad references from *Curse of Aros*; do **not** reproduce its characters, assets, tiles, effects, UI or exact armour designs. Tales of Myrren retains its own existing approved seven-tier armour designs, boss/creature identities, woodland atmosphere and cleaner compact UI.

The in-game native Kez V2 renderer is 21 × 27 pixels. The signed-off smithing reference has substantially finer details and cannot be reduced into 21 × 27 without losing helmet and plate identities. A pilot native **32 × 48** transparent sprite set has been authored in an isolated, downloadable visual study (7 materials, 4 facing directions, with and without held items); these dimensions are *art test values*, not an approved runtime/world scale. No visual references are being passed off as game-ready directional animation sheets.

### Established material IDs (keep existing save IDs)

| Material | ID | Progression level |
|---|---:|---:|
| Bronze | 2 | 1 |
| Iron | 3 | 10 |
| Steel | 4 | 20 |
| Black Iron | 5 | 30 |
| Obsidianite | 7 | 40 |
| Myrrenite | 6 | 55 |
| Starsteel | 8 | 70 |

**Latest approved helm rule:** Myrrenite is teal/gold with a continuous golden brow, central gold crest/diamond, and an opaque dark T-shaped eye opening. Do not revert to the older open-face design. Maintain the distinct silhouettes and colours of every other tier.

## Scale/engine risk — must resolve before a renderer change

- Native 32 × 48 is significantly larger than 21 × 27 in game units if drawn at 1:1. Compare it on actual Crater and woodland maps **next to real resource trees, ore nodes, doors, combatants and the existing player**, including 1×/2× mobile camera zoom.
- Do **not** downscale 32 × 48 onto a 21 × 27 canvas and call it high resolution: that throws away authored detail. Conversely, do not increase world coordinates or hitboxes simply to accommodate art.
- Feet must be anchored to the planted world point; directional sprites must not bounce, sink, or drift. Keep player/peer world coordinates and physics unchanged.
- An option is to increase the visual art pixel density of the entire renderer, but benchmark mobile fill-rate, texture memory and camera clarity before adopting that approach. The existing game currently uses a compact low-resolution canvas.
- Keep design studies separate from the production renderer, **public/index.html**, gameplay rules, combat, UI scale, save code and networking.

## Production pipeline after art/scale approval

1. Author the *base character* at a consistent density with clean independent masks/layers. Establish feet, head/neck, dominant hand, offhand, and torso anchors.
2. Author 7 materials × wearable slots **helmet, body, legs, boots, gloves, shield**, preserving mixed-material outfit compatibility. Keep shields on the offhand and held sword grip in the dominant fist.
3. Produce **front / back / right / left** idle, walk/run, sword attack, empty-hand punch, hurt/death frames. A mirrored directional reference is temporary study art, not final approved motion.
4. Use consistent hand sockets for every blade, shield and glove; correct side shield depth and minimal side profile. No floating hilt, reversed shields, same-hand dual equipment, or clipped/white-edge pixels.
5. Keep item IDs, drop rates, forging levels, skill progression, saved dyes, hitboxes, multiplayer alignment and inventory icons intact.
6. Reuse pre-approved reference drawings; do not replace detailed wearable armour with procedural blocks. Keep gear sprites **pixel-authored**. Keep the existing live renderer until an art sign-off and browser gameplay verification pass.

## Mandatory release QA

- All 7 complete sets and mixed armour pieces in 4 directions.
- Idle, moving, attacking, punching, hurt/death. Front, side and rear overlap/depth.
- Sword hilt invisible beneath correct glove; shield on opposite side, not through head/torso.
- In-game world proportions: ore smaller than player, trees visibly larger, doors and NPCs in scale.
- Equipment portrait identical to game character; dye variants and partial equipment.
- Same world-space movement, collision, PvE damage, inventory, save/export/import and multiplayer state.
- Actual iPhone portrait/landscape and desktop browser screenshots, plus automated gameplay regression suite.
- Hold draft; **never merge visual experiments to main without visual approval.**

## Current independently generated art study

An external downloadable prototype ZIP has been produced in the originating ChatGPT session with:
- `myrren_armour_v3_study_32x48.png` — 7 × 4 RGBA unarmed/without held weapons.
- `myrren_armour_v3_held_32x48.png` — matching poses with held sword and shield.
- `myrren_armour_study_manifest.json` — frame layout and original item IDs.
- `preview.html` — standalone viewer for selecting material, direction, held state and zoom.
- `source/create_myrren_study.py` — source generation code.
- `myrren_v3_style_scale_preview.png` — layout and native-scale check.

These files are **not checked into this repository**. The prototype has passed its own pixel/frame/alpha sanity checks, ZIP integrity, and preview JavaScript syntax check. Headless Chromium navigation was blocked by the environment, so interactive browser visual QA remains open. The character stills do not represent finished directional animations, independent wearable sprite layers, or a production integration.
