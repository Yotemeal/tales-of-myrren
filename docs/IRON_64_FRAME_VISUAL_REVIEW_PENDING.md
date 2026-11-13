# Iron character/composite sprite review — 13 November 2026

**Visual status: pending user review, not accepted, not merged.** Bronze and the approved Kez base character remain unchanged.

## Material identity
- Metal: **Iron**
- Material/item ID: **3** (unchanged)
- Forging requirement: **Level 10** (unchanged)
- Source candidate illustration: `a_high_contrast_clean_pixel_art_sprite_sheet_on_a.png`
- Candidate SHA-256: `af68a0bc67a9ae00d784e8498059b00cb7a6d711827156a9a511328156d04ff5`
- **Correction:** the AI-generated candidate illustration accidentally said `Forge Lv. 2`. This text is **wrong**; the game and deliverable manifest use **Forging Lv. 10**.

## Art progression and assets actually built
The original user-approved Iron **front reference** remains `myrren-authored-art-v1/iron_source_cutout.png` from the approved Kez-and-armour progression sheet. The new draft four-direction pose illustration follows that nasal-guarded iron helmet, exposed face, mail/chest protection and larger shoulders/legs.

Created **64 extracted transparent full-body Iron PNG frames**, one for each front/right/back/left × idle/walk/attack/death × 4. The atlas is 1792×680 RGBA, arranged as 16 columns × 4 rows, with 112×170 padded cells and a constant planted-feet cell position of (56,167). Source art remains at concept resolution; this is **not** an approved native gameplay resolution.

Local downloadable review packages:
- `Myrren_Iron_01_Concept_Atlas_Review.zip` — atlas, exact source manifest, 4-direction GIFs, reference comparison, verification script, and contact sheet.
- `Myrren_Iron_02_Individual_64_Frames.zip` — 64 cropped PNGs, source/placement manifest, verification script.

### Validation completed on local PNGs
- Transparent PNG extraction and black-background removal.
- All 64 distinct **frame slots are populated**; all four directions/actions present.
- Each individual sprite reproduces its padded atlas cell **byte-for-byte**; no clipped cell boundaries.
- Source SHA-256, material ID, forging level, foot position and release flags are recorded.
- Both ZIPs pass CRC archive test.

### Not completed — do NOT represent as finished
- The Iron design itself has not been separately approved by the user.
- The illustrations are **full-body composited suit sprites**; there are still **no separate individually wearable Iron helmet, body, legs, gloves, boots and shield layers**.
- Attack animation includes a baked-in weapon slash; cannot be drawn along with forged-sword swing without double weapon artwork.
- No production native-scale original art, weapon-hand sockets, Iron/other-material mixed set, hurt and barehand-attack sprites.
- No desktop/mobile browser QA on live player, remote player, inventory, saves, skilling, combat or UI.
- **These binary review PNGs remain downloadable local artifacts; they have not been committed to this GitHub PR.**

**Do not merge or mark the visual artwork approved without explicit user inspection.**
