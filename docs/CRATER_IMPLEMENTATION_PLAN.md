# The Crater — implementation plan and approved-design record

Status: third implementation stage completed on the separate branch, following the user’s “Carry on”. Merge and deployment still require explicit user approval. See CRATER_STAGE1_PROGRESS.md for the bounded mechanics preview and CRATER_STAGE2_PROGRESS.md for the supplied-frame fitting study, and CRATER_STAGE3_PROGRESS.md for isolated pet movement/XP integration and remaining asset gaps.

Reviewed on 7 November 2026 (Australia/Brisbane). Repository: `Yotemeal/tales-of-myrren`.
Baseline: `main` at `e1b349972019f2f6aa95e25841f7ecbfdb89e60b`, including the accepted sword-grip changes from PR #23.
Working branch: `plan/crater-creatures-and-skilling-pets`.

## 1. Sources and precedence

Use the six reference sheets attached to the current request, the recovered latest conversation decisions, and the existing approved player assets. Do not regenerate, reinterpret or redesign approved creatures. Current explicit instructions take precedence over earlier proposals; later specific approvals take precedence over older generic concepts. An unavailable detail is an open item, not permission to invent it.

Prior-conversation retrieval recovered specific final decisions, not a complete transcript. It confirms the eight names/levels below and final pet movement approvals. The current request explicitly confirms five wildlife; this supersedes an earlier excerpt listing only four and treating squirrel as optional.

### Reference register

All six attached files are accessible, unchanged 1536×1024 JPEGs. They are illustrated design/animation reference boards, not transparent, indexed runtime sprite atlases. The original images remain available under their existing file identities. Exact filenames, identities and SHA-256 checksums are recorded in [CRATER_REFERENCE_MANIFEST.json](CRATER_REFERENCE_MANIFEST.json).

| Ref | Attached filename | Contents and authority |
| --- | --- | --- |
| R1 | 449125F1-7C41-4AFA-8D66-4B9E71DC2F3C.jpeg | Initial monster roster; retain Forest Rat, Wild Boar and original Forest Troll appearance. Its generic Goblin and Lv30 Cave Guardian are superseded by R2/R3 and final names. |
| R2 | 92B94231-3DEA-4D57-8B27-75364FDEEF9A.jpeg | Common/red-eyed Cave Guardian Lv18 and larger Jewelheart boss Lv30; guardian lore and rare jewellery examples. |
| R3 | 7180DC61-09B0-4A12-B5FB-C80B416E4207.jpeg | Gatherer/miner and protector/guard designs and actions. Final conversation names are Goblin Miner and Goblin Guard. |
| R4 | F7AA665A-7FB3-40C1-AA2D-B5CA8C5706D3.jpeg | Five passive wildlife; grazing/alert/foraging/pecking/watching idles and species-specific flight/flee actions. |
| R5 | ABD545E9-3BA7-464E-A816-3BD1084E2AFA.jpeg | Final three skilling pets, movement/skill interactions, matching +3% XP and example relative scale. |
| R6 | E8219F5C-6F89-4540-B171-562015D380CC.jpeg | Latest Dire Wolf Apex Hunter design; replaces the earlier plain grey wolf in R1. |

## 2. Locked creature roster

### Eight hostile types

