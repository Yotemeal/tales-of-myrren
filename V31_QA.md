# V31 integration visual QA

The V31 artwork is a **128×320 PNG** containing 4 animation frames per direction, 32×40 pixels per frame.

| Row | Facing | State |
| --- | --- | --- |
| 0–3 | Front, left, right, back | Idle |
| 4–7 | Front, left, right, back | Walk |

## Before merging

1. Open `/v31-preview.html` from a deployed build of this branch (not from the live main URL).
2. Check all four directions in both Idle and Walk.
3. Use **Actual game size** to inspect the proposed **24×30** in-game rendering. This is intentionally smaller than the native 32×40 art and may lose pixel detail.
4. In the game, test unarmoured walking, standing, swinging a weapon, taking damage and player name placement.
5. Equip any armour piece and verify the existing armour-aware renderer takes over. The new V31 armour overlays are not implemented yet.
6. Verify NPCs, combat, movement, save data and UI remain unaffected.

## Current status

The PNG structure and source references have been checked. No automated CI checks were reported for this PR. A full gameplay browser test has **not** been completed. Keep the change on the feature branch until visual acceptance.
