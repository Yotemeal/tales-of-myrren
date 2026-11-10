# Rare resource gathering and banking routes — November 2026

## Problem observed in the deterministic world

The existing seeded resource generator supplied **four** meteorites, but
all four were on the eastern side of the map. Three were far north-east
and the fourth was south-east. Meanwhile valuable coal, Myrrenwood trees
and other late-game ore had a useful south-western cluster that lacked any
meteorite. Players who trained for Starsteel had to cross the map or
return from the far eastern edge for each meteorite route.

The bank is at **(650, 914)**, inside the Camp's rocky crater rim. The
world's single dry entrance is on the southern side of that rim. A
straight-line distance from bank to resource therefore understates real
travel; walking around the rim and lake matters.

Before this change, the four meteorite locations (rounded) were:

- North-east (1303, 203), (1327, 326), (1454, 400)
- South-east (1297, 1400)

The previous **shortest walkable** bank-to-meteorite route was roughly
839 world pixels, to the south-eastern deposit. This is computed using
16px samples of the same water/crater collision geometry as player
movement; it is not a measured mobile session.

## Change: an alternative western mining route

Exactly one **existing** meteorite is moved from the northernmost
north-east location to **(520, 1470)**. The total four-deposit supply and
all regeneration times remain unchanged. Three eastern deposits remain.
A narrow terrain-only dirt-track fork connects the southward Camp path
from roughly (800, 1350) through (620, 1430) to the deposit.

The western deposit sits approximately **59 pixels from an existing
coal rock** and **45 pixels from an existing Myrrenwood tree**, with
adequate clearance from other gathering hitboxes and hostile spawns.
This makes an interesting mixed high-level gathering route rather than
providing bonus resources. It is outside the beginner Camp.

The game still has just **six Myrrenwood trees**, **four meteorites** and
**16 coal nodes**, with their original distribution besides the single
meteorite move. The paths change the ground texture only: no new
collision exceptions, tunnel through the crater, teleporting or faster
player movement.

## Safety and testing

`tests/rare-resource-routes.test.cjs` samples a 16-pixel collision grid
from the bank, using eight-direction Dijkstra routing without clipping
diagonally through impassable terrain. It verifies:

- All four meteorites are reachable; one is western and three eastern.
- A walkable route from the existing bank reaches the new western rock
  in less than 800 world pixels, improving on the prior 839-pixel nearest
  route.
- The ground-path fork stays connected, water/crater rules still apply,
  and the site clears other nodes and monster spawns.
- Source amounts, meteorite XP, unlock level, chance, depletion,
  respawn timings, and saved character fields are unchanged.
- Tapping a resource still only reveals its name and level.

The comparison is **not an XP/hour claim**. The improved route helps
players get to a rare resource and collect nearby coal/wood; resources
still deplete and take time to respawn. Travel routes also contain
enemies, and players must equip the appropriate tools to gather.

## Follow-up

The next useful iteration is measuring real 15-minute gathering loops
on a phone, specifically bank-to-western-ore and bank-to-eastern-ore,
including enemy encounters and inventory management. Avoid broader
XP, drop-rate or resource-density increases until that real loop is
measured.