| Final name | Level | Approved design and behaviour | Required animation states | Source |
| --- | --- | --- | --- | --- |
| Forest Rat | 1 | Brown-grey rat, pink ears/tail, fierce ruin scavenger. | Idle, move, bite/attack, hit, death. | R1 |
| Goblin Miner | 5 | Smaller cautious green goblin, purple hood, ore/crystal pack, lantern and mining tool; gathers fallen-star fragments, avoids confrontation, throws rocks from a distance and flees when threatened. | Idle, move, rock-throw attack, hit, death; fleeing reuses approved movement until separate frames exist. | R3; final-name conversation |
| Wild Boar | 8 | Original approved stocky brown boar, tusks and bristled mane; territorial and aggressive. | Idle, run, charging attack, hit, death. | R1 |
| Dire Wolf | 12 | Final lean Apex Hunter with rugged mossy/bark-brown coat, amber eyes and scars; prowl, ambush/lunge and pursuit. Forest, rocky/ruin and cave/shadow colour adaptations use R6 only. | Alert idle, prowl, lunge, hit, death; approved camouflage variants. | R6; latest conversation |
| Goblin Guard | 16 | Larger, tougher goblin, dark purple hood, skull/spiked shoulder, red cloak, cleaver and wooden shield; guards nearby miners and their jewels, confronts intruders in melee and fights to the last. | Idle, move, melee slash, hit, death. | R3; final-name conversation |
| Cave Guardian | 18 | Original common stone-and-crystal guardian with moss, blue crystals/runes and red eyes; roams caves and protects its kind. Do not substitute the larger boss silhouette. | Idle, move, slam attack, hit, death. | R2; latest conversation |
| Forest Troll | 22 | Original first-concept mossy green bulky troll with club, cloth and rough stone details; brutal forest stalker. | Idle, move, club slam, hit, death. | R1; latest conversation |
| Jewelheart Guardian | 30 | Larger unique ancient guardian from R2, with denser crystals, moss, red eyes and larger fanged face; territorial boss guarding remaining core jewels in a dedicated arena. | Idle, move, ground crush, hit, death. | R2; final-name conversation |

R3 explicitly depicts a thrown-rock attack. The user subsequently confirmed: “Allow for the goblins to throw rocks and damage.” Damaging goblin rock throws are now authorised; this resolves the earlier melee-only conflict. Preserve the approved miner throw/flee and guard cleaver/shield roles. Additional guard throw artwork is not supplied, so do not invent a new guard animation.

### Five passive wildlife types

| Creature | Approved appearance | Idle | Escape |
| --- | --- | --- | --- |
| Forest Deer | R4 warm brown, white-spotted deer with antlers and pale chest. | Graze. | Run/bound away from an approaching player. |
| Rabbit | R4 small tan-brown rabbit, upright ears and pale tail. | Alert pose/ear movement. | Hop/bolt away. |
| Squirrel | R4 russet squirrel with large curled bushy tail. | Forage. | Scamper and climb a tree to escape. |
| Raven | Black/dark blue-black raven, replacing the current brown generic bird. | Peck at the ground. | Take off and fly away. |
| Fox | Dark charcoal-brown fox with muted warm face/legs and pale-tipped tail; preserve the darker approved design. | Watch/listen. | Run away, avoiding confrontation. |

These five do not attack players. Do not add infection, mutated species, hunting loot, wildlife combat XP or taming systems in this implementation. Older infection ideas are separate scope.

### Three skilling pets

| Pet | Matching skill/bonus | Approved movement | Approved interaction |
| --- | --- | --- | --- |
| Timber Glider | Woodcutting +3% XP while summoned. | Walk/scamper normally; spread its actual gliding membrane to catch up, then land. Keep the R5 brown/cream glider and large pink ears; no leaf-wing redesign. | Idle and climb/peek around a tree during woodcutting. |
| Geode Mole | Mining +3% XP while summoned. | Travel underground as a moving dirt mound/trail; trail fades. Surface only when the player stops. No visible walking mole or exposed crystal sticking out during travel. | Surface/idle, and dig beside an ore node while the player is stopped and mining. |
| River Otter | Fishing +3% XP while summoned. | Walk on land; swim in actual water. | Idle, dive and catch/display a fish during fishing. |

Collect all three and switch between them. Ownership alone or a resting/dismissed pet must not award the bonus. Interaction fish, ore chips and wood effects are cosmetic unless a separate gameplay reward is approved. Do not generate extra inventory items or XP from animation events.

One-active-pet exclusivity is not established by the retrieved evidence. The current game permits all three followers simultaneously. Do not silently enforce a new restriction or dismiss owned pets in a migration; resolve this before changing summon rules.

### Lore to preserve

