# Kez V3 remaining armour tiers

This directory contains art sources and scale studies. The game does not load these PNGs.

| Tier | Material ID | Pose PNG |
| --- | --- | --- |
| Iron | 3 | 64 earlier full-suit draft poses |
| Steel | 4 | 64 earlier full-suit draft poses |
| Black Iron | 5 | 64 poses from the revised V2 concept |
| Obsidianite | 7 | Canonical front and three directional studies pending visual review |
| Myrrenite | 6 | Canonical front and three new directional studies pending visual review |
| Starsteel | 8 | Canonical front and three new directional studies pending visual review |

Each tier includes the original transparent front, sword and shield cutouts. The compact sword and shield studies use Bronze's trial image heights (14 px and 10 px) with each source's aspect ratio. These files have no hand anchors or directional profiles yet.

The pose studies use the Bronze gameplay draft's 32×40 cell and foot boundary at (16,39), with nearest-neighbour sampling from the recovered transparent PNGs. 33 px is the front-idle comparison height, and the same scale applies across all animation cells of a tier. The last attack frame in each animated set still contains its source-art slash. Use the material IDs in the manifest rather than the order of these folders.

To use these designs as wearable equipment, author separate helmet, chest, glove, leg and boot layers on the chosen gameplay rig. Author clean weapon and unarmed poses, hurt frames, and offhand profiles and grips. The full-suit poses here cannot represent mixed slots. The older Myrrenite 32×48 trial predates this character and its wearable sprites require review against the current design.

Iron, Steel and Black Iron each have a separate full-suit body atlas and a four-row finishing slash PNG. Each slash cell shares the body cell's origin and can be drawn independently. Recombining the layers reconstructs the original pose study byte-for-byte. These separate body atlases are inputs for sword-fit work.
