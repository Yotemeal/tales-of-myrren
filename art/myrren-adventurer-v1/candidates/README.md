# Approved-reference front-facing 32×40 pixel art — candidate

**Source of truth:** the user-supplied olive-cape reference image (14 Nov 2026, square brown eyes / cheek scar / olive cape / gold clasp). Do not substitute the original Aros image or older Kez artwork.

**New real native PNG:** [candidates/approved_reference_front_32x40.png](candidates/approved_reference_front_32x40.png). Manually redrawn directly on the 32×40 RGBA integer grid, with zero or full alpha. It is a **front-only candidate**. The pre-existing 96-frame atlas is *not* a faithful reproduction of this reference; do not treat it as approved by association.

This file is added to the existing draft art PR #93 only, not to `main`, the runtime, or the deployed game. The source archive delivered in the user chat includes `build_front.py`, `test_front.py`, the native PNG, and a nearest-neighbour 16× review preview.

## Next implementation step

1. Review front at native/2× size against exact reference; do not claim user approval of these converted pixels yet.
2. Once visual fidelity is accepted, author back/right/left poses at the same grid/palette, then new gait, attack, hit and death frames, keeping feet at local (16,39).
3. Write new per-frame socket coordinates; author wearable armour separately, preserving inventory IDs.
4. Test with an opt-in game preview, including mobile, combat, peers and save. Do not silently substitute or merge legacy 21×27 equipment.

**Local QA:** 32×40 dimensions, hard alpha, both square pupils, gold clasp, cheek scar and nonempty silhouette tests passed. Browser QA not performed.
