# Tales of Myrren — The Crater visual standard

Status: APPROVED ART DIRECTION — user-supplied concept and sprite sheets from Work. This document is a coordination reference, not a claim that the images have already been integrated.

## Non-negotiable visual standard
- Work's supplied original concept sheets are the authoritative design references. Reuse already-implemented Work assets; do not redraw or replace them without inspecting the existing implementation.
- In-game characters and creatures must use the same clean, outlined, readable pixel-art language as the existing Kez player and armour animation references. Avoid smooth painted/AI-style cutouts and inconsistent pixel densities.
- Preserve proportions at actual game scale, clear silhouettes, consistent foot anchors, transparent edges, and appropriate layering. Test on mobile at the real game zoom before approval.
- Idle, move, attack, hit, and death are distinct animations for hostile creatures. Passive wildlife has idle and flee behaviour; pets have skill-specific interactions.
- Preserve combat, inventory, drops, NPC interactions, progression and save compatibility while replacing visuals.

## Approved creature and level references
| Creature | Level | Notes |
| --- | ---: | --- |
| Forest Rat | 1 | Scavenger |
| Cave Goblin Gatherer | 5 | Lantern, crystal backpack, pickaxe; throws rocks, flees |
| Cave Goblin Protector | 16 | Shield and blade, skull mantle; melee defender |
| Wild Boar | 8 | Territorial |
| Dire Wolf | 12 | Apex hunter; camouflaged forest/ruins/cave variants |
| Cave Guardian (roaming) | 18 | Red-eyed crystalline stone guardian |
| Forest Troll | 22 | Large, heavy attacker |
| Jewelheart Guardian (boss) | 30 | Unique larger guardian with blue star jewels |

The general roster sheet also shows a generic Goblin Lv. 5 and a Cave Guardian Lv. 30; the more specific gatherer/protector and roaming/boss sheets should govern those variants rather than silently conflating them.

## Passive wildlife
Forest deer, rabbit, squirrel, raven and fox. They should flee rather than attack. Keep scale and movement believable; avoid overcrowding the crater town.

## Skill pets
- Timber Glider: woodcutting, follows/glides and interacts with trees.
- Geode Mole: mining, burrows with a dirt trail and surfaces near ore.
- River Otter: fishing, swims/dives and catches fish.
- Reference sheet proposes +3% skill XP while corresponding pet is summoned; confirm against existing gameplay balance before modifying stats.

## Player sprite standard
Use the provided bare-character movement sheets and steel armour multi-direction/action sheet as the reference for character scale, silhouettes, directional readability, weapon/shield placement and consistent animation frames.

## Crater starter outpost
- An impact crater with towering fractured rock walls drawn close to the small camp, forest beyond the rim and one collapsed southern entry path.
- Mostly earth and weathered stone inside; sparse regrowth, not a dark-green lawn.
- No rivers or bridges inside camp; no redundant shops or houses.
- Trader Gus: straw hat, overalls, straw in mouth, lounging with one leg crossed on a crate by his horse and covered trading cart. Only lowest-tier starter gear sold.
- Small compact community notice board, weathered storage chest, visually upgraded forge/anvil/furnace, warm gently swaying lanterns and restrained food/supply caches.
- Avoid central clutter; keep the inner clearing and paths legible.

## Integration checklist
1. Inventory Work's existing implemented sprites, sprite sheets, naming, dimensions and animation hooks before creating any replacements.
2. Map each approved reference to the existing entity ID, asset path, animation states and in-game scale.
3. Add missing assets only where needed; keep existing behaviour and collision.
4. Check transparency, frame alignment, directionality, depth sorting and no stray pixels.
5. Test mobile gameplay and screenshot the real build; concept mockups are not evidence of implementation.

## Current repository observations (2026-11-08)
- `public/myrren-game.js` contains procedural code-drawn Trader Gus/cart and pet functions.
- `public/myrren-environment.js` references `assets/resources/` for environment resource sprites.
- This audit is partial; it does **not** establish that Work's full monster or pet art is absent. Do not overwrite uninspected Work changes.
