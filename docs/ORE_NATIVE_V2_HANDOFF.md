# Native mining resources V2 — visual review (16 Nov 2026)
This commit updates **only ore PNGs** on draft PR #114, adds Chromium and Iridium artwork, plus a read-only visual review page and scale tests. **No main merge, deployment or gameplay integration.**

## Art direction
The owner approved the simpler ore node visual direction: ordinary uneven 3/4-view stones with narrow, subtle natural mineral veins; no glowing blades or protruding crystals. Keep native 24×20 RGBA nearest-neighbour art, visible upper and side facets, consistent anchors, light upper-left, and dark outlines. Black Iron uses dark rock and **black**, not silver/blue, veins. Chromium has restrained violet-grey seams; Iridium pale blue-grey; Myrrenite muted teal.

## Where to review
Run a static server serving public/ and open `/ore-native-v2-review.html` on the **draft PR branch**. Art review page shows actual eight PNG assets beside the approved (byte-identical) V19F native front master at 2× and enlarged at 8×. Generated mock-ups are not screenshots of running gameplay. Run `node --test tests/ore-native-v2-assets.test.cjs` to verify PNG dimensions, fingerprints and current world width. Browser/iPhone playtesting is **not** claimed.

## Gameplay safety / migration left undone
- Current main gameplay includes `obsidianite` and `meteorite` mining, `Starsteel` equipment and `Myrrenite` one tier below Starsteel. Existing internal names also include `cobalt` for Black Iron and `aether` for Myrrenite. **Do not assume the proposed seven equipment tiers are already coded.**
- Chromium is planned as the eventual Obsidianite-equivalent tier, and Iridium as the eventual Starsteel-equivalent. The owner wants Myrrenite to become the final tier. This requires a **separate** mapping of old IDs, ore placement, unlock levels, forge recipes, armour bonuses, item names, save migrations and tests. Keep source names, old arts and runtime compatibility until that is separately implemented and reviewed.
- This PR currently retains the old `ore_obsidianite.png` and `ore_meteorite.png` so the **existing game still loads them** on this branch. Do not merge PR #114 solely to deploy Chromium and Iridium; the game won't select those new assets without runtime wiring. The browser preview uses the new assets explicitly.
- No changes to combat, equipment atlas, XP, harvesting, world geometry, rendering, collision, player saves, controls or deployment.

## Next
1. Approve/refine native sprites at 2× actual in-game scale.
2. Review name/slot migration as one safe tested commit or separate PR.
3. Perform local browser + physical iPhone QA, full regression suite / CI, then request explicit permission before live deployment.
