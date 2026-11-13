# Myrren Adventurer V1 — character source art (draft)

**Start with:** [full art decisions + implementation handoff](../../docs/CHARACTER_V1_IMPLEMENTATION_HANDOFF.md).

This folder preserves the **new olive-cloak character approved in chat on 14 November 2026**. It is a new compact, original Myrren base design and supersedes older Kez V3 *base appearance* studies, but not the seven established metal-tier item IDs or agreed armour references.

Files:
- `approved_concept_reference.webp`: preserved visual concept at 1254×1254; web-compressed from the approved large image (the rendered concept is **not** a native pixel asset).
- `myrren_adventurer_v1_32x40.png`: real 32×40 native transparent pixel atlas, 24 columns × four directional rows.
- `myrren_adventurer_v1_front.png`: transparent first-frame reference.
- `myrren_adventurer_v1_review.png`: enlarged contact sheet (first frame only for each action/direction).
- `myrren_adventurer_v1_manifest.json`: 96 frame rectangles, animation and hand sockets, palette and SHA.
- `build_character.py`: pixel authoring source, regenerates atlas and metadata.
- `test_character.py`: non-live pixel-integrity QA.

Build / test from repo root with Pillow 10–12:

```sh
python art/myrren-adventurer-v1/build_character.py --out art/myrren-adventurer-v1
python art/myrren-adventurer-v1/test_character.py
```

**This PR is source art only.** No playable character renderer, armour layer, browser proof or main deployment was changed. Implement behind an opt-in preview flag; see the full handoff and draft PR. Preserve current game saves, combat, movement, UI and existing renderer until approved.
