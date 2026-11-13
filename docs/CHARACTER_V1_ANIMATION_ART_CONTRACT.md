# Tales of Myrren — Compact Adventurer Animation Art Contract
**14 November 2026 · Character art only · Draft / non-production**

## Authority / approval
1. **Visual master:** the user-approved front-facing olive-cape adventurer with the corrected feet, from the 14 November conversation. Preserve brown asymmetric fringe, square eyes, tiny cheek scar, short olive shoulder cape, gold clasp, beige shirt, dark belt, short legs and boots. It is Myrren artwork, not copied Curse of Aros frames.
2. The generated wide sprite sheets and prior V1/V2 96-frame atlases were **rejected by the user** for inconsistent scale, unsatisfactory poses and movement. Do not show them again or treat pixel-integrity tests as art approval.
3. `candidates/approved_reference_front_32x40.png` is an authored **front-only candidate**, not the final user-signed-off animation master; inspect it against the actual corrected-feet approved image. A generated preview is not proof that the game's pixels match.
4. Never merge this branch, change the production renderer, or upload a replacement atlas as “final” before visual acceptance at actual game scale.

## Pixel grid and anatomy
- **Per pose:** 32×40 native transparent RGBA pixels; exact 1× nearest-neighbour source. Atlas after art review: 24×4 frames = 768×160 pixels, 96 slots. Four row order: front, right, back, left. Actions in consecutive blocks of four: idle, walk, punch, sword, hurt, death.
- **Foot pivot** local (16,39); standing feet land consistently across directions, including opposite strides. Do not slide the whole body up/down to mimic walking. Action-specific jumps may change the feet only when intentional and independently annotated. Death is exempt from upright silhouette but not from frame/canvas size.
- **Base silhouette locked:** same head pixel width/height and hair volume in all upright frames; shoulders/torso fixed; no elongated legs, visible isolated elbow circles, giant hands, oversized belts or chunky exaggerated outline. A small arm may have only a few pixels of motion.
- **Face:** distinct square eyes in the front view; eyebrow/hair placement must not swap between idle and run. Tiny scar on its original cheek; consistent hair color and bang arrangement. Sides show an actual profile, back shows hair without mirrored front-face features.
- **Cape:** attached to throat clasp, modest asymmetry, follows shoulder rotation; never grows/shrinks across frames. Restrained 1-pixel trailing edge motion permitted.
- **Feet:** each stride must have two believable compact boots; no doubled soles, hovering feet, fused feet, one-pixel stray fragments or huge walking legs.
- Palette changes require deliberate justification. No semi-transparent fringe, no blur, no resampled edge pixels. Render with canvas `imageSmoothingEnabled=false`.

## Animation timing / required poses
| State | Four authoring frames | Suggested tick rate | QA |
|---|---|---|---|
| Idle | neutral, tiny breath, neutral, tiny cloth settle | 170–260 ms/frame | Feet frozen, neck/hair stable |
| Walk | left contact, passing, right contact, passing | 105–145 ms/frame | Alternating boots, clear opposite arm swing, world foot anchor fixed |
| Punch | ready, extend, impact, recover | 75–110 ms/frame | Dominant fist visibly extends; no disconnected joint |
| Sword body | wind-up, strike, follow-through, recover | 75–125 ms/frame | Strong grip arc WITHOUT painted blade or white slash in body |
| Hurt | neutral, recoil, recover, neutral | 75–120 ms/frame | Face/hair retained, no body scaling |
| Death | stagger, buckle, fall, rest | 120–220 ms/frame | Believable supported fall; does not change collision position |

Rates are **art-preview suggestions** only; live combat remains 900 ms as previously implemented. Sprite timing must not override gameplay timing.

## Direction-by-direction pose specification
- **Front:** face readable; short limbs and clear overlapping hands. Animate only necessary pixels, not whole-body stretch.
- **Back:** hair mass intact; no face/eyes; cape and clasp hidden/occluded appropriately, not simply mirrored front.
- **Right:** readable profile: front nose/head, far arm partly hidden, shoulders compact. Right-facing sword grip on dominant hand.
- **Left:** manually verify profile asymmetry, cheek scar visibility/occlusion, glove/weapon sides; no blind flipping of equipped shield.
- **Upright height/width:** within the same reference silhouette envelope across idle and walk; modest 1–2 pixel extension on punch/sword allowed, but never change head size.

## Separately wearable art / system safety
- Weapons and shields are NOT drawn in the base atlas. Per-frame dominant/offhand sockets must be explicit and different, plus per-direction draw order. Closed-hand hilt grip, correct depth for back/side poses.
- Maintain six worn slots, seven existing material IDs and save compatibility; **do not fit legacy 21×27 armour rectangles** onto the 32×40 candidate.
- No changes to hitboxes, combat speed, world coordinates, XP, saves, multiplayer schema or NPCs for an art-only update.

## Strict production QA gates
1. Compare every new static first frame at **actual native 1×** and 4× nearest-neighbour against the approved corrected-foot front. Reject face/hair/boot/cape drift.
2. Inspect **4 directions × 6 actions × 4 frames** individually. Every frame must have exact bounds 32×40 and transparent outside silhouette; check alpha values only 0/255 and no off-island pixels.
3. Inspect animated loops **at target displayed world scale**, not only zoomed sprite sheets. The left/right walk must alternate without sliding, and punch/sword must be visibly different. Freeze final death frame.
4. Real Crater Camp visual checks at 1× and 2× around trees, ore, furnace, anvil and chest; verify mobile and desktop, all four orientations.
5. Add an opt-in preview renderer; while equipment is not separately authored, **equipped players continue with complete Kez V2**. Do not ship a hybrid.
6. Only after visual inspection: accept atlas, regenerate manifest SHA/socket map, run unit/browser/gameplay regressions, submit draft PR. **User approval before merge**.

## Current status
- Locked design direction: **approved concept + fixed feet**, simple compact CoA-like *feel*, original Myrren-specific silhouette.
- Rejected: old 96-frame candidate animation sheets, generated preview sheets.
- Art in progress: native 32×40 master matching corrected-feet image, actual directional frames and pose quality. **Not finished; no new animation sheet signed off.**
- Production integration: **not performed**. Current live Kez V2 character remains the default.
