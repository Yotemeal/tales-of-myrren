# Kez V2 Bronze equipment proof

Open the game on this branch with `?bronze-proof` to enable the six experimental Bronze PNG layers from PR #76. This branch uses the existing forged sword asset and renderer. PR #77 is a separate world-scale study.

The body atlas stays at 21×27 pixels. `MyrrenKezV2Atlas.pose()` selects the source row, column and native cell origin once for the world draw. Idle front uses row 0, walking uses directional rows 1–4, and stationary rear and side use the first directional cell. Sword hits hold that directional cell. Row 5 contains baked attack pixels and remains unused. Hit opacity and the existing death transform affect the entire character composite. The equipment proof does not supply new punch, sword or death body poses.

The manifest lists physical PNG blocks by name. Each block contains `slotBlockRows` rows of four cells. Cell dimensions may exceed the body dimensions. `originX` and `originY` locate the body cell's top-left inside each equipment cell. Both passes draw at native size with integer offsets and nearest-neighbour sampling.

| Saved slot | Render array index | PNG block |
| --- | ---: | --- |
| head | 0 | helmet |
| body | 1 | body |
| legs | 2 | legs |
| boots | 3 | boots |
| shield | 4 | shield |
| hands | 5 | gloves |
| weapon | separate tool/material state | existing forged weapon renderer |

Side shields draw under the body. Over-body PNG layers draw in this order: leggings, boots, chest, helmet, gloves, shield. Items without a loaded atlas still use their established overlay path. Saves and peer payloads retain the existing slot order and IDs.

Bronze art remains provisional. PR #76's helmet, chest and shield repeat within each directional walking row. Its experimental attack cells have no compatible body pose, and the existing sword and fist sockets still need authored attack frames. Review those assets before enabling the proof by default.

## Idle and walk fitting

The proof PNG now positions the existing helmet art relative to each direction's head, follows the last column's lateral torso shift, and aligns each boot cell to its body frame's bottom opaque row. The body PNG is unchanged. Its torso, belt and lower-leg pixels differ from the supplied bare-chested concept reference, so this fit targets the live atlas.
