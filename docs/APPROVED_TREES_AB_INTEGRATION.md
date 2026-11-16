# Tales of Myrren — approved woodland A/B integration

**Approval:** User's final six-species, two-variant design sheet. Do not redraw, recolour, rescale, animate or replace these approved sprites without explicit approval.

## Native artwork

- Single transparent RGBA atlas: `public/assets/resources/v34/myrren_trees_ab_600x276.png` (600×276 pixels).
- Exact, pixel-identical crops of the **12 approved native tree PNGs and 12 individually matching stumps**. `approved-trees-ab-manifest.json` records the atlas SHA-256, all 24 crop rectangles and RGBA SHA-256 checksums.
- One source pixel equals one world pixel; the game's existing fixed 2× camera displays each at 2 screen pixels. No CSS scaling or animation of individual tree parts.
- Full tree and matching stump share a ground anchor at `(x, y+4)`. No wind animation. Forestry hit particles remain brief, only on interaction.

## Gameplay mapping (save-compatible)

| Existing resource key | New visible tree | Woodcutting unlock | Existing item key |
| --- | --- | ---: | --- |
| `tree` | Pine **or** Birch, selected deterministically | 1 | `logs` |
| `oak` | Oak | 10 | `oak` |
| `maple` | Maple | 30 | `maple` |
| `elder` | Willow | 60 | `elder` (now labelled Willow logs) |
| `myrren` | Ironbark | 85 | `myrren` (now labelled Ironbark logs) |

Existing resource node counts, spawn coordinates, save keys, drop rates, XP, prices, tools, depletion odds and respawn times are unchanged. The new appearance selection is deterministic by world coordinate: 70% Variant A and 30% Variant B, with no random re-roll on respawn. The old `tree` tier can be Pine or Birch, and both yield generic Logs. The higher two wood types retain their historical internal keys for backward compatibility; only their player-facing names change.

Decorative rim/showcase and world-border trees use the same approved atlas, but are still scenery-only; the giant ancient grove is intentionally left as a distinct landmark for the later environment art pass. Border decorative density is reduced to account for the wider approved canopies; boundary collision is unchanged.

## Regression coverage

`node --test tests/approved-trees-ab.test.cjs` verifies 24 exact atlas pixel crops, per-tree stump alignment, static draw behavior, deterministic species/variants, full normal-world coverage of all 12 designs, unchanged Forestry node counts, item keys and XP. Existing Forestry, mining, camera, save and economy tests should also pass in the complete repository/CI environment.

**Do not delete or rename legacy inventory keys** without an explicit migration. The palette of the approved trees is locked; the remaining terrain palette will be handled separately.
