# Obsidianite 64-frame concept extraction — QA record

**Date:** 13 November 2026  
**Metal ID:** 7  
**Forging requirement:** 40  
**Status:** DRAFT with failed visual-fidelity gate; user has NOT approved replacement armour.

## Exact source trace

Canonical approved original front: `obsidianite_source_cutout.png`, SHA-256 `1acec039f713f3d1e7bdb4c06c63f1f5bc287b3df506ec29d29cfc70b56149ea` (142×239, RGBA).

New illustrated CONCEPT: `a_clean_high_resolution_pixel_art_sprite_sheet.png`, SHA-256 `048958b26de5fd85424dd7acda45f71ae8f4dfc31967450e6588fcb7f482ea19`. This is not the approved original and **must not replace it**.

## Completed local work

Extracted **64 source-derived transparent full-body pose sprites** (4 directions × 4 actions × 4 frames) and composed a transparent **1824×640** atlas (16 columns × four rows; 114×160 source-derived cells), with common placed-foot pivot `(57,157)`.

Rows: front, right, back, left. Column groups: idle 0–3, walk 4–7, attack 8–11, death 12–15.

Two user-download packages exist outside GitHub:
- `Myrren_Obsidianite_01_Atlas_And_Review.zip` — transparent atlas, comparisons, validation script and manifest.
- `Myrren_Obsidianite_02_64_Individual_Frames.zip` — 64 individual transparent PNGs, manifest and validation script.

`Obsidianite_Original_vs_New_Turnaround.png` scales the approved front and all four new direction studies to the same displayed height for meaningful comparison. `Obsidianite_64_Frames_Review.png` shows the actual extracted sprites, *not* fake gameplay.

Tests performed: each atlas cell contains one sprite; all 64 PNGs reconstruct their atlas cells pixel-for-pixel; correct alpha, cell dimensions, SHA-256/source metadata, material ID/Forge Lv40, no old section separator lines, no stray attack/death neighbour sprites; ZIP archive integrity passed.

## Critical design discrepancy

The original approved Obsidianite has a **closed angular purple helm** with violet jewel, near-black visor, **narrow vertical lower-face opening** and **NO visible eyes**. The new concept's FRONT shows Kez's eyes and less helmet coverage, and some side/head proportions differ. This is a **failed visual match**, not a new accepted armour look. Do not mark Obsidianite visuals approved, do not adjust original master, and do not proceed to Myrrenite based on this candidate as a completed tier.

The candidate's original concept illustration includes its own green "ready" mark. **That mark is not approval and has no release authority.**

## Missing game asset production

These 64 PNGs depict **complete suits**, not separate wearable helmet, body, legs, boots, gloves or shield layers. No authored mixed-material overlays, true sword/punch/hurt animations, correct sword and shield hand attachments, depth masks or real browser in-world scale tests. Candidate attack frames include drawn slashes and must not be overlaid with another generated slash. Binary PNGs have not been uploaded to GitHub or integrated in the game.

**Do not merge into main.** Preserve saves, game collision, inventory, combat, remote players and skilling.