- Fallen stars and their jewels are central to the goblins and guardians. Miners/scavengers collect fragments; guards defend them.
- Guardians were once gentle protectors with calm blue eyes. Goblin hunting for jewels inside their bodies drove them to rage, bitterness and territorial behaviour; current hostile guardians have red eyes.
- The Jewelheart Guardian is an ancient, larger survivor of that loss, defending its territory and remaining core jewels.
- R2 depicts rare Guardian's Necklace and Guardian's Ring rewards. Effects shown are examples, not approved numeric stats or drop probabilities. Do not invent values or replace existing generic jewellery.
- Keep the wolf's natural environmental camouflage and ambush theme; do not turn it into a magical or infected new design.

## 3. Code review against the current main branch

Reviewed files were matched against their Git blob hashes on the baseline commit. The implementation is a client-side Canvas game, not an entity engine or an authoritative multiplayer server. `src/worker.js` serves static assets and document cache headers; it does not simulate creatures.

| Area | Current implementation | Consequence for this work |
| --- | --- | --- |
| Entry point | `public/index.html` loads world/environment, player/wardrobe/equipment/sword modules, then `myrren-game.js?v=14`. | Add creature modules before the game; preserve script order and existing player/equipment files. Root `index.html` is historical. |
| Monster definitions/spawns | `MT` and `addMons`, game lines 190–242: slime, goblin, boar, wolf, brown bear, cave bear Lv40 and aether bear Lv70. | None of the rat/miner/guard/troll/guardian split is implemented. New approved roster needs distinct stable IDs; do not relabel a Lv40 bear as a Lv18 guardian. |
| Monster simulation | `update`, around 1642–1680: shared idle/chase/return/dead logic, direct movement, one melee range and attack cycle. | Add species behaviours and collision-safe movement without changing existing player hit timing. Rock throws, guard response and boss windup/recovery need explicit state handling. |
| Combat/rewards | `beginSwing`/`resolveSwing`, `doAction`, `killMon`, `combatKillXp`. Both attack paths exist. Death guard prevents repeat rewards; monsters respawn after 12 seconds. | Connect both paths to the same new definitions/damage/death flow. Keep XP on kills only; never trigger rewards twice from animations. |
| Monster rendering | `drawMon`, around 1912: procedural rectangle sprites, generic quadruped recolours and four phases; no approved creature atlas files in the repository tree. | Current visuals are placeholders relative to these references. Use approved art assets when available, not fresh procedural substitutes presented as approved designs. |
| Wildlife | `CR`, `critUpdate`, `drawCritter`; final bootstrap spawns 22 rabbits, 16 brown birds, 9 deer and 7 foxes. | Existing flee foundation is reusable; raven artwork and squirrel/tree-escape state are missing. Existing spawn counts are implementation values, not approved target balance. |
| Pets | `PETS`, `syncPets`, `petsUpdate`, `drawPet`, around 1399–1452 and 2147–2216. Fishing pet is Mossback Terrapin. Glider is leaf-styled; moving mole exposes a crystal. | Keep ownership/follow plumbing; replace outdated pet presentation with exact R5 designs and explicit movement states. Replace fishing presentation with River Otter. |
| Pet saves/UI | `save.pets[skill]`: 0 unowned, 1 following, 2 resting; Skills modal call/dismiss; `applySave`, `snap`, `adoptSave`. Multiple pets can follow. | Preserve those values and `fishing` ownership when transitioning terrapin presentation to otter. Do not reroll acquisition or make existing owners unlock it again. |
| Acquisition | `rollPet`: per successful matching gather, odds denominator `max(150, 500 - 3*skillLevel)`; new pet starts following. | This is existing code, not a recovered final balance approval. Preserve until deliberately changed; do not invent a new rare-drop denominator. |
| XP | `addXp` has no pet modifier. Gather awards, smithing and job claims all call it. `finalizeSave` floors XP to integers. | A blanket `*1.03` followed by save/load can lose fractional bonuses. Use a specified, persisted remainder strategy and resolve which XP sources count. |
| World/water | `myrren-world.js`: shared water/bridge/village geometry; one 1600×1600 outdoor map with shop interiors. | No actual cave zone or dedicated boss arena was found. Cave placement/layout and entry rules require a plan before spawns. Otter swimming must use real water queries, not splash everywhere on land. |
| Depth/culling | `drawOutdoor` sorts monsters, critters, pets and player by world foot Y; current cull margin assumes relatively small actors. | Preserve ground anchors; give large troll/boss and gliding/flying actors correct visual bounds and shadows so they do not pop or sort by airborne height. |
| Jobs/saves | Saved slay objectives refer to existing `MT` keys; loading filters out unknown keys. `mkObj` derives new jobs from all `MT` entries. | Deleting old IDs silently loses jobs; leaving all old entries in the selection pool creates wrong Crater jobs. Separate active regional job pool from legacy compatibility data. |
| Equipment scope mismatch | Current wear/break/repair logic exists, while older retrieved conversations favoured infection/cleansing rather than breakage. | Record as a separate historical discrepancy; do not alter durability, repair, infection or equipment stats during creature work. |
| Multiplayer | `window.claude` room/presence is optional; static deployment can run solo. Presence describes player gear/actions, not authoritative mobs or pets. | Preserve the existing mode. Do not promise shared boss kills, synchronised pet ownership or server-enforced loot without separately scoped server work. |

