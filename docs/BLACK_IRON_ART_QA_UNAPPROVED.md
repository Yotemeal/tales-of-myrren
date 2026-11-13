# Black Iron (ID 5, Forging Level 30): source-concept QA — 13 November 2026

**Visual status: NOT APPROVED.** The approved Black Iron master front must not be silently replaced by this draft. The first generated poses resembled Steel recoloured dark. The later draft improved the side profile but still lost the exact angular **violet-black spikes, chest V trim and hanging panels** shown in the approved armour reference.

## Source assets and actual work
- Canonical Black Iron original: transparent `myrren-authored-art-v1/black_iron_source_cutout.png`, SHA-256 `92475dd69836183a9be23414216182f74ce0937d83a4b4d86efca1c846b9565b`. This is local in review pack, not committed as a game asset.
- Candidate animation concept: `a_detailed_pixel_art_animation_sprite_sheet_in_a_c.png`, SHA-256 `2dda3f5d2b0cfab0422e5ff125bb0b0bfb264e5dbec8d4540b3db0babd0130e2`.
- Extracted 4 facing directions × (idle, walk, attack, death) × 4 frames = **64 transparent source-derived composite PNGs**, atlas 1792×624, cells 112×156 at source-derived resolution. Source framing, transparency, common ground anchor, 4 GIFs, 64-frame comparison and original-front contrast prepared locally.
- Source PNG has no modular wearable helmet/chest/legs/gloves/boots/shield: **all 64 are full suit composites**. Attack frame also has baked white sword slash. This is **not** the final player/equipment implementation.
- QA: alpha transparency, 64 cell occupancy, zero isolated tiny alpha pixel components, exact PNG-to-atlas cell reconstruction, ZIP CRC integrity, source SHA and material ID/forge level verification. All passed.
- Both local archives `Myrren_Black_Iron_01_Atlas_Review.zip` and `Myrren_Black_Iron_02_Individual_64_Frames.zip` exist as conversation downloads only, not committed in GitHub.
- No game renderer, character source, equipment asset or production build changed.

## Explicit visual fidelity blockers
1. Reproduce the **precise original Black Iron front**: angular dark-violet helmet with pointed crown and side flares, pointed shoulder plates, outlined V-shaped chest plate and violet hanging tassets, not just dark Steel shapes.
2. Author original-quality side and back versions, then idle/walk/attack/death frames in one pixel grid with identical player proportions/foot pivot.
3. Extract/author independent wearable pieces in correct painter's order, including matching brown base Kez hair/face. Never extract arbitrary rectangles and call them wearable.
4. Verify front facial eye symmetry, no back/front buckle, sword on dominant hand, shield on offhand, no double baked slash.
5. Test game sizing with native gameplay, mobile+desktop and existing combat, inventory, saves, skilling and multiplayer before merge.

**This draft is NOT considered a completed tier or permission to move to Obsidianite.** Complete the missing directional visual fidelity first.


## V2 turnaround iteration — 13 November 2026, later review

A second generated source concept `a_detailed_pixel_art_game_sprite_sheet_asset_pre.png` (SHA-256 `d1dd89e65fdc169ccfd4704fa504942538f13ea9c71c57c006d4e7f98955ac5c`) restores the approved model's angular **violet pointed pauldrons, raised helmet side-flares, V-shaped chest, and hanging tassets**, in all four facing directions. The canonical approved original front remains SHA-256 `92475dd69836183a9be23414216182f74ce0937d83a4b4d86efca1c846b9565b` and is placed side by side with the new art for review. It is a closer **candidate**, not a replacement of the approved design.

Local artifact package `Myrren_Black_Iron_v2_01_Atlas_And_Reviews.zip` contains a 1856×608 transparent 16×4 atlas (cell 116×152), source-derived animation preview GIFs for idle/walk/attack/death, exact source hash and source-bounds manifest, four higher-resolution directional idle reference cutouts, and the approved-front comparison. `Myrren_Black_Iron_v2_02_Individual_Frames.zip` contains the 64 individual RGBA sprites. Local script reconstructs all 64 atlas cells exactly from the individual files, and both ZIPs passed CRC integrity. These files have been delivered in conversation only, NOT uploaded to the repository.

A static collage of the existing Crater Camp screenshot compares sprite display heights 28, 36, 44, and 52 px. **None of these is a live rendering test, and none is approved native gameplay scale**. As the sprites shrink to the original small player footprint, helmet facial and tasset detail becomes much less legible. A compact native-resolution artist redraw may be needed instead of blindly shrinking the illustration.

**Unchanged blockers:** mixed-slot wearable armour art missing; sword slash painted into attack source; verified grip and body layering absent; hurt/punch missing; real mobile/desktop browser art tests absent; final user visual approval of the V2 candidate not yet supplied. This remains an UNMERGED DRAFT only.
