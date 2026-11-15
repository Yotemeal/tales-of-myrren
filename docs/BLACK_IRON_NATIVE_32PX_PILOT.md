# Tales of Myrren — Black Iron native-size pilot (16 November 2026)
**Status:** artwork / rendering experiment on an isolated branch. User approved changing rendering if it improves visual quality, not a main merge or deployment. **Art itself is awaiting visual review.**

## Root cause
The previous ore images were drawn at 24 world pixels *inside* the environment renderer, but `drawRock` in `public/myrren-game.js` applied another **0.72 scale**. So a nominal 24px ore was only ~17px wide in the world. Source PNGs were much larger and downsampled again. This created the icon-sized, visually inconsistent results.

## Changes
- Only `ore_black_iron.png` has been replaced: **32×24 native RGBA**, individually plotted as three uneven rock masses with a clear light source and slender black veins.
- `public/myrren-environment.js`: the Black Iron resource uses a native 32px draw width, no resampling. All other ore widths and trees are unchanged.
- `public/myrren-game.js`: the existing `cobalt` internal ID (Black Iron) draws at 1× world scale. Other ores retain 0.72×. The approved fixed **2× camera zoom**, world tile size, resource placement, selection, collisions, harvesting, forging, mining times, saved inventories and equipment are unchanged.
- `public/black-iron-native-32px-preview.html`: isolated static reference using the exact approved V19F front sprite, not a claim of gameplay screenshot.
- `tests/black-iron-native-32px.test.cjs`: PNG checksum/dimensions, renderer projected sizes/anchors, existing ore scale regression and locked character SHA.

## Why this approach
A 32×24 ore at native world 1× has exactly 32 world pixels (two 16px tiles) and 24px high. On the fixed camera this becomes 64×48 displayed pixels, while the 24×32 character becomes 48×64. The original ore was about 17 world pixels wide (34 displayed), significantly smaller than the character. The larger art is still shorter than the hero.

## Safety / QA gate
Use `node --test tests/black-iron-native-32px.test.cjs`; review `/black-iron-native-32px-preview.html`. This isolated draft pilot deliberately avoids PR #114's rejected V2 ore assets. Run browser gameplay at 2× and inspect densely placed rocks before merge. Existing unrelated baseline CI failures include 1.6667 vs 2 camera assertion and game build marker mismatch; these files were not modified here. No iPhone physical QA claimed.

**Do not merge until the user approves the pixel artwork.**
