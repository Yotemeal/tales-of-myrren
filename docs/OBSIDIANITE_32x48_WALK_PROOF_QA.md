# Obsidianite — 32×48 native walk motion proof (NOT game-ready)

**Status:** Local transparency and animation-movement *proof only*. User-preferred mysterious Obsidianite appearance; original approved front master remains untouched.

The local ChatGPT review pack `Myrren_Obsidianite_32x48_Walk_Proof.zip` (SHA-256 `227f7d2b4c87d88fccb433d49bac5351eb26738fd6f23be7e1067dc3f1b8170c`) was produced from the four approved-*style* transparent references already recorded in `docs/obsidianite-four-direction-reference-extraction.json`.

## Exact scope

- 32×48 pixel **source-canvas study**, grounded at (16,46); no changes to the current live game. A previously discussed 24×36 game display size remains **unverified** here.
- Four facing directions: front, right, back, left.
- One source-derived idle reference per facing, plus four distinct **algorithmically rigged walk proof** frames per facing: **20 RGBA PNGs**, laid out as a 5×4 atlas (160×192).
- Animated GIF previews for the four facings, transparent sources, manifest, reference images, rebuild script and standalone verifier in the separate local review pack.
- Checks performed locally: PNG format and dimensions, transparent alpha, all 20 atlas cells reconstruct byte-exactly, consistent planted-foot row at y=46, no duplicate walk poses, bundle ZIP CRC. Rebuild script reproduced an identical front idle PNG from the bundled references.

## What this does NOT mean

The movement was built by moving segments of the original source pixels, **not by hand-authoring 16 new animation frames**. The walk remains stiff, especially from the sides; it is **not visually approved**. Do not claim the user's four-direction purple-armour concept is a game-ready 64-frame sprite sheet.

**Not complete:** authentic four-frame idle motion, artist-polished four-direction walk, attack/death poses (including no baked slash), separate wearable equipment layers, reliable sword/offhand sockets, game renderer integration, desktop/mobile QA, or release approval. No production PNGs from this local pack have been pushed to GitHub.

**Release gate:** keep this PR draft and unmerged. Do not replace the original canonical front (`1acec039f713f3d1e7bdb4c06c63f1f5bc287b3df506ec29d29cfc70b56149ea`), established materials or existing live build.
