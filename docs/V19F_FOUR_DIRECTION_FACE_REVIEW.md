# Tales of Myrren — V19F complete four-direction head review

Status: user approved V19E left/right face and eye style. V19F extends the same two-white-by-three-high eye construction to both front-facing eyes and harmonizes hair shades for all four directions. **Review-only asset candidate.** No gameplay, renderer, save, camera or main-branch changes included.

## Delivered
- `myrren_walk_4x6_V19F_CANDIDATE.png` 144x128 native, 24 frames (4 directions x 6 frames, 110 ms per frame)
- `myrren_idle_4dir_V19F_CANDIDATE.png` 96x32 native, 4 idle frames
- `myrren_front_master_V19F_CANDIDATE.png` 24x32 native front master
- GIF and static comparison previews
- `scripts/build-v19f-review.cjs`: deterministic Node built-ins-only generator from exact old V19B assets and locked V19E/V19F head masters
- `tests/myrren-v19f-review-assets.test.cjs`: 8 native-pixel regression tests

## Strict provenance and constraints
- Every V19E LEFT/RIGHT idle and walking frame retained **byte-for-byte at raw RGBA level**, preserving approved face, eyes, hair and gait.
- Front-facing portrait now has two matching eyes, each with **4 white + 2 pupil pixels in a 2×3 grid**, complementing V19E side eyes.
- Back view has no eyes. Changes limited to hair shading in its upper 17 rows.
- The existing front/back body, cloak, hands, feet and lower 15 sprite rows of **all 12 front/back walking frames remain unchanged**.
- Four-direction hair light/medium/dark pixel ratios match within <0.9 percentage points.
- Original V19B assets are untouched, preserved as a rollback baseline.
- User has not reviewed new front/back visuals yet. Do not merge/deploy before review and full-browser integration testing.

## Check locally
```bash
cd v19f_4dir_stage
node scripts/build-v19f-review.cjs /tmp/v19f-native-candidates
node --test tests/myrren-v19f-review-assets.test.cjs
```

## Current status
8/8 local tests passed, plus separate 8/8 tests against the V19E-to-V19F pixel-edit pipeline. A GitHub review PR will include independent CI before production merge.

## Asset hashes (PNG bytes)
- walk `064ffdd2e937448c28f9a70d9879f3518f4d9b3dd4fcc295d53af71c5a84215f`
- idle `6f9356c5c6951f1225b1bbee3d696c4072e38cb007e6711a089e96a51d903eac`
- front master `a391141233d7c1cffc2c71a391091b67393e382b24a5eac2a19cc78d7ae3d0c9`