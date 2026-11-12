# Starter region — scene production handoff (2026-11-12)

> **PLANNING ONLY** — this document and `design/starter-region-v1.json` do **not** ship a new map, source art, crafting recipe or game renderer. Approval of a concept is not approval of engine changes.

## Exact baseline and scope

- Deployed entry: `public/index.html`; live world geometry: `public/myrren-world.js`; source asset loader: `public/myrren-environment.js`.
- Current map: 1600×1600 game-world pixels, 16px tiles, crater centre (800,800).
- Current playable Kez V2 native atlas: **21×27** source cell, `public/assets/kez-v2/kez_v2_atlas.png`; original bare torso and dark shorts. **Never swap in the blue-shirt character or a 32×40/32×48 experiment** to solve environment proportions.
- Live `public/myrren-world.js` still has service-building footprints for axe, pick, arms, food and fish; lake at approximately (1250,1055); `bridge=null`, `bridges=[]`, `onBridge()=>false`. The **southern river and usable damaged bridge from the approved concept are NOT live**.
- Existing environment art loader resolves `/assets/resources/tree_<name>.png` and `ore_<name>.png`; source PNGs are much larger than target display sizes. Do not create blurry 96→tiny rescales and claim native pixel art.

## Locked design identities (not exact map coordinates)

The starter region is a real survivor outpost **inside** an impact crater, **not** an established town.

**Crater Camp**: fractured crater walls, ruins of an unknown ancient city, one southern collapsed entry, compact open forge/anvil/furnace, central odd jobs board, accessible storage chest, essentials stall, rest/cooking fire and Traveller Gus with a horse and loaded cart. No houses, enclosed shops, river or bridge **inside** camp. Keep the central path clear.

**Bramblewood**: dense forest surrounds camp well beyond a close-up image; modest beginner mining with Copper, Tin, Iron and Coal, with the other ores reserved for meaningful later routes. Trees, rocks and fallen logs provide visual depth without blocking basic movement. The five approved tree *concept identities* are Bramblewood, Alder, Ironbark, Elderthorn and Starroot; existing Redleaf/Duskwillow assets are **not authorization** to replace approved identities.

**Ancient ruins (north/west)**: moss-covered foundations and weathered pillars among trees, hinting that the city existed before the impact.

**Goblin emergence (northeast)**: a gradually rockier path, abandoned tools/carts, disturbed mine entrance and small goblin activity. Star fragments are lore hints, not permission to add rare loot or new crafting economy.

**Southern river and travellers' bridge**: basic fishing on the accessible Bramblewood bank; a damaged-looking **usable** crossing at the southern boundary. Don't place fishing or a bridge inside camp.

**Direwood (south of river)**: thick, distinctly dark and gradually corrupted forest across the water. Twisted roots and a little purple corruption establish a later danger; don't flood the beginner forest with high-tier drops or dangerous encounters.

These zones form the connected design graph in `design/starter-region-v1.json`. Directions and connectivity are **conceptual** until a save-compatible world migration is approved.

## The real assets to author first

Work must first inventory `public/assets/resources/`, then **author or refine** individual native-pixel transparent PNGs. No procedural character/armour replacements and no slicing AI poster images into production sprites.

| Priority | Production slice | Target principle | Acceptance example |
|---|---|---|---|
| 1 | 16×16 grass, worn-dirt, grass/path edge, rocky/ruin floor | Seamless 1× native tile grid, no interpolation | 8×8 tiled samples show no obvious seams |
| 2 | Starter copper and tin deposits | Match Kez 21×27 body; readable silhouettes even without colour | Static screenshots show at most modest boulder footprint; no source resize blur |
| 3 | Bramblewood and Alder tree shapes | Consistent trunk/foot anchors, relative silhouettes | Normal game zoom shows forest density without entirely hiding the player |
| 4 | Fallen log + mossy ruin pillar | Natural small props, separate collision footprint from art | Paths remain comfortably traversable |
| 5 | Riverbank and simple reeds | Clear water/land boundary and fish interaction marker | Fishing target visible without oversized UI |
| 6 | Camp stove/anvil/board/cart | Distinct small service props, use existing interactions | No duplicate or moved service triggers until separate integration task |

