# Tales of Myrren — unified scale & visual direction
**Design study | 11 November 2026 | Not production art or gameplay**

## Direction

Use the *readability and relative proportions* of classic compact pixel MMORPGs, including Curse of Aros, **not their artwork or internal asset dimensions**. There is no verified public native-sprite dimension sheet or tile-size specification for Curse of Aros in the sources reviewed. The visual references below are screenshots, so measurements are **approximate on-screen ratios**, not native pixels.

References:
- [Curse of Aros outdoor screenshot, MiniReview](https://minireview.io/mmorpg/curse-of-aros-mmorpg): clustered compact evergreens, tiny ground rocks, playable clearings, distinct player/enemy silhouettes
- [Curse of Aros woodcutting, official fan wiki](https://www.curseofaros.wiki/wiki/Woodcutting): character adjacent to a full tree and trunk
- [Curse of Aros wiki updates](https://curseofaros.wiki/wiki/Updates): the developers describe increasing *contrast and shape clarity* in graphical reworks

No CoA source art or sprites will be copied. Targets below are original **Myrren** decisions derived from our **21×27 Kez V2 hero** and 16×16 world tiles.

## The actual world as of main

- The authoritative player sprite is **21×27 displayed native pixels**, 84×162 source atlas with 4 columns × 6 rows. Its *planted-feet point* is the world-space anchor. The earlier V31 32×40/32×48 art proposals are not the current production renderer.
- Ground tiles are **16×16**, and the existing level is **1600×1600 world pixels = 100×100 tiles**. Map coordinate changes would affect persistent player positions and spawning.
- Trees: all 7 tree art files are **96×96 source PNGs**, but the renderer displays ordinary standing resource trees at **144×144**, a 1.5× fractional rescale. At the 27px-tall character scale, that is **5.3 character heights** for all species — oversized and repetitive.
- Ore: approved reference PNGs range **153–203 source pixels wide**, drawn at 24px wide by `myrren-environment.js`; `myrren-game.js::drawRock` applies a **further 0.72× canvas transform**, leaving about **17.28 world pixels** width. This downsampling is wasteful and loses the colour layering of the source rock reference.
- A *missing/slow resource PNG* uses a procedural rock sprite of nominal width **42px**, becoming **30.24px** at 0.72×; it can jump in visual size when the PNG loads. Make final authored PNGs and fallback size coherent later.
- Buildings: the 5 service sites use footprint widths **54, 56, 56, 56, 88px** in `myrren-world.js`; the `myrren-environment.js` house draws onto a 110×126 local sprite canvas with roof heights dependent on building. One `arms` smithy is an open trade/furnace/anvil space. **Footprint width ≠ visible sprite bounds**; do not blindly resize collision or move shop coordinates.
- Fishing: current shoals are three tiny fish-like shapes with broken concentric ripples on the water; their interaction targets/cooldowns exist separately.
- Combat fauna: `myrren-game.js` draws slime, goblin, wolf, boar and bears procedurally, including Q_BEAR-derived cave and Aether bosses. These are mostly compact **~10–26 native-pixel shapes**. Boss art deserves a distinct silhouette, but boss collision, attack reach and reward logic must remain intact.

## Proposed artwork size budgets (NOT shipped)

Every unit below is a **world pixel**, not a CSS/screenshot pixel. Width and height are *visual artwork envelopes* rather than collision sizes, and they are deliberately more varied than the current uniform tree texture.

| Category | Current visible | Proposed authored envelope | Visual intent |
|---|---:|---:|---|
| Kez V2 player | 21×27 | **21×27** baseline | Keep expressive hair/face and exact planted-feet anchor |
| Copper/tin/iron/coal rock | ~17px W effective | **20–24px W**, ~14–20px H | Low, chunky ore clusters with distinct ore veins |
| Black Iron/Obsidianite/Myrrenite/Meteorite | ~17px W effective | **24–28px W**, ~16–25px H | Rare rocks slightly more imposing, not character-height monoliths |
| Bramblewood | 144×144 | **58×76** | Stacked dark conifer tiers; narrow trunk |
| Alder | 144×144 | **64×78** | Rounded clustered foliage; broad crown |
| Ironbark | 144×144 | **68×90** | Strong split trunk; more visible bark |
| Elderthorn | 144×144 | **102×124** | Rare ancient, wider crown and roots; exceptional landmark |
| Starroot | 144×144 | **82×106** | Unusual rooted form; restrained magical accents |
| Redleaf | 144×144 | **62×78** | Red/orange deciduous canopy; same tonal density as Alder |
| Duskwillow | 144×144 | **68×89** | Drooping outer edges with light trunk visibility |
| Bunny / bird | roughly ~10px | **10–16px W** | Small wildlife, animation readable in peripheral vision |
| Slime | roughly 14×10 | **12–16×10–12** | Smaller than player, distinct gelatinous movement |
| Goblin | roughly 16–20px high | **15–20×18–24** | Around player chest/shoulder height |
| Wolf / boar | roughly 16–25px envelope | **22–30×15–23** | Low, forward-reading body silhouettes |
| Ordinary bear | roughly player size | **28–38×22–31** | Heavier than wolf, readable paws/head |
| Cave / Aether boss | same base bear sprite family | **42–58×38–52** | *Boss* silhouette ~1.4–2× player height, with safe overhead clearance |
| Familiar pets | assorted compact pixel sprites | **10–18×9–18** | Smaller than player, no screen clutter |
| Small shop façade | variable ~70–110px art | **70–100px W, 68–105px H** | Recognisable shop sign, legible entrance and roof |
| Camp key structure | larger stations/hall | **110–140px W where space allows** | Landmarks not endless rows of oversized identical houses |
| Main visual paths | ~26px across | **~34px visual width** | Clear 2-tile walking route; maintain existing collision and coordinates |
| Fishing school | ~20–30px effect | **24–36px effect envelope** | A natural cluster of fish, occasional ripples, no permanent particle ring |

### Conversion rules

- **Do not convert a 96×96 square tree directly into a 58×76 final sprite**. The current scale lab is a *footprint comparison* using existing art; the approved final asset must be **redrawn at the native target resolution**, preserving sharp source pixels and consistent outline weight.
- Do not keep 150–203px source ore paintings and scale them twice through non-integer transforms. Work should hand-author economical, high-contrast **native 20–28px rock sheets** referencing the approved ore colour and clustering.
- Draw all character/gear/monster sprites on a common **1 native pixel grid** with left/upper lighting, dark neutral outlines, 3–5 shadow/highlight tones, and ground-contact shading. Source pixel size is not the same as an object's physical world footprint.
- Use a trunk-based depth anchor and interaction footprint for trees, not the entire crown. Use genuine separate canopy motion frames rather than 24 horizontally sliced image bands; avoid obvious source seams.
- Preserve **original character personality**. New gear design does not mean changing the player's base anatomy/face.
- Buildings get different roof/trade signs/walls, but retain existing shop triggers and service locations. Doors should visually accommodate the player even when walk-in interiors are not modeled.
- Boss proportions are artwork budgets only. Do not change AI, attack distance, boss HP, collision or networking without a separately tested design change.
- Fishing art must respect water, bank/rod reach, no fishing visual grants rewards.
- All physical map limits, 1600×1600 coordinates, 16px terrain and existing saved characters remain unchanged in this scale-study phase.

## Map composition: fix density, not coordinates

The current map is **100×100 tiles**. Preserve its central Crater Camp, single south gate, the five service sites, west ore fork and existing lake fishing positions. Those are already used by saves and progression. Aim for consistent *screen-space rhythm* rather than merely enlarging the map:

1. Keep primary paths ~2 tiles visibly clear; no resource crown should completely hide the camp exit or shop labels.
2. Use dense woodland just outside the safe area, with alternating 58–90px ordinary species instead of seven identical 144px circles. Put Elderthorn/Starroot deeper in the forest as sparse landmarks.
3. Place ore on ground clearings with several body-widths of approach space, never directly under large canopy foreground pixels.
4. Add sparse rocks, sticks, fungi and grass tufts at 3–12px, not extra full-size trees; these should not become new interactive nodes.
5. Frame water through shoreline and reeds, but keep genuine fishing spots visible while uncast and avoid excessive glowing indicators.
6. For additional exploration, design **new connected map zones** on top of this stable region instead of shifting current saved coordinates to imitate a different game's world size.

## Review and QA in this branch

- `public/art-scale-targets.json` is the machine-readable target table, deliberately marked `review-only-not-production-approved`.
- `public/asset-scale-lab.html` and `asset-scale-lab.js` use the **actual current Myrren PNGs**, the current character renderer, and the real building/fishing rendering functions in representative *constructed* camp/forest/lakeside samples. The panels are **not game screenshots**.
- The left panel keeps current 144px trees and ~17px effective rocks. The right panel varies their preview scale and visible path width only.
- Work should use this stage to evaluate ratios visually, then create authored native sprites that match the *taller new source-size envelopes*. Add actual desktop/mobile world screenshots before changing production.
- **No production graphics, source images, collision, saves, combat, resource positions, physics or multiplayer have been modified.**

## Recommended design order

**First:** original Bramblewood + Alder + native Copper/Tin ore + one ordinary monster (goblin or wolf) in one shared village/woodland concept scene with Kez. These set density, shading and silhouette.

**Second:** 5 Camp service buildings/shops with the same pixel density, respecting original footprint and distinct identities.

**Third:** Ironbark, Redleaf, Duskwillow, Elderthorn and Starroot; then higher ore tiers and large bosses. Compare the entire world instead of judging individually.

**Fourth:** fishing/small wildlife/pets effects after world and creature scale is locked.

Approve **silhouette, visual size and readability at native game scale** before Work turns the concepts into assets and integrates the tested atlas. Use one reusable sizing spec across the whole content pipeline.
