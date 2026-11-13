# Tales of Myrren — NEW compact adventurer V1: canonical continuation handoff

**Date:** 14 November 2026 (Australia/Brisbane)  
**Owner:** Tales of Myrren / Yotemeal  
**Status:** User approved the **olive-cloak character concept** in the 14 Nov ChatGPT conversation ("Perfect"). The 32×40 native raster interpretation is a **new implementation-ready base-art candidate**, not yet independently signed off in the game. **Not integrated, not deployed, not merged into `main`.**  
**Scope:** *Base character only.* All gear, weapon sprites, mixed equipment and multiplayer integration are next-stage work.  
**Start here for any future ChatGPT/Codex/Work session.** Do not infer that old Kez V3 concepts or in-world 21×27 equipment are the same character.

## 1. What the user actually decided and why

- Game: **Tales of Myrren**, repository `Yotemeal/tales-of-myrren`.
- The user supplied a simple *Curse of Aros* character image as an **anatomical/scale example**, NOT as an asset to copy. Their specific constraints: compact and readable, **no massive arms, outlined elbow joints, long legs, or oversized accessories**. The character should blend into the world and read clearly at a small game pixel scale.
- First generated attempt copied the reference too closely. The user rejected it over legal/originality concerns. **Never bring that attempt back.**
- The user **approved a different new design**: warm-skinned small adventurer, asymmetric tousled medium-brown hair, big simple expressive square eyes, tiny cheek scar, olive-green short shoulder cape with small golden throat clasp, beige tunic, dark belt, short brown pants/boots. This is an independently authored Myrren identity, **not** an Aros clone. Keep the head-to-body ratio compact and friendly. Retain a one-pixel-dark outline and disciplined earthy shading; avoid excessive detail and visual noise.
- The **accepted concept** was a large rendered image, not itself a pixel-perfect source sprite. Never resample the whole large concept and call the blurry result an authored native atlas. The base raster here was hand-defined from primitives at exactly **32×40 actual pixels per frame**.
- This newer base-design approval **supersedes the earlier Kez V3 unarmoured brown/gold concept for NEW character art only**. It does **not** erase old references, approve replacement armour, change forging tier progression, or authorize merging draft PRs. If any older approval conflicts, surface it and apply the latest specific character decision.

## 2. Files and where they belong

Production-candidate files in this isolated handoff branch:

| File | Purpose |
|---|---|
| `art/myrren-adventurer-v1/myrren_adventurer_v1_32x40.png` | **Authoritative native art atlas** — 768×160 transparent indexed PNG; lossless binary alpha on decode. NOT loaded by live game. |
| `art/myrren-adventurer-v1/myrren_adventurer_v1_front.png` | Standalone transparent front-idle reference. |
| `art/myrren-adventurer-v1/myrren_adventurer_v1_manifest.json` | Palette, **96 individual frame rectangles**, socket positions, sheet layout, SHA-256; generated from code. |
| `art/myrren-adventurer-v1/build_character.py` | Editable deterministic *native-pixel authoring source* — regenerate all frames, manifest, review sheet from Pillow. |
| `art/myrren-adventurer-v1/test_character.py` | Pixel exactness/alpha/cell bounds/anchors/sockets/hash checks (run after any modification). |
| `art/myrren-adventurer-v1/myrren_adventurer_v1_review.png` | 4-directions × 6-actions first-frame contact sheet, nearest-neighbour enlarged. NOT game source. |
| `docs/CHARACTER_V1_IMPLEMENTATION_HANDOFF.md` | This decision log and implementation contract. |

### Rebuild and local QA

```
python -m pip install 'Pillow>=10,<13'
python art/myrren-adventurer-v1/build_character.py --out art/myrren-adventurer-v1
python art/myrren-adventurer-v1/test_character.py
```

If art changes, regenerate both image and manifest together: the SHA and frame metadata must match the PNG. Use `imageSmoothingEnabled = false` on game canvas. Transparent pixels must remain transparent; alpha only **0 or 255**, no fringe/white pixels.

## 3. Exact pixel grid and atlas contract