### Character scale and pixel style

The current primary path uses `hero-approved-v1.png` with 64-pixel atlas cells, and a 40/52 drawing scale when the wardrobe is ready. V31 32×40 remains a fallback; it is not the sole current drawing path. Existing approved sword and mixed-armour rendering must stay intact.

Preserve the approved player proportions, readable silhouette, outlines, palette and foot placement. Use R5's player-to-pet example as a relative-scale reference, not as permission to replace the live player sprite. Exact creature pixel dimensions, directional atlases and timings were not recovered. Establish a side-by-side fitting preview against the actual live hero before adopting runtime sizes; do not claim every creature must fit a 32×40 frame. Use nearest-neighbour drawing, consistent pixel density, explicit bounds and stable pivots.

## 4. Proposed implementation sequence

These are implementation proposals, not new design approvals. The initial review delivered this plan. The subsequent “Carry on” authorises the first implementation stage on the separate branch, without merge or deployment.

### Phase 1 — preserve references and settle missing contracts

1. Keep this approved-design record and reference identities with the branch. Produce an asset inventory mapping each approved species/state to existing usable source files.
2. Locate original transparent/lossless sprites and directional frames. If only these JPEG boards exist, establish an extraction/cleanup workflow for the exact approved drawings and show the result for approval. Do not redraw missing directions, interpolate new poses, generate replacement art or assume labelled examples constitute a complete sprite sheet.
3. Resolve the open items in section 6. Keep partial features disabled rather than shipping guessed designs, cave layouts, combat numbers or bonuses with undefined source rules.

Deliverable: complete asset manifest, source precedence and measurable animation/scale contracts.

### Phase 2 — additive creature and animation modules

Proposed new files: `public/crater-definitions.js`, `public/crater-animation.js`, `public/crater-behaviours.js`, `public/skilling-pets.js`, approved atlas images and metadata. Names are proposals; keep integration small rather than refactoring unrelated UI.

- Definitions separate ID, display name, region, level, visual asset, collision bounds, behaviour key and eventual approved balance values. Distinguish new roster IDs from legacy monster keys.
- Animation metadata defines states, frames, durations, looping, direction, foot/paw pivot, hitbox and visual bounds. Render time selects frames; simulation transitions determine attack impact, hit reaction and death. Death animation is held/finished before fade; it never awards rewards itself.
- Keep `drawMon`, `drawCritter` and `drawPet` as narrow adapters initially, so the rest of the game and its tests remain understandable. Existing fallback renderers may support development, but cannot substitute for approved art in the final result.
- Add a local fitting/animation preview for all eight monsters, all five wildlife and the three pets at the live hero's scale. Inspect every supplied state on light/dark backgrounds, including left/right handling, hit, death and silhouettes. Only mirror directions whose artwork and equipment permit it; missing front/back views remain explicit gaps.

Deliverable: isolated previews using approved artwork; no production spawn changes yet.

