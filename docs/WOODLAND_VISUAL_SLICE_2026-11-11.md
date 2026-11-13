# Tales of Myrren — First Woodland Visual Slice (Concept v1)
**11 November 2026 · Design reference only · NOT a game asset or production approval**

## Purpose

Establish one shared, original pixel-art style before Work produces sprite sheets. A concept-only woodland scene has been made in the design chat. It is a **mood/composition reference**, NOT a source of pixel-perfect coordinates, animation frames, material names, level gates or engine dimensions. Work should request the accompanying `myrren_woodland_concept_v1.png` from the design conversation or art handoff package.

The AI concept board may contain generated labels, invented resource names, oversimplified directional animation frames, or armour tiers unrelated to Myrren. **Those labels are not approved game data**. The real repository definitions and `public/art-scale-targets.json` are authoritative. In particular, we do not introduce Mithril, Adamant, Runite, or other unrelated progression materials.

### Design identity

Compact, detailed **but still readable** classic 2D pixel RPG. Soft upper-left lighting; dark, slightly warm 1px native outlines; small coherent clusters of highlights and shadows; no smoothed/vector edges; crisp nearest-neighbour display. Do not copy Curse of Aros copyrighted sprites or map elements; its scale/readability is inspiration only. Keep Myrren's distinct progression, geography, character and naming.

The current Kez V2 character is the **21×27 native-pixel base anchor** with dark tousled purple-brown hair, expressive simple face, and chunky shoes/feet. It must not be re-invented, stretched or replaced by the discarded 32×48 character prototype. Its gait and all existing equipment slots are Work's separate technical stream.

## Scene 1: Woodland meets Crater Camp

A visual design scene approximately **320×224 world pixels** (20×14 tiles), showing:

- **Kez** near the lower centre, 21×27 native pixels, unarmoured or in existing working test gear, planted-feet anchor; no invented giant helmet.
- **Bramblewood** conifer: target **58×76** native art, overlapping the path lightly but exposing the trunk and collision/interact footprint.
- **Alder** round-canopy tree: **64×78**, distinctly different crown rather than a recoloured conifer.
- **Copper** and **Tin** rock clusters: about **22×16** and **22×18**, recognisable by metal vein colours at 1× with strong clustered silhouette.
- **One goblin**: **~18×22**, readable ears, face, body and small weapon; clearly not larger than Kez. Its combat reach/hitboxes remain unchanged.
- **One existing camp shop:** use the **Axe/woodworking shop** (`axe` in `public/myrren-world.js`), not a newly invented forge interior. Target rendered appearance around **80–90px wide × 70–90px tall**, with original shop footprint and interaction points intact. Stone foundations, timber doorway, restrained roof, sign icon; shop identity should read without huge signage.
- **Ground:** existing 16×16 tiles with restrained grass/flowers/pebbles and one main path ~34px visually. Keep tree bases, player and resources legible against the environment.

The scene is a **representative scene**. It is *not* a replacement for any existing world chunk, map save coordinates or physical resource node positions.

## Relative hierarchy — design approval candidate

| Asset | Intended native visible size | Why |
|---|---:|---|
| Kez V2 base character | 21×27 | Fixed identity and anchor |
| Copper | about 22×16 | Low cluster, not a huge boulder |
| Tin | about 22×18 | Same physical family; cool readable veins |
| Goblin | about 18×22 | Close to player body size, distinct green silhouette |
| Bramblewood | 58×76 | Ordinary taller-than-wide conifer, ≈2.8 player heights |
| Alder | 64×78 | Ordinary rounded crown, ≈2.9 player heights |
| Axe shop visible artwork | ≈80–90×70–90 | Substantial but does not dominate a small camp viewport |
| Main visual path | ≈34px across | Clear two-tile route; keep existing gameplay collision |

The source tree PNGs on main are 96×96 but currently display at 144×144; **do not shrink the old images and call them final artwork**. The currently rendered ore images are 24px wide and then scaled by 0.72 in the game wrapper, leaving **~17.3px**. Final ore should be truly authored at native 20–28px and rendered without that nested fractional scale. No immediate change to the renderer or node positions is authorised by this brief.

## Production sprite deliverables for Work **after visual approval**

- **Kez**: use existing `public/assets/kez-v2/kez_v2_atlas.png`; no new player base art.
- **Bramblewood**: native 58×76 transparent PNG, optional 4-frame separate canopy animation overlay; front-trunk and rear-canopy masks if needed. Stump/harvest state remains tied to existing game data.
- **Alder**: native 64×78 transparent PNG, independent shape, same anchor and depth rules as Bramblewood.
- **Copper**: native 22×16 transparent PNG with one or two subtle mining-impact frames; preserve cooldown/depletion logic.
- **Tin**: native 22×18 transparent PNG with equivalent mining states.
- **Goblin**: native ≈18×22 source sprites; all directions and idle/walk/attack/hit/death as required by the existing combat draw path. Prototype at same world scale as Kez, not magnified separately.
- **Axe shop**: character-scale static building sprite using existing shop coordinate/door/interaction model. Leave the working open-air smithy/stations unchanged until separately reviewed.
- **Shared environment palette**: named colours and 1px outline/shading logic should accompany each native sprite sheet; use original creative art rather than cropping the concept image.

The concept screenshot may be exported at much larger screen resolution for review; this does **not** increase the approved native sizes.

## Acceptance criteria before migration

1. Show the **same scene at 1× and a nearest-neighbour integer 2×/3× zoom**. Ore veins must still read distinctly; goblin silhouette must not be lost in grass.
2. The player must remain recognisable as the approved Kez V2 silhouette; the scene must preserve normal movement clearance around trunks and ore.
3. Tree crowns occlude logically; the trunk remains steady while the canopy sways minimally without slice/tearing artifacts. Rare Ancient Elderthorn remains a later, larger landmark, not the default tree size.
4. Building doorway, signs and roof must visually match the unchanged interaction footprint; don't obstruct the south camp exit.
5. No gameplay changes to resource IDs/counts, ore mining, tree depletion/respawn, path collisions, monster attacks, inventory, world saved coordinates or multiplayer.
6. Work should verify the existing character in actual browser screenshots and avoid using an AI concept as direct crop/texture source.
7. Only after the first scene is approved should Work create the other 5 tree types, 6 remaining ore types, other mob silhouettes, and additional shop art.

## Current implementation status

- **Completed in chat:** concept composition with all representative elements; a full-size PNG review image has been created as a user-visible artifact.
- **Completed in PR #77:** scale specification and isolated read-only comparison lab. The numeric world-scale contract was exercised successfully in V8.
- **Not completed:** hand-authored native sprites, actual scene integration, browser/mobile approval, imported concept image in GitHub, cross-device tests and release merge.
- **Safety:** PR #77 remains draft. Live `main` untouched.
