# The Crater — stage three: pet movement and exact matching XP

Branch: `plan/crater-creatures-and-skilling-pets`. No merge or deployment.

## Implemented and connected to the isolated game preview

The existing `?craterPreview=1` development switch now enables the approved pet controllers and matching XP bonuses. Default mode retains its existing pet presentation and XP behaviour pending approval to activate the new system. Both modes can round-trip the added remainder field safely.

- `public/skilling-pets.js` separates simulation and XP accounting from artwork. The existing 0=unowned, 1=following, 2=resting pet ownership values are retained. All three current followers can remain summoned; no new one-pet restriction is imposed.
- Timber Glider walks nearby, takes off/glides when it falls behind, lands, and climbs during a valid woodcutting action. Catch-up gliding is faster than the 90px/s player instead of being purely a hovering visual. Ground speed stays at the existing 64px/s; 128px/s catch-up speed and state timing are prototype tuning, not final balance approvals.
- Geode Mole travels underground with a bounded fading dirt trail. It remains underground whenever the player is moving, even if already at its follow anchor. Once the player stops and it arrives, it surfaces before idling or digging during mining. No moving mole body or exposed travel crystal is drawn.
- River Otter walks on land, swims in actual water, dives during a valid nearby fishing action, and shows the supplied catch frames after a real successful fishing event. The animation creates no extra fish, inventory items or XP. Movement, switching skill, dismissal, death, save restore and scene changes cancel/reset transient interactions appropriately.
- Follow/interaction movement respects world bounds, water restrictions for land pets, buildings and fences. Follow anchors are checked before teleport/reset. This is local movement/slide avoidance, not a completed global navigation system.
- `public/crater-pet-reference.js` draws the existing approved R5 crops and icons. Preview poses use supplied frames/explicit aliases for takeoff, landing, surfaced idle, diving and catching. They do not invent front/back views or redesign the animals. Artwork errors degrade to a neutral ground shadow; a missing pet module does not prevent normal saves from loading.
- The preview Skills UI identifies River Otter, retains old `save.pets.fishing` ownership, and shows +3% matching XP only for following pets. Legacy owners do not have to obtain the fishing pet again. Acquisition odds remain unchanged. A clearly labelled “Preview all three pets” button in this isolated preview lets reviewers test them without grinding rare drops; it does not exist in normal mode.

## Exact +3% XP contract

The approved rule is interpreted literally as matching-skill XP while the matching pet is summoned. In the preview this covers all existing `addXp` awards for woodcutting, mining and fishing, including matching job XP and mining XP from smelting/forging. It never boosts melee, cooking, coins, drops or item yield. No source gets an extra multiplier elsewhere.

The save adds `petXpRemainders` for the three skills, with integer hundredths in 0–99. An award adds its 3% to the stored fraction, pays complete XP and retains the rest. Four 25-XP awards therefore pay exactly 103 XP; saving/reloading between those awards does not lose the fraction. Resting/dismissing a pet pauses the bonus without erasing fractions already earned. BigInt handles large valid base awards exactly; persisted values remain ordinary JSON integers. Invalid imported remainder fields normalise to zero.

The bonus is evaluated before `rollPet`, preserving existing discovery order: a newly discovered pet cannot retroactively boost the gather that found it. Failed or inventory-blocked gathers have no XP award, so cannot accrue bonus fractions. Existing job claim removal prevents duplicate claims/bonuses.

## Validation

- `tests/skilling-pets.test.cjs`: exact matching/summoned bonus, fractional carry, resting/unowned states, other skills, malformed values, large counts; glider ground/catch-up/landing/climbing; mole hidden travel/surface/dig and bounded fading trails; otter land/water/dive/catch, movement and skill cancellation; obstruction and reset behaviour.
- `tests/skilling-pets-integration.test.cjs`: actual game awards, successful/failed gathers, pet discovery ordering, smelting, forging and one-time job claims; save/export/import remainder round trips; existing fishing ownership and multiple followers; Skills UI bonus display; missing-module fallback; death/interior resets; retained bank, notes, coins and tokens. Default mode's XP remains unchanged.
- `tests/crater-pet-reference.test.cjs`: 32 state/facing renders from the approved R5 atlas, distinct underground/surfaced and land/water/glide states, icons and load notification.
- Existing inventory, save, bank, combat kill-XP, world layout, movement, rock projectile, combat-preview, supplied animation and fitting-preview checks pass. Syntax checks pass.
- `scripts/render-crater-pet-controller-study.cjs` renders the actual new controller and reference adapter to `docs/crater-pet-controller-study.gif`. The player is shown separately for clarity so retained board backgrounds/props do not obscure it. This is not a full browser/gameplay recording.

## Still unfinished

R5 crops still retain board backgrounds, grass and scene props. They are reference graphics for this isolated preview, not final transparent world sprites; props can overlap nearby actors. Production background cleanup, final pivots, approved movement/frame timing and missing directional views remain necessary before activating these visuals in normal play. The stage-two source crops have not been modified.

The new hostile roster/AI and passive wildlife integrations, clean runtime assets, cave/arena layout, numerical encounter balance and rare jewellery remain separate work. No live changes have been made. Merge and deployment still require explicit user approval.
