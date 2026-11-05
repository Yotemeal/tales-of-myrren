# Parchment interface QA

- JavaScript syntax check passes.
- Compared all 183 original functions outside the five changed view functions against commit 5f3fc2e935e3cda2616703d718ef552e56ef770f: identical. Movement, combat, save handling, item actions, shops and world rendering remain unchanged.
- Browser: desktop inventory, equipment portrait, skills and settings rendered.
- Browser: isolated local save equipped Leather cap, then restored Myrrenite helm; defence changed from 63 to 48 and back to 63; real bag contents updated.
- Save export returned a nonempty ER1 code.
- Phone portrait 390x844 and landscape 844x390 checked using same-origin iframe fixtures. Content scrolls within the window; action controls and HUD remain accessible.
- Production publication excludes preview adapters and fixtures.
- Controller hardware and multiplayer were not exercised.