### Phase 3 — hostile behaviours and regional integration

- Define idle, patrol/move, acquire, chase, telegraph, attack, recover, hit, return and dead states as applicable. Reuse existing combat/saving boundaries; use elapsed simulation time for damage so animation frame rate cannot multiply hits.
- Implement rat melee, boar charge, wolf prowl/lunge, troll slam and guardian slam/crush according to the approved actions. Values such as windup, speed, radius and cooldown remain unset until established; the art's pose counts do not imply numeric timings.
- Miner: cautious spacing, rock-throw telegraph/projectile and retreat, with damaging rock throws explicitly authorised by the user. Guard: protect nearby miners, close to melee range, slash and fight to the last. Avoid invented packs, reinforcements or new magic effects.
- Wolf camouflage selects only the approved environmental palettes, retaining amber-eye readability. It is an appearance/behaviour feature; do not invent invisibility, new damage multipliers or extra drop tables.
- Add common guardian cave placement and one dedicated Jewelheart encounter only after cave/arena layout and access rules are established. Ensure enemies cannot cross solid objects, water or safe village boundaries improperly.
- Keep legacy bear/slime IDs recognised for old saves and jobs. Choose an explicit transition policy before removing their current spawns. Proposed choices are reviewed objective migration or temporary legacy-job completion support; do not silently discard objectives or create an inaccessible later region.
- Generate new Crater jobs only from the new active regional roster, with a separately approved policy for boss objectives. Keep loot/XP and kill-only semantics consistent across both existing player attack paths.

Deliverable: private/local integrated encounter tests and migration fixtures; no live merge.

### Phase 4 — passive wildlife

- Replace brown bird presentation with the approved raven; add squirrel as its own type rather than a pet reskin. Keep the deer, rabbit and dark fox faithful to R4.
- Add species states: graze/alert/forage/peck/watch, move, flee, raven takeoff/fly/land, and squirrel tree approach/climb/escape.
- Use existing trees for squirrel anchors without making decorative trees harvestable or changing collision. Validate escape routes so wildlife does not bounce forever against water or structures. Exact detection/escape distances are tunable proposals, not approved lore.
- Keep wildlife out of attack targeting, monster loot and combat XP. Preserve the world depth list and separately drawn aerial shadows.

Deliverable: all five clearly identifiable wildlife and their approved escape actions.

### Phase 5 — skilling pets and persistent +3% XP

- Replace the terrapin presentation with River Otter while retaining `save.pets.fishing` ownership/follow/rest state. Keep Timber Glider and Geode Mole ownership. Existing acquisition formula remains until an explicit balance change is approved.
- Give each pet explicit follow/idle/interaction states. Glider catch-up has takeoff, glide and landing; ground following is not perpetual gliding. Mole remains underground while the player moves, even if its following distance is briefly small; surface transitions are gated by the player's stop state. Otter walks on land and swims/dives only when water/location permits; it cannot teleport through solid obstacles.
- Trigger skill interactions from the existing successful/active skill action context, with cancellation on movement, node depletion, switching skill, dismissal, entering buildings and player death. Reuse `petsTeleport` boundaries safely; clear trails/transient actions after scene changes.
- Centralise the pet multiplier at the XP award boundary, applied exactly once only when the matching pet is summoned. Keep all unrelated skill/combat XP unchanged. Resolve gathering-only versus all matching-skill sources before choosing award-call coverage.
- Proposed exact accounting: integer hundredths remainder per matching skill, saved alongside existing progress. For an integer base award, add 3 hundredths per base XP, award accumulated whole XP and retain the remainder. Four 25-XP awards then total 103 XP; 100 base XP becomes 103. No floating-point drift or save/reload loss. This persistence extension needs round-trip coverage in every save path.
- Respect current award order: a pet found after an award should not retroactively boost that same award. Do not alter acquisition probability, add a bonus twice on job claims, or stack multiple pets onto one skill.
- Update Skills UI names, portraits, movement descriptions, summon/rest controls and visible bonus state. If one-active-only is chosen, migrate current multi-follow saves by an approved explicit rule, retaining ownership of all pets.