- Frame canvas **32 wide × 40 high**, integer nearest-neighbour pixels.
- Maximum visible silhouette approximately **21×32 px** for idle; top at **y=7**, soles at **y=38**. The transparent bottom margin is intentional.
- Shared foot/pivot **(16,39)** in local cell coordinates. Draw at viewport/world foot position `(x,y)` with destination upper left `(round(x)-16, round(y)-39)` and *no scaling* for the initial 1× trial. Rendered soles sit at `round(y)-1`. Do not move collision boxes/hitboxes in response to sprite changes.
- Full sheet **768×160** = **24 columns × 4 rows**. All cells **32×40**.
- **Rows** in order `front, right, back, left` (0..3).
- **Columns** in six four-frame blocks: `idle` = 0–3, `walk` = 4–7, `punch` = 8–11, `sword` = 12–15, `hurt` = 16–19, `death` = 20–23.
- Rect for action index `a`, frame `f`, direction index `d`: `sx = (a*4+f)*32`, `sy = d*40`, `sw=32`, `sh=40`.
- 96 total non-empty, hard-alpha frames. `hurt` is currently a 2-pose alternation over four slots, and `idle` is a restrained micro-breath; do **not** claim 96 completely independent hand-painted poses.
- Punch and sword have distinct arm motion. **No blade, shield or white sword arc is baked into the body image.** Equip animations remain independent overlays. `death` ends with a ground-supported sideways collapse; do not move collision position on death.
- Unarmed left/right are authored consistent via direction flip, **but equipment must not be flipped blindly**. Socket orientation and shield depth differ by direction.
- Only the base clothing, skin, hair and face are here. The small clasp is a clothing accent, NOT an equipped necklace or combat item.

## 4. Equipment and hand-socket contract

Every record in `myrren_adventurer_v1_manifest.json` contains local `sockets.dominant`, `sockets.offhand` and `weaponVisible` fields. Convert to world-space with the same atlas origin offset. Sword/pickaxe/other tool goes in **dominant** hand, shield goes in **offhand**, NEVER the same hand.

For unanimated forward-facing idle, sockets are currently dominant `(27,30)` and offhand `(7,30)`. Back is dominant `(4,30)`, offhand `(24,30)`. Side-facing variants also use mirrored screen positions. These are **alignment starting points**, not approval of actual sword/armour images; use the manifest's per-frame values rather than locking the idle coordinates. For final collapse (`death` frames 2/3), both sockets are null and `weaponVisible=false`.

Suggested separation:
1. Optional under-layer shield (especially thin for side-on; never paste a giant shield over the character when facing right/back).
2. Boots, legs, torso, gloves, helmet layer, driven by same action/direction/frame/pivot.
3. Independent dominant hand weapon with correct hilt origin; make wrist pixel overlap the grip, not its pommel.
4. Face/hair mask as needed only for face-visible helmets; no forceful helmet replacement of hair in unarmoured state.
5. VFX separately only once; **do not** draw a second slash if any later imported gear sheet contains an embedded white arc.

**Existing seven stable metal IDs stay untouched:** Bronze **2**, Iron **3**, Steel **4**, Black Iron **5**, Obsidianite **7**, Myrrenite **6**, Starsteel **8**. Six worn slots = helmet/head, body, legs, boots, shield and gloves; keep inventory, dye, armour balance and save compatibility. Helmets should show the face when their design is open; Myrrenite's prior teal/gold T-visor and later tier approval remain distinct gear design references pending fit to the new base. No separate new armour, sword or shield overlays are supplied in this V1 pack; **do not invent coloured rectangle overlays and mark them complete**.

## 5. Real game integration: requested next coding job

**DO NOT replace `main`'s sprite until browser QA passes.** Treat this as the concrete job brief:

1. Base on current `main`, keeping existing branch PRs intact; read `docs/CHARACTER_RENDERER.md` first and compare #90 (scale proof), #91 (old Kez V3/tier references), #92 (Bronze opt-in). Those are prior draft experiments, not permission to merge their art into the new avatar.
2. Copy the **approved native atlas** into a runtime asset path such as `public/assets/characters/myrren-adventurer-v1/`. Implement a small `public/myrren-adventurer-v1.js` atlas loader and renderer using the manifest mapping, a fully loaded image check, and a clean `draw` interface. Preserve the default `public/kez-v2-atlas.js` and `public/kez-v2-equipment.js` unchanged for production.
3. Add an explicit **opt-in** preview flag `?myrren-char-v1`. Barehanded/unarmoured player and peers may use the new base, but equipment still using old 21×27 overlays **must use the old complete renderer** until fully authored new layers are ready. Do not attach legacy 21×27 helmets to this 32×40 body and call them integrated.
4. Modify `public/myrren-game.js` only at the current `drawPerson` dispatch. Map controls `dv==='u'` → back; `dv==='d'` or normal downward → front; `dv==='s'` plus `f` → right/left, matching existing direction conventions. Preserve action input and combat timing (`900ms` attack interval, existing swing windows), hurt/death state tracking and multiplayer payload shape; only alter visual pose selection.
5. Draw first at 1× and then compare 2× integer scale on **actual Crater Camp world** with nearby chest, furnace, anvil, trees, ore and other players. Actual *Curse of Aros* character is a scale/mood reference, not something to copy. Reassess if 32 visible px is too tall/short. Adjust camera display scale, not the native source frames, once user reviews. No browser captures have been produced by this handoff yet.
6. Build native, independently wearable six-slot overlays **only after** aligning against the approved new base and revisiting existing seven-tier references. Mixed armour sets, barehand punch, sword-only and sword+shield combinations must align per frame. Preserve approved gear appearances; request visual review if conflicts cannot be resolved.
7. Verify a full matrix: 4 directions × idle/walk/punch/sword/hurt/death, foot anchor, outline pixel integrity, face and hair continuity, no doubled feet or clipping, left/right grip, no shields in dominant hand, rear layering, save/load, equipment portrait, multiplayer peers, desktop and mobile 1×/2× screenshots, touch input, mining/forging/fishing/woodcutting and combat. Test failure / missing image fallback and view the real screenshots before merge.
8. Keep new runtime behind its flag and open a draft integration PR; **request user visual approval** for full in-game fit before making it the default. Do not change stats, item IDs, saves or networking schema for this visual feature.

