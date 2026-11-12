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

The shield art is repositioned per idle and walk cell and retains its narrow side profile. Gloves are placed on the visible knuckles in the body cells. Side cells carry a single near-hand glove. These are idle and walk adjustments. The combat grip still uses the current weapon renderer.

Presence now carries cosmetic facing, hurt and death state. A receiver timestamps a new hit or collapse on its own clock. Repeated packets keep the original animation start, and respawn clears collapse. Older payloads still use movement-inferred facing. These fields affect only peer appearance.

Kez's pose also exposes native weapon-hand sockets. In Bronze proof mode the sword uses the selected cell's hand socket plus the same origin as the body and gloves, including during walking and collapse. Sword strikes still use the established sword motion and grounded directional body cell.

The bare-character punch proof uses a separate 63×108 PNG with four directional rows and three native cells per row. The sequence is ready, wind-up, extension, wind-up, ready over the existing visual swing interval. Original head and feet pixels are preserved and the legacy slash row is excluded. This is enabled by `?bronze-proof` for bare fists and for fists wearing only supported Bronze pieces. The manifest’s `punchStartRow` points to four directional rows inside each slot block. Those rows carry matching equipment cells for the three poses. The glove on the punching hand moves while the offhand and shield hold their pose. Mixed tiers use the existing punch until their layers are available.

The Bronze sword proof uses a separate 63×108 body PNG and four additional directional rows per equipment block at `swordStartRow`. Ready, wind-up and follow-through cells supply matching glove art and hilt coordinates. The existing forged sword asset rotates around that hilt, and shield depth remains direction-dependent. Mixed tiers keep their existing sword animation until they have matching layers.

Bronze proof collapse uses two pre-rendered nearest-neighbour poses from the existing directional body and gear pixels, at 0.70 and 1.57 radians. The separate 72×896 PNG has 36×32 cells with ground pivot (10,16), body first, then equipment in manifest slot order. Each layer has four directional rows. The sword uses the same pivot and angle as the selected cell. The initial tip retains the existing short rotation and unsupported equipment combinations use the original collapse.

## Registering a replacement atlas

In proof mode, `public/assets/armour/equipment-atlases.json` lists the manifest URLs to load. To replace Bronze art, point its manifest at the new transparent PNG and update the cell size, slot order and origin if needed. Keep the existing material ID. To register a different existing material, add its manifest URL to the list. The base character atlas and inventory code are independent of this list. Use one manifest per material. A failed image load leaves the existing overlay available.

A manifest can supply a `collapse` object with `image`, `firstBlock`, `originX`, and `originY`. Each slot uses four directional rows and two 36×32 pose columns. Follow the main manifest's slot order. Use `firstBlock: 0` for an equipment-only sheet. Bronze uses `1` to skip its embedded body block. Native attack and collapse poses require every equipped armour slot to have the corresponding frames. Incomplete loadouts use the established fallback animation. Sword artwork and body-hand sockets are separate from the armour atlas.
