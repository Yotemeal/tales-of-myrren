# Obsidianite V3 — directional concept QA (review pending)

**Date:** 13 November 2026  
**Status:** NEW STYLE STUDY ONLY — NOT APPROVED, NOT GAME-READY, NOT MERGED  
**Material:** Obsidianite (item/material ID `7`), Forging Level `40`.

## Canonical source is unchanged

The original approved front remains the sole source of truth, raw RGBA 142×239 with SHA-256 `1acec039f713f3d1e7bdb4c06c63f1f5bc287b3df506ec29d29cfc70b56149ea`.

Never substitute the earlier *eyebrows/eyes-exposed* animation frames or a new illustrative front as the approved master. The approved helm covers the eyes, retaining a small skin-coloured **lower-face window**; its violet forehead jewel, pointed side elements, chest V and short hanging tassets are essential.

## Latest concept review

A generated four-direction *visual study* was reviewed against an approved-style **reference board crop**. The generated study shows front, right, back and left standing figures and improves eye coverage and consistent dark-violet palette. The reference-board crop is **not** the original raw canonical PNG, so the generated character is **not** certified pixel-accurate.

The image and four source-derived crops, together with a labelled comparison, SHA-256 manifest and QA notes, were delivered as the separate user-facing ZIP `Myrren_Obsidianite_V3_Directional_Concept_Review.zip`. ZIP SHA-256: `9cb56d2b5035a0f5446e999872e80059dada70ba628621b6d5d2d31e5a60644e`. **These binary files are not in this GitHub PR.** The generated comparison illustration must not be treated as an actual four-direction production spritesheet.

### Review failures still blocking approval

1. Front armour is slimmer and helmet aperture/chest V differ from the approved canonical figure.
2. Side/back lower panels are longer than the canonical short tassets; no new cape should be introduced.
3. Proportions and foot pivots are unverified across directions on one pixel-aligned authoring grid.
4. There are **zero** newly authored native-resolution transparent production sprite frames from this study. Crops have backgrounds.
5. No independently wearable helmet, body, gloves, legs, boots or shield layers; no mixed equipment validation.
6. No clean barehand/sword/hurt poses, independent weapon-grip sockets, original 64-frame replacement atlas, or desktop/mobile Crater Camp QA.

### Next production milestones

- Re-author and **visually compare** front/right/back/left with canonical original front *at the same display scale*, especially crown, visor, chest, shoulders and lower panels. Do not modify the original front.
- Once signed off, create unique idle/walk/attack/death poses in all four directions, four frames each (64 composites for review only). Maintain one common planted-foot pivot, consistent silhouette and no baked slash when wielded-sword rendering is separate.
- Independently author and fit each wearable slot across the full base action/direction matrix; test sword and shield on separate hands, shield draw order and complete/mixed tiers.
- Confirm rendering at native game scale on desktop and mobile, then run existing character/equipment, multiplayer, save, combat, gathering, forging, camp and terrain regression suites.

**Release decision: BLOCKED.** Keep PR #91 in draft; no production branch, main build, approved character, saves, material IDs or gameplay mechanics changed for this study.