Deliverable: approved pet movement and source-defined XP bonus, with old saves preserved.

### Phase 6 — integration review and release gate

Review screenshots and animations of every species with the actual player, not only enlarged concept crops. Review gameplay and UI on desktop and mobile, including frame pacing, zoom, busy scenes, asset failures and slow loading. Compare old-save round trips before/after.

Keep all work on separate branches/draft review changes. Present the implementation and validation evidence. Merge/deploy only after the user explicitly approves those actions; this plan does not grant that approval.

## 5. Validation and preservation

### Baseline checks completed for this review

All passed on code matching the baseline: JavaScript syntax for `myrren-game.js`; `inventory-capacity.cjs`; `save-inventory.test.cjs`; `bank-notes.test.cjs`; `combat-kill-xp.test.cjs`; `village-layout.test.cjs`. These cover the 36-slot limit, old/overfull saves, bank/notes, kill-only combat XP, duplicate death rewards, existing smithy actions, bridge/water geometry and saved positions. These are synthetic runtime checks, not a new browser gameplay verification.

The initial planning commit edited no runtime files. Later stage-one runtime work and its new tests are listed separately in CRATER_STAGE1_PROGRESS.md.

### Checks required during implementation

- Re-run those baseline checks plus relevant movement, armour, wardrobe, sword grip/visibility and character tests after integration changes. Preserve accepted PR #23 animation behaviour.
- Creature definitions: exactly eight new active Crater hostiles at the approved levels; five passive species; three correct pets. No obsolete design name presented as final.
- State-machine scenarios: miner retreat/throw, guard protection, wolf camouflage/lunge, boar charge, troll/guardian attack recovery, boss reset, hit/death/respawn and no double damage or rewards. Use approved values/fixtures rather than invented production balance.
- Wildlife scenarios: no attacks, correct species escape, squirrel climbing and raven flight; obstruction/water handling and stable offscreen return.
- Pet scenarios: glider walk versus catch-up glide; mole never surfaces while the player moves, trail fades after travel; otter land/water and cancelled dives; scene transitions and no cosmetic item grants.
- XP scenarios: summoned/matching only; owned/resting/unowned no bonus; no combat/other-skill bonus; exact repeated small awards; saved remainder; source-specific jobs/smelting/forging once coverage is agreed; pet discovery ordering; reload and export/import.
- Save scenarios: preserve ownership, XP, coins, bank/notes/orders, inventory, equipment, dyes, jobs/tokens/perks, current locations and existing fishing-pet status. Unknown/corrupt new fields normalise safely. Do not repurpose `wear` or break existing save keys.
- Asset QA: native pixel clarity, no JPEG fringe in runtime cutouts, no frame clipping, consistent relative size/ground anchors, facing, transparent backgrounds, stable shadows and large-boss culling/depth. Check rendered hands/feet visually; an opaque-pixel assertion alone is insufficient, as the sword work showed.
- Performance/accessibility: bounded effects/trails and asset caches, no resource growth across long sessions, viewport culling, mobile controls readable/unblocked and reduced-motion handling where effects are optional.

## 6. Missing or unresolved information — do not guess

