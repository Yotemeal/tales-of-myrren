# V19D native side-head correction — direction-preserving review

Date: 15 Nov 2026. **Status: REVIEW ONLY. Production main unchanged.**

## User decision
The earlier V19C concept that mirrored a single head across both directions was rejected. The user explicitly prefers the **current left face and eye** and **current right face and eye** separately. Preserve both rather than manufacturing one mirrored face.

## Proven native defect
The V19B approved 24×32 side idle heads were drawn from different sources than the side walking heads. Hair palette distribution and eye-white geometry changed when the actor switched between idle and walk. The left walking head also had much darker shading than the right. Head pixels inside side walking frames vary slightly near the neck; those are deliberately left intact to avoid changing hand/cloak movement.

## Direction-preserving candidate
Deterministic renderer: `scripts/build-v19d-direction-heads.cjs`

Inputs:
- `public/assets/myrren-v19b/myrren_walk_4x6_native.png` unchanged, SHA256 `a0d9b80587e5d06584fda7bc97388a4a642f7e2a3031d20461085f8da4b38be7`
- `public/assets/myrren-v19b/myrren_idle_4dir_native.png` unchanged, SHA256 `73127b54a3810fcd4087e733a2cbd3fc82bdfa1da210c0c733b650d24645fcd1`

It selects the **existing left walking frame 0** as the left head and the **existing right walking frame 0** as the right head, with **no mirrored face, silhouette, eye whites, black pupils, or skin**. The same native head is written into each direction's idle upper 17 rows and all its six walking heads.

Only brown **hair RGB shades** are harmonized. The original warmer `#734530` shade becomes the approved front/back `#784E45`; for darker left-side hair pixels, the corresponding right-side hair pixel is used as a *shade reference only* when both are existing hair pixels. **No other-direction skin, eye, outline, transparency, or geometry is copied.** Right-side facial artwork remains right-side original. Left-side facial artwork remains left-side original. Every pixel from native y=17 onward, including moving arms, cloak, torso, boots, and legs, remains unchanged in every frame.

Outputs (separate candidates, not served by the live game):
- `myrren_walk_4x6_direction_preserving_CANDIDATE.png`, 144×128, six frames each of front, left, right, back
- `myrren_idle_4dir_direction_preserving_CANDIDATE.png`, 96×32
- Walk RGBA SHA256 `3f18c6af5d8a1a2c2bdb6f324d28228262de9c305677ed579aef1bb076aaa1ed`
- Idle RGBA SHA256 `1706dcae7c0666c71cb02342b6af43a99806343e35ab860f1f9bbdc03bd7be91`

## QA
Run without any third-party dependencies:

```bash
node scripts/build-v19d-direction-heads.cjs /tmp/v19d-direction-preserving-review
node --test tests/myrren-v19d-direction-preserving.test.cjs
```

Checks: lossless native RGBA PNG output, unchanged old asset SHAs, front/back untouched, 100% original side-body/gait pixels y>=17, left and right face/eye/outline from their **own** original frames, zero drift across six walking heads and idle for each direction, no old warmer shade anywhere in the corrected head, contiguous silhouettes, binary alpha. CI exports the candidates separately as an Actions artifact for inspection.

## Release gate
**Do not merge/deploy this draft review PR.** Show the user the actual PNG and GIF previews for approval. After approval, prepare a separate production PR which swaps the two canonical PNGs, updates manifest and old pixel-lock fixture expectations, cache-busts native atlas URLs, and passes all browser/mobile/multiplayer and equipment fallback regressions. Keep the approved 2× camera and game save protocol as they are. Do not use V19C mirrored art.
