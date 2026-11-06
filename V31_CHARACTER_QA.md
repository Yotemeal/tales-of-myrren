# V31 face, idle and travel update

- Compared the native 128x320 sheet with the supplied standing/running screenshots. The front standing eye differs from the walking face.
- Added a native 12x5 face patch from the walking reference, aligned to standing and walking head centres. Side/back artwork, original jaw/neck row, hair outside the patch, body, legs and original PNG are retained.
- Face correction runs before the established feet and armour layers, so open helmets receive the corrected face as well.
- Resting characters breathe with a one-pixel upper-body lift on a 3.6-second cycle. A waist overlap keeps the upper body connected while lower legs and soles stay fixed. Walking and attack poses disable the breathing offset.
- Travel speed is 74 world pixels/s, up from 46 (about 61%). The four-frame gait uses 90ms frames to match the quicker stride. Diagonal movement stays normalized.

Checks: runtime syntax, pixel-level face comparison, bare and six equipment tiers in all four directions (112 draw states), fixed lower-body pixels, unchanged native upper-body geometry, idle cadence, actual cardinal/diagonal simulation speed, combat kill-XP and bank/note regression suites passed. Browser preview renders the same production drawing function at enlarged pixel scale for bare and equipped idle/running inspection.

Save keys, progression values, combat timings/damage/rewards, inventory and bank logic are unchanged. Physical mobile/controller input was not directly exercised.
