# The Crater — stage two: approved-source fitting and animation study

Branch: `plan/crater-creatures-and-skilling-pets`. No merge or deployment.

## Delivered

- A fitting inspector at `public/crater-fitting-preview.html`, separate from the game. It compares supplied creature poses with the existing approved player renderer and armour, offers all 16 creatures, state selection, play/pause/replay, frame scrubbing, adjustable proposed scale and preview timing, and an explicitly labelled mirror study.
- 167 source crops across 61 available animation clips: eight hostiles, five passive wildlife and three pets. All crops are packed into six PNG reference atlases with original decoded JPEG pixels retained. No redrawing, resizing, masking, palette replacement, interpolated frames or new views were used to create those atlases.
- `public/crater-animation.js` handles supplied frame playback and nearest-neighbour drawing. Idle/movement loops wrap; attacks, hit/death and interaction one-shots hold their last supplied pose. Timing is passed explicitly and remains a fitting proposal. This module never runs combat, XP or rewards.
- `scripts/pack-crater-reference-frames.py` verifies original SHA-256 hashes and reproduces the exact crops from the six files. Manually measured frame boxes account for the boards' uneven layouts rather than assuming a uniform grid.
- `docs/crater-pet-reference-study.gif` shows supplied glider walk/glide/climb, mole burrow/surface/dig and otter walk/swim/dive-catch frames beside the current bronze-armoured hero. Its timing and relative sizes are proposals. The GIF is a display preview; the packed PNG crops are the exact-pixel source record.

## Reference-index correction

The initial document incorrectly matched some opaque upload filenames to the order of images displayed in chat. During this stage every original was opened and checked. The source register and plan now map the actual contents correctly:

| Ref | Filename prefix | Actual board |
| --- | --- | --- |
| R1 | 449125F1 | Original monster roster |
| R2 | 92B94231 | Common and boss Cave Guardians |
| R3 | 7180DC61 | Goblin gatherer/miner and protector/guard |
| R4 | F7AA665A | Five passive wildlife |
| R5 | ABD545E9 | Final three skilling pets |
| R6 | E8219F5C | Apex Hunter Dire Wolf |

Original file identities and their checksums remain unchanged. The final names, roster and design approvals were not changed. R6 remains the wolf source; the superseded plain wolf and generic goblin in R1 were not packed as final designs.

## What is deliberately unfinished

This is an exact reference-crop study, not a production transparent sprite package. Dark board backgrounds, grass strips, scene props, impact marks and occasional panel edges remain. They are visible in the inspector and must be cleaned or sourced from original sprites before gameplay integration. Proposed crop ground anchors and sizes need visual approval; the boards do not establish complete runtime pivots or exact frame durations.

Missing front/back views, dedicated squirrel tree-climb frames, complete animated wolf camouflage variants and production timings are explicitly listed. The mirror toggle only mirrors supplied pixels for inspection; it is not a newly approved directional design. No missing poses have been invented.

Normal monster spawns, wildlife, pets, bonuses, player graphics, saved progress and gameplay remain as they were at stage one. The three +3% matching XP bonuses are recorded but not yet enabled. The fitting page does not load `myrren-game.js`, read saves, run combat or connect to multiplayer.

## Checks

- `python tests/crater-reference-fidelity.py <originals-directory>` passed: all 167 packed crops exactly match their corresponding decoded source rectangles, identities/counts are correct, bounds are valid and missing poses are explicit.
- `tests/crater-animation.test.cjs` passed: all 61 clips, loop versus held-one-shot behaviour, invalid timing guards, and exact-pixel rendering across all six sources.
- `tests/crater-fitting-preview.test.cjs` passed: controls render all 16 creatures/61 clips; scrub/pause/replay, held one-shots, mirroring and armour changes; no access to player saves. This uses a synthetic DOM and the actual Canvas renderer.
- Existing stage-one rock and combat-preview tests still pass. JavaScript syntax checks pass.
- Rendered crop contact sheets and the pet study were visually inspected and crop boxes revised to avoid clipped limbs and neighbouring poses.
- Full browser verification was unavailable: the cloud browser could not connect to the workspace's local HTTP server and no supported forwarding route was exposed. No browser-input/mobile visual verification is claimed.

## Inspect locally

Serve `public/` with a static server and open `/crater-fitting-preview.html`. Source images are not needed to use the packed preview. They are needed only to reproduce/verify the exact packing. The existing game entry point does not automatically open or load this inspector.

The next stage is approval of fitting scale/anchors and preparation of clean runtime frames, then wiring the approved creature behaviours and pet movement/bonuses. Preserve all unresolved source/balance choices from `CRATER_IMPLEMENTATION_PLAN.md`. Merge and deployment remain subject to explicit user approval.
