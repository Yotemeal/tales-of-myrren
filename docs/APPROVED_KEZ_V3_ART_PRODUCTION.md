# Tales of Myrren — Approved Kez V3 art production contract

**Status: visual design approved; drawable animation and wearable equipment NOT yet completed.**
This branch locks the art direction approved on 13 November 2026.
The exact concept illustration has SHA-256 `17425a331ab29b84e0218fd30356f76505527965fd3b18e908414dd82dada918` and was provided in chat as `a_clean_professional_pixel_art_game_asset_sheet_i.png`.
Do **not** substitute another generated character or another armour shape.

## Non-negotiable art direction

Kez remains the **compact dark-brown adventurer** from the approved illustration: shaggy/asymmetric brown hair, simple face, gold belt, brown boots and gloves. Visual sizing should be comparable to *Curse of Aros* in gameplay, but this is an original *Tales of Myrren* design. Character identity is not the old buggy 21×27 sprite. The game-world draw size and higher-resolution source art grid are different decisions: no final number is locked yet.

The approved armour ascends in **substantially more coverage and protection**, not mere recolours:

| Material ID | Tier | Visual construction |
| --- | --- | --- |
| 2 | Bronze | Open copper helmet and visible face/hair; basic forged breastplate and modest guards |
| 3 | Iron | Reinforced cap/nasal guard, mail and more shoulder/body protection |
| 4 | Steel | Clear knightly plate, further helmet enclosure and fuller greaves |
| 5 | Black Iron | Heavy dark near-enclosed silhouette |
| 7 | Obsidianite | Angular violet full elite armour |
| 6 | Myrrenite | Teal-and-gold prestige armour with dark T visor |
| 8 | Starsteel | White, gold and blue fully enclosed masterwork armour |

A previously approved equipment reference was used to extract sword/shield icons, checksum `6009b28eee61d6e29b89c1bf8607e2c14b50793ac355edc4848a1856e29ae356`; those are **reference-only** until their in-game grips, facing and visual scale are approved.

## Artwork that actually exists (local handoff package)

From the approved illustrations: eight transparent source-resolution **front-facing complete figures**, seven sword and seven shield **reference** images, four single-frame Kez idle directions and only the **right walk / right attack / front death** example sequences. A front-facing complete figure is not a separate helmet, chest, glove, boot or shield layer. The asset pack records these limitations explicitly.

Do not shrink the source sprite to 21×27 or approximate it with procedural rectangle overlays. At 32×40 the source detailing was visibly lost. Prefer to test 40×56, 48×64 and the source masters **as authoring canvases**, then compare integer-aligned on-screen renders against real Crater Camp before selecting native/game display sizes.

## Production completion gates

1. **Base sprite family:** one consistent native grid for four directions, idle, walk, bare punch, sword attack, hurt and collapse. Common planted-foot anchor; stable face/hair; no white stray pixels or doubled feet; no baked slash when a sword sprite will be composited.
2. **Wearable equipment:** independent authored source layers for helmet, chest, leggings, boots, gloves and shield for all seven materials, each fitted to *every* base action/direction. Individual layer artwork must be real visual assets, not primitive colour patches extracted at arbitrary rectangles. Mixed-material loadouts must render correctly.
3. **Swords and shields:** each actual weapon held by the dominant-hand grip; shields in offhand. Right-facing shield minimal silhouette, rear shield never clips across body, correct body-under/over layering. No sword/shield on same hand.
4. **Engine:** character portrait, dyes, save/item material IDs, remote player poses, drops and combat timings unchanged. Missing artwork fails visibly or falls back only to the already-live old renderer under an explicit feature gate.
5. **QA:** screenshot idle, walk, fist, sword, hit and death in four directions on desktop/mobile at true gameplay scale, with all seven complete sets and mixed pieces. Confirm Clipping, body/feet anchor, sword position and performance. Existing combat, gathering, forging, terrain, camp, saving and multiplayer tests remain green.
6. **Release:** new renderer stays in an unmerged *draft* preview branch until artwork QA and user approval. Passing tests alone does **not** approve visual fidelity.

**No current file in this branch is a replacement live sprite.** Machine-readable terms and release gates are in `docs/approved-kez-v3-production-contract.json`.
