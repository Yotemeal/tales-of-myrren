# V31 Design B chest, boots and leg armour

The approved character remains a 128×320 atlas with 32×40 cells: front, left,
right, back idle rows, followed by the same four walking rows. Equipment uses
the same frame, timing, scale and foot anchor as the base character.

## Equipment

`public/v31-equipment.js` builds native pixel layers once per used combination.
Chest armour, boots and legs are independent, including mixed materials and master dyes.
Unequipping all three returns the existing V31 artwork with its corrected feet.
Chest art occupies cell rows 25–31 only, preserving head/neck pixels through
row 24 and every approved boots/legs pixel from row 32 onward. With no chest
equipped, the preceding lower-body renderer is pixel-identical. The fitted
chest hem tapers at the original waist rather than forming a broad belt.
Soles remain within row 38; row 39 stays transparent. No source rows are copied
or extended to manufacture legs or feet.

| Tier | Visual direction | Existing storage prefix |
| --- | --- | --- |
| Leather | Stitched vest, chaps and cuffed boots | leather |
| Bronze | Lamellar cuirass, layered warm metal and toe caps | bronze |
| Iron | Riveted breastplate, matte blocks and pale rivets | iron |
| Steel | Ridged chest, pointed knee highlights and articulated boots | steel |
| Black Iron | Diagonal chest plates, dark angular panels and leather straps | cobalt |
| Myrrenite | Chevron chest, green-grey mineral metal and pale edging | aether |

The final two material names and presentation colours are aliases. All existing
65 item IDs, requirements, attack/defence values, prices, recipes and saved
inventory references are retained. No save migration is performed.

Helmets and shields still select the existing armour renderer.
Their V31 art is a separate stage. Missing equipment scripts also retain the
existing fallback rather than hiding equipped gear. NPCs are unchanged.

## Validation performed

- Rendered all 343 chest/boots/legs combinations through all 32 atlas cells.
- Compared against the preceding lower-body renderer: head/neck, boots/legs,
  foot padding and all chest-unequipped combinations remain pixel-identical.
- Verified all six chest tiers appear in all 32 idle/walking cells.
- Verified all six tiers differ, independent slots, mixed materials, dyes and
  returning to the exact original atlas when all three slots are empty.
- Compared 21 save, movement, combat, inventory, equipment, smithing and repair
  functions against the preceding production build; their source is unchanged.
- Compared all item identities and numerical definitions, plus prices and
  smelting/forging recipes, against the preceding production build.
- Browser-tested leather chest equip; mixed Myrrenite chest/steel legs/steel
  boots (46 defence); save/reload; all four movement directions and a normal
  attack in a separate local QA save.
- Removed the chest through the normal Equipment UI: steel legs and boots
  remained equipped at 14 defence. Inventory references and requirements
  remained intact.

The local fixture and QA save controls are excluded from publication.

## Visual review

Open `/v31-equipment-preview.html` to inspect the actual renderer without reading
or writing game saves. Select chest armour, legs and boots independently, stand or walk,
pause/step each frame, and compare the original character. All four directions
and all six tiers are visible on the same page.
