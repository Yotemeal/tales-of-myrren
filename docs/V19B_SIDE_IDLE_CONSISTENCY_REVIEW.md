# V19B side-facing idle/walk visual consistency — REVIEW ONLY

**Date:** 15 Nov 2026, Brisbane time.  
**Inputs:** User-supplied 22.4-second and 45.63-second clips named `ScreenRecording_11-15-2026 10-34-28_1.mp4` and `ScreenRecording_11-15-2026 10-35-23_1.mp4`. Both clips show *Curse of Aros*, not a live capture of Myrren. They inform pacing and continuity but **do not show a Myrren browser issue**.

## Confirmed native sprite defect
Our accepted V19B idle atlas and V5 side walking atlas were authored from different source head drawings. On transition from idle to side walking, the hairstyle, pixels, and white eye shapes change abruptly even with the same character facing.

- Left side idle hair luminance 71.5 vs walk 58.1 (weighted mean across 4 shared hair RGB colours in upper 16px). White eye pixels: 4 idle vs 3 walking, with a vertical 1px shift.
- Right side idle hair 69.2 vs walk 68.4, but texture/hair arrangement and white eye coordinates differ.
- Front and back head regions are already **pixel-identical** between idle and all 6 walk frames, so leave them completely unchanged.
- Approved native V5 left/right walking frames are locked: SHA-256 for full walking atlas `a0d9b80587e5d06584fda7bc97388a4a642f7e2a3031d20461085f8da4b38be7`.

## Review candidate (not wired to the game)
`public/assets/myrren-v19b/myrren_idle_4dir_consistency_CANDIDATE.png` — RGBA 96×32. Its **left and right idle frames only** have their upper 20 rows replaced with the top 20 rows from the already-approved walking side frame 0. This is precise 1:1 native pixel editing; no resizing, recolouring, interpolation, regeneration, or gait alteration. All front/back idle frames and all side pixels at y>=20 remain byte-identical; every V5 walking frame remains untouched.

- Original shipped idle SHA-256: `73127b54a3810fcd4087e733a2cbd3fc82bdfa1da210c0c733b650d24645fcd1`.
- Candidate idle SHA-256: `1b3635e8727ec6d1b834579261be9bc95292a77c0c9258c412d3e6cca2504729`.
- Candidate left hair brightness now 58.1 idle == 58.1 walk; eye coordinates now 100% identical.
- Candidate right hair brightness now 68.4 idle == 68.4 walk; eye coordinates now 100% identical.
- Four targeted native pixel/alpha/connected-silhouette QA tests passed locally.

## Release gates
**No edit to `myrren_idle_4dir_native.png` or production renderer in this PR.** The old idle atlas stays the default until the user approves this visual comparison. To release after approval: replace the idle PNG with this candidate, update `manifest.json` checksum, retain unchanged walk and its per-frame locks, bump the native atlas URL cache key, validate Chromium idle-to-walk transitions and mobile, then merge/deploy separately. Do not touch the approved 2× camera, equipment, game saves or multiplayer.
