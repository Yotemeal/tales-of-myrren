# Tales of Myrren — V19F original unarmed combat rhythm

**Development state:** review branch; no production deployment yet.

## Decision
The user asked for an attack **speed** distinct from the reference game's tempo, not a different character design. Myrren's current shipped melee swing interval is 900 ms regardless of weapon, while the visible attack animation occupies approximately 320 ms. We will use a modest, original differentiation:

- **Unarmed/fist:** 850 ms between attempted attacks (about 1.176 attacks/sec).
- **Equipped sword:** retain 900 ms (about 1.111 attacks/sec).
- Relative increase in fist attack frequency vs current: **5.88%** (900 / 850 − 1).
- Hit accuracy, maximum hit, enemy HP, XP-on-kill, loot rolls, 110 ms manual impact timing, swing animation window and combat range are unchanged.

## Implementation
`public/myrren-game.js` resolves interval based on whether a usable weapon is equipped. Both manual/held (pointer, keyboard, gamepad) and targeted automatic combat use the same helper and the same per-player `nextSwing` gate. Each successful attack attempt advances `nextSwing` by the **attacking state's chosen interval**. Equipping/unequipping between attacks never clears it or grants a free strike.

Targeted attack wind-up is scheduled using the chosen interval. The 320 ms visual punch-window is an independent pose duration; the actual strike cadence remains separate. The forthcoming V19F four-direction unarmed attack art should use the approved 24×32 heads/eyes, original arm movements and this new 850 ms repeat interval without extending the entire sprite animation to 850 ms.

## Risk and balancing
The tempo variation grants a slight unarmed DPS and low-level training rate increase. Weapon tier progression remains superior; no weapon damage is changed. Tests enforce a less-than-7% unarmed frequency increase, the shared cooldown and original hit logic. This intentionally differs modestly from the supplied movement references rather than copying their exact speed.

## Release gates
- Verify the source-based combat audit and the new cadence tests, combat-input, combat-kiting, multiplayer and mobile suites.
- Keep the approved V19F idle/walking PNGs, character scale, camera, state transitions, save format and gear handling byte-for-byte untouched.
- If released separately from the new attack animations, update `window.MyrrenBuild` and the HTML game-script query version to avoid cached old timing, then verify Cloudflare's live build. Do not merge solely on passing sprite preview tests.