### Example source rectangle API (not shipped runtime code)

```js
const directions = ['front','right','back','left'];
const actions = ['idle','walk','punch','sword','hurt','death'];
const sx = (actions.indexOf(action)*4 + frame)*32;
const sy = directions.indexOf(direction)*40;
ctx.imageSmoothingEnabled = false;
ctx.drawImage(img, sx, sy, 32, 40,
  Math.round(feetX) - 16, Math.round(feetY) - 39, 32, 40);
```

## 6. Compatibility, provenance and non-goals

- **Current live code:** `public/index.html` is the actual Cloudflare entry; root `index.html` is a retirement notice. `public/myrren-game.js` dispatches to existing 21×27 `MyrrenKezV2Atlas`. Repo `main` was observed at commit `4697e68fe4fba4efa61c7af1af7613510d7f9fe0` when this handoff began, 14 November 2026. Re-check head when starting another job.
- **Related open drafts at handoff:** #90 32×40 old-Kez scale proof; #91 approved *previous* Kez V3 art/tier studies; #92 Bronze source atlas integration. These are separate and possibly visually incompatible. They must not silently override this new user-approved base design.
- Older release work: *Crater Camp* mainline was merged before these character previews; keep the approved revised V2 anvil, camp/terrain, UI/XP/coins, skilling, save/combat/multiplayer functionality. Existing docs in `docs/` hold exact historical state; check current GitHub state rather than relying only on this snapshot.
- **New pixel art is original by construction:** no game-pixel extraction, tracing or automated source image copy from another game's screenshots. Art-style similarity alone is not a legal guarantee; do not make a claim of guaranteed non-infringement.
- **No new** skills, gear stats, economy, combat balance, NPCs, save migrations, microtransactions, world/collision changes or shipped rendering changes were part of this task.
- The historical 21×27 renderer must remain intact until visual QA. The olive-cloak artwork has a short scarf/cape that some future full helmets may visually hide, so equip slot ownership must be decided explicitly, not concealed with broad rectangles.

## 7. Completed / pending / risk log

**Completed in this source-art handoff:** one newly authored compact original 32×40 sprite family in four directions; 4-frame slots for idle/walk/punch/sword/hurt/death (96 populated cells); native transparent PNG; palette and detailed pixel/frame/hand anchor manifest; deterministic generation source; review image; local pixel integrity tests. **Do not equate local pixel checks with a playable browser integration.**

**Still pending:** visual approval of exact native pixel result at real world scale; new 32×40 engine feature-gate; browser/mobile render proof; independent 7-material armour slot layers in all directions/actions; swords and shields fitted to sockets; multi-player and save QA; release approval.

**Known art limitations to inspect:** walking limb motion is intentionally only 1 pixel; idle has limited animation; hurt alternates 2 poses; front and side sword arm do not yet include any weapon; the death sequence includes rotated/squashed pixel art and must be assessed for silhouette quality; first-frame review sheet alone cannot demonstrate motion. If changing any of these, keep the face/hair/cloak identity unchanged unless user explicitly approves redesign.

## 8. Future-session continuation rule

When told **"carry on"**: (a) read this file and the manifest; (b) inspect real current `main` and open character/armour PRs; (c) continue with the **new olive-cloak 32×40 character**, not the previously approved brown-only Kez or screenshot-reference Aros character; (d) work in a new draft PR/branch, preserve live main; (e) report exactly what tests passed and what was actually implemented; (f) never claim armour layers or runtime integration exist unless checked in code. If discussion memory is lost, GitHub's files are the stable task record.
