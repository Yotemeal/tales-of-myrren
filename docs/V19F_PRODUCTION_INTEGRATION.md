# Tales of Myrren — V19F production walking/idle integration

**Date:** 15 November 2026. **Merge gate:** all 24 native walk/idle frames and saved progression must pass full GitHub Actions regression checks.

## Approved source
PR #103 introduced user-approved V19F 24×32 four-direction native sprites, with V19E face/eye structure, 6-frame walk at 110 ms, and hairline cleanup:
- front white stray pixel (x=17,y=3) removed in front idle, all six front walk frames, and front master.
- off-palette grey hairline pixels in y<17 mapped to the existing dark hair outline RGB(25,22,16). No face/eye or body/gait changes.
- canonical V19B PNGs preserved unchanged as historical baseline.

## Production wiring in this PR
- The normal `public/index.html` loads `public/myrren-v19f-atlas.js?v=2` and immediately provides a compatibility alias `window.MyrrenV19BAtlas=window.MyrrenV19FAtlas` before loading the existing guarded bridge and game JS.
- The legacy game compositor and unequipped portrait already use `MyrrenV19BAtlas`; they now receive the exact 24×32 V19F atlas without any direct changes to item IDs or equipment state.
- The bridge's diagnostics now report **V19F** when the new atlas is used and retain previous V19B labels for older test mocks. Its eligibility rules and **Kez V2 fallback** are untouched.
- **Only barehanded, unequipped walking and idle** use V19F. Combat, hit/death, held weapons, armour, shields, and equipped portraits continue to use legacy Kez V2, which is 21×27. A dedicated V19F native equipment/attack asset phase is still required. Do not stretch old gear to fit.
- New asset URL revision and game version 94 avoid stale client cache.

## Safety
- No gameplay movement, collision, camera (fixed 2×), network presence, multiplayer rewards, inventory/saves, crafting, gathering or equipment logic changes.
- Emergency visual rollback: `?character=legacy` on the same game link; no effect on saves.
- If V19F image loading fails, the established bridge renders Kez V2 instead of a blank player.
- Browser tests verify 24 directions/frames, portrait correctness, native frame count in real gameplay, mobile landscape/portrait, 2× camera and zero JS errors.

## Release
Merge only after GitHub Actions proves compatibility. Confirm Cloudflare production is serving game version 94 and show user their existing bookmarked URL `https://tales-of-myrren.keznuts.workers.dev/?utm_source=chatgpt.com`.