| Item | Available evidence | Needed before the dependent implementation |
| --- | --- | --- |
| Original game-ready creature/pet assets | All six attached boards are available. No creature/pet atlas package or source frames were found in the repository. | Transparent/lossless source sprites and directional frames, or approval of faithful extraction/cleanup from these exact references. Missing views/poses cannot be redesigned silently. |
| Exact animation contracts and scale | State examples and player/pet comparison exist. Existing live hero/proportions are available. | Per-state frame count/timing, pivots and relative creature sizes not recovered; fit/compare exact sources before locking metadata. |
| Hostile balance and spawn geography | Names, eight levels and visual/behaviour themes are established. | HP, defence, hits, speeds, aggro/leash/ranges, projectile/windup timing, densities, respawn rules and actual cave/arena layout/entry rules. Existing generic values are not final approvals. |
| Damaging goblin rocks — resolved | User explicitly authorised goblins throwing rocks and causing damage after this plan. | Implement the approved miner throw/flee role; preserve guard design and do not invent missing animation art. |
| Pet summon limit — existing behaviour preserved | Three collectible pets and switching are approved; current saves can summon multiple. | Stage three preserves those followers and all ownership. No single-active restriction is imposed without a new instruction. |
| XP award sources — preview interpretation implemented | Matching +3% while summoned is approved. Gathering, smithing and jobs share skill XP IDs. | Stage three applies it once to all matching-skill awards in the isolated preview, retaining exact fractions. Review before normal activation; item yield, melee and cooking are unchanged. |
| Acquisition balance | Earlier rare-from-skilling statement; current formula exists. | No exact final approved odds retrieved. Preserve current formula pending a deliberate balancing decision. |
| Guardian rare jewellery | Necklace/ring visual designs, rare status and example effect categories exist. | Exact item IDs, stats, effect semantics and probabilities; current code has no stamina stat. No invented stamina subsystem or numerical bonuses. |
| Legacy monsters and jobs | Current slime/bear/cave-bear/aether-bear IDs and saved jobs exist. | Transition policy before removing these spawns, especially Lv40/70 actors from a Lv1–30 starter region. No lost objectives or inaccessible targets. |

The five wildlife names, final three pet designs and +3% matching bonus are not missing: they are directly supplied in the current request/reference sheets. The earlier four-wildlife excerpt does not override them.

## 7. Next review point

Review this plan and the unresolved contracts before starting gameplay implementation. The first implementation deliverable should be a faithful creature/pet fitting and animation preview on a separate branch, using the approved sources and current player. No merge or deployment has been made for this request.

## 8. Jewelheart group encounter

Jewelheart is a group-first level 30 fight. Players with good level 30 gear can clear it solo, with grouping offering faster repeat clears. The Guardian's Ring and Necklace are intended as useful level 30 rewards that later tiers can replace. Final effects and odds depend on real group clear times, including entry, reset and looting.

Run `node scripts/measure-jewelheart.cjs --party 40` from the repository root. At the draft's 450 HP, level 30 medians were 63.4s solo, 30.4s duo and 18.6s trio in steel. In Black Iron they were 45.5s, 21.7s and 13.4s. This estimates ideal coordination. The lead fighter uses the game's movement and dodge logic with assisted aiming. Flankers use the actual swing damage against the same HP pool, but have fixed attack positions and the boss targets only the lead fighter. The benchmark excludes network delay, arena travel and reward collection.

The current room connection exchanges player presence. Boss HP, target selection and defeat are local to each game. Implement the shared encounter in an authoritative runtime once a service and arena are selected.

- The runtime owns one encounter ID and one HP pool per arena. It validates attack cooldown, weapon eligibility, range and facing against server-side state, then broadcasts the resulting HP, target and attack phase. Clients display the shared windup and impact, while the runtime resolves hits and player damage.
- Define entry, leash and reset when the arena layout is established. A reset starts a fresh encounter ID and clears prior contributions. Reconnecting during an active fight reloads its current snapshot rather than creating another boss.
- Attribute actual applied damage to verified player identities. Resolve eligibility at defeat from encounter participation and presence. Commit each eligible player's reward once, keyed by encounter and player, so simultaneous final hits and reconnects cannot duplicate credit. A full pack needs a way to collect a pending reward later.
- Before enabling rewards, verify solo and multi-client clears, overlapping swings, late joins, party wipes, reconnects, duplicate requests and full packs. Keep rare-item odds provisional until actual party pacing and reward collection are measured.

`src/jewelheart-encounter.mjs` implements the shared HP, contribution and reset transitions as an isolated module. The service adapter must issue unique encounter IDs, authenticate players, derive combat outcomes, serialize mutations per arena and persist state before publishing it. A strike sequence is scoped to one player and encounter. The adapter must process strikes for that player in sequence order. The contribution log records damage and replay state, while eligibility and reward issuance belong to the service. The static Worker and presence room do not yet run this module.