All dimensions of *new* ore, tree, NPC and building silhouettes beyond the 16×16 tile size and current 21×27 body are **review targets** from [PR #77](https://github.com/Yotemeal/tales-of-myrren/pull/77), not approved final measurements. PR #77 already has an isolated relative scale lab. Do **not** fork or duplicate that lab; use it to compare actual game assets.

## Immutable gameplay contracts

A visual art branch cannot change `public/myrren-world.js` object positions or water collisions, mining yield/depletion timers, woodcutting resources, smithing and recipes, combat/loot, player save keys, inventory ID/index ordering, multiplayer authority or NPC/service hitboxes.

When designing the later map migration, explicitly plan: safe spawn, walkable 2-player paths, bridge collision/passage, blocked banks except where intended, fishing proximity and action prompts, goblin cave access, potential resource redistribution, preserved saved positions and an escape route from each biome.

## Equipment branch separation

- [PR #78](https://github.com/Yotemeal/tales-of-myrren/pull/78) is Work's **draft** Kez V2 equipment foundation. Do **not** rewrite or merge into this map/art branch.
- [PR #76](https://github.com/Yotemeal/tales-of-myrren/pull/76) is older experimental Bronze art; PR #78 reuses its foundation, so don't independently merge it.
- [PR #77](https://github.com/Yotemeal/tales-of-myrren/pull/77) is the world-scale concept lab, not live environment art.
- [PR #24](https://github.com/Yotemeal/tales-of-myrren/pull/24) is older creature/pet planning; its game JS predates mainline Forging/mining improvements.
- [PR #79](https://github.com/Yotemeal/tales-of-myrren/pull/79) contains an independently validated **mobile UI QA fix** and must remain separate from art.

## Native asset delivery contract

For each new resource sprite, require:

1. A real transparent PNG at **authored native pixel size**; crisp alpha, no blurry borders, no doubled outlines or disconnected pixels.
2. An unchanged Kez V2 shown adjacent at **normal gameplay zoom**, not just a magnified image.
3. Pixel dimensions, planted-feet/ground anchor and whether the object is interactive or decorative. Do not infer collisions from visual bounding boxes.
4. For gatherables: depleted/regrown visual states with unchanged original XP, harvesting and respawn behaviour.
5. For trees: idle and very subtle gust-state preview with trunk fixed at ground anchor; no seam in animated bands or leaf spawn.
6. Mobile portrait and desktop screenshots from the **real** game renderer before live integration.

## Automated contract

Run `node design/validate-starter-region.cjs` using the standard repo checkout. It verifies:
- Approved region connection topology and explicit camp no-houses rule;
- 16px tile / 21×27 player baseline;
- All five tree and eight ore **source** PNGs exist and have valid image dimensions;
- Beginner resources only versus advanced materials, including **Meteorite → Starsteel**;
- Data status remains **planning-reference-only**.

Passing this test does **not** mean production art is ready, game world migrated, or the art style visually approved.

## Next engineering release sequence

1. Keep PR #78 isolated until its current Bronze tests and **visual** approval are complete.
2. Use PR #77's existing scale lab to review tree/ore/player ratios and request genuine authoring, not size tweaks in code.
3. Create a compact environment visual proof on a separate branch; compare at 1× actual zoom, tablet and mobile.
4. Plan world-collision and saved-location migration before placing the southern river, actual broken usable bridge or Direwood.
5. Integrate biome sections in small game-tested PRs; never import an old complete `myrren-game.js` from a historical concept branch.

**Definition of ready:** source PNGs, visual screenshots, demonstrated interaction/collision compatibility, CI green, explicit user art approval.
