# Tales of Myrren — V19C side-head consistency review

**Status:** Candidate only. Not merged. Not deployed. V19B production art remains unchanged.

## Problem established
The user observed changes in hair colour and eye shape while moving. Direct pixel inspection of the V19B approved sprite sources shows that the left and right side walking heads were drawn using different hair shade distributions, and both side idle heads differed from their respective walking heads. The two supplied screen recordings show *Curse of Aros* as motion references, not the live Myrren game.

The prior V19B idle-only proposal in this PR cannot fix the left-versus-right walking mismatch. It is **superseded** by this full V19C head review. This is the specific scope authorised by the user asking to carry on with "Unify side-view head pixels across left/right idle and all side walking frames, without changing gait or body movement."

## Proposed V19C native artwork
`scripts/build-v19c-side-heads.cjs` is a deterministic, dependency-free PNG generator. Run:

```bash
node scripts/build-v19c-side-heads.cjs /tmp/v19c-head-review
node --test tests/myrren-v19c-head-consistency.test.cjs
```

The generator writes **new separate candidate files**, which are also exported as the GitHub Actions artifact `v19c-side-head-review-candidates`:

- `myrren_walk_4x6_head_consistency_CANDIDATE.png` (144×128 RGBA; four rows, six columns, 24×32 per frame)
- `myrren_idle_4dir_head_consistency_CANDIDATE.png` (96×32 RGBA; front, left, right, back)

Using the existing V19B *right-facing walk frame 0* as a base, create a 24×20 native side-head master. Harmonise only that head's original RGB (115,69,48) hair shade to the front/back palette RGB (120,78,69). Copy that unchanged right-facing head to all six right walk frames and right idle. Mirror only this 24×20 head horizontally for left and use the mirrored copy in all six left walk frames and left idle. The eye white geometry is exactly three pixels in each side view with consistent pupil placement. **The existing left and right body/arm/leg motion is NOT mirrored.**

All original V19B PNGs, all front/back art, front/back idle, and every side sprite pixel at y>=20 are untouched. The camera remains fixed 2×. This replaces the *appearance* of the previously approved V5 head portion in a **new review candidate**, while preserving every stride, hand, body and boot pixel.

## Verifiable invariants
- Original V19B walking sheet SHA256: `a0d9b80587e5d06584fda7bc97388a4a642f7e2a3031d20461085f8da4b38be7`
- Original V19B idle SHA256: `73127b54a3810fcd4087e733a2cbd3fc82bdfa1da210c0c733b650d24645fcd1`
- Candidate walk raw RGBA SHA256: `306410f0a223afdb02b46508e4cb4c6e9b0e62b04dc38debb69c8e855dc64fed`
- Candidate idle raw RGBA SHA256: `ac96a70cdccee57b2e2317989c52b91e5b6ee280c936faa603264f702f9f018d`
- Pixel QA confirms all 12 new side-walk heads are 1:1 identical to their corresponding side idle, opposite-facing heads are exact horizontal mirrors, and each side view has three identical eye-white pixels.
- No interpolated alpha and all 24 connected silhouettes remain intact. All front/back frames and all body/gait pixels y>=20 are exactly equal to the shipped V19B assets.

## Remaining approvals and implementation
**This PR is only a review vehicle. DO NOT MERGE IT INTO MAIN.** The existing live game continues using the accepted V19B sheets. First present the side-by-side full-size previews and short animated idle-to-walk comparison for the user's visual approval. If approved, prepare a distinct integration PR: replace canonical walk/idle PNGs with the approved candidate, update manifest and SHA fixtures, clear image cache with a versioned URL, keep the approved 2× camera and gear/combat fallback, then pass complete gameplay/mobile/peer/asset regression checks before merge/deploy.

For the user's visual judgment, the local deliverables in this conversation are `v19c_head_consistency_comparison.png` and `v19c_idle_walk_comparison.gif`. They show original vs corrected and should not be described as live screenshots.
