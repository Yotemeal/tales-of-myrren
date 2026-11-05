# V31 Design B boots and leg armour

The approved character remains a 128×320 atlas with 32×40 cells: front, left,
right, back idle rows, followed by the same four walking rows. Equipment uses
the same frame, timing, scale and foot anchor as the base character.

## Equipment

`public/v31-equipment.js` builds native pixel layers once per used combination.
Boots and legs are independent, including mixed materials and master dyes.
Unequipping both returns the existing V31 artwork with its corrected feet.
The upper body and original waist pixels through cell row 31 are unchanged.
Soles remain within row 38; row 39 stays transparent. No source rows are copied
or extended to manufacture legs or feet.

| Tier | Visual direction | Existing storage prefix |
| --- | --- | --- |
| Leather | Brown chaps, seams and cuffed boots | leather |
| Bronze | Layered warm metal and toe caps | bronze |
| Iron | Matte blocks and pale rivets | iron |
| Steel | Pointed knee highlights and articulated boots | steel |
| Black Iron | Dark angular panels and leather straps | cobalt |
| Myrrenite | Green-grey mineral metal and pale edging | aether |

The final two material names and presentation colours are aliases. All existing
65 item IDs, requirements, attack/defence values, prices, recipes and saved
inventory references are retained. No save migration is performed.

Helmets, chest armour and shields still select the existing armour renderer.
Their V31 art is a separate stage. Missing equipment scripts also retain the
existing fallback rather than hiding equipped gear. NPCs are unchanged.

## Validation performed

- Rendered all 49 boots/legs combinations through all 32 atlas cells.
- Verified unchanged upper-body/waist pixels and transparent frame padding.
- Verified all six tiers differ, independent slots, mixed materials, dyes and
  returning to the exact original atlas when both slots are empty.
- Compared 21 save, movement, combat, inventory, equipment, smithing and repair
  functions against the preceding production build; their source is unchanged.
- Compared all item identities and numerical definitions, plus prices and
  smelting/forging recipes, against the preceding production build.
- Browser-tested equip, mixed Myrrenite legs/leather boots (25 defence),
  reload/restore, unequip (0 defence), steel legs/boots (14 defence), all four
  movement directions and a normal attack through existing game actions in a
  separate local QA save.

The local fixture and QA save controls are excluded from publication.

## Visual review

Open `/v31-equipment-preview.html` to inspect the actual renderer without reading
or writing game saves. Select legs and boots independently, stand or walk,
pause/step each frame, and compare the original character. All four directions
and all six tiers are visible on the same page.
