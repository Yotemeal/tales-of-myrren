# Native tree A/B — real-game review only

This is a **staged-only** review page and artwork. The normal `index.html`, `myrren-game.js`, `myrren-environment.js`, skills, saves, equipment, and Cloudflare live deployment remain **unchanged**.

- The exact last approved image is `D0810579-8FA6-482E-A83C-C5CCAD7C3BEA.jpeg`, not the later Oak revision.
- `public/assets/resources/tree-preview-v1/approved_tree_atlas.png`: **lossless** RGBA atlas of all 12 extracted A/B native tree PNGs plus their 12 matched stumps; original 24 single PNG files remain in the local review package.
- Atlas 600×276. Six species ordered Pine, Birch, Oak, Willow, Maple, Ironbark; row A at y=2, stump A at y=104; row B at y=140, stump B at y=242. Each cell 100 px wide, source widths/heights in `myrren-tree-native-review.js`.
- Only `tree-native-review.html` loads the QA adapter: it replaces the frozen environment object's tree draw function for known species, delegates ancient and unknown trees to the original environment, and draws native rectangles at 1× game pixels under the fixed **2× gameplay camera**. No built-in wind, tree movement, leaf storms or recolouring.
- Variants are stable by node coordinates, 70% A and 30% B. Both variants of the same species have identical resource behaviour. For the review, legacy internal node IDs map to visual species; Birch exists as a **review node only** until its gameplay progression is separately designed.
- Trees change to their exact matching stump on the existing `n.back` cooldown; no changes to woodcutting/depletion logic or stump scale.
- `tests/tree-native-real-game-browser.cjs` boots the **actual game** from `tree-native-review.html` and inserts 12 QA-only nodes through a browser test hook. It captures full and stump states with the actual depth-sorter and world renderer. The 12-player-side-by-side setup is QA-only, not a new world placement.
- No deployment or merge until the user reviews real captured screenshots and approves placement and scale.

## Notes
This is a QA stage, not a complete gameplay migration. Current game supports 5 tree resource IDs but the approved art has 6 species. Gameplay progression, node species distribution and any level requirements will require an explicit separate migration decision. Never rename resource keys in saves just to match art labels.
