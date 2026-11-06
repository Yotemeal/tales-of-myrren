# Code cleanup and regression review

Reviewed against commit 07a70461376abbcd8ec214fc0dc71de2c50c0162.

## Changes

- Moved the original game IIFE into `public/myrren-game.js`; the HTML retains script order and now declares UTF-8, language and standards mode.
- Formatted the stylesheet without changing its CSS tokens, removed unused `bonusTxt`, consolidated currency rendering, and removed redundant inline display overrides.
- Added one inventory projection helper used by buying, unequipping, crafting, gathering and drops. It counts consumed ingredients and coal-pouch storage before committing a transaction.
- Primary save recovery now falls back to the backup when parsing fails, and a damaged primary cannot overwrite a good backup.
- Normalize item counts, XP and timestamps; token balances no longer use signed 32-bit conversion.
- Keep all valid items in older overfull saves. Existing stacks can be used or extended; additional occupied slots are blocked until there is space.
- Added a shared synthetic runtime for regression checks and documented the source layout and test commands.

## Validation

- Runtime JavaScript syntax check passed.
- Inventory capacity and save/inventory regression suites passed: backup recovery, large token balances, legacy overflow, transactional smelting/cooking, full-pack gathering, combat gold and coal-pouch thresholds.
- Village suite passed: 1,440 river samples, two reachable bridges, 212 path tiles, 16 fishing spots, 300 save-recovery positions, movement, shops, outdoor smelting/forging and retained progression.
- Neck seam suite passed: 192 helmet poses and 1,890 original neck-outline pixels.
- Prestige suite passed: 49 mixed equipment combinations across 32 poses, six distinct helmet/shield silhouettes, dyes and exact unequip restoration.
- Browser checked desktop inventory/skills and 390x844 portrait / 844x390 landscape menus using the actual deployable runtime.

Armour sprites, water geometry, movement equations and combat timings were not redesigned. Multiplayer and physical controller hardware were not exercised.
