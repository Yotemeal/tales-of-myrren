# Bank, notes and inventory interactions

Built on cleanup commit 382a4e49186a02ef6f0b3a9a5619d25a52bdf26f.

- New personal bank chest, separate from job deliveries.
- Persistent bag/bank slot order with holes and swaps; gear instance actions retain the original bag indices.
- Pointer drag and 450 ms hold controls, right-click menus, and keyboard-accessible More actions.
- Contextual deposit / get / sell quantities: 1, 5, 10, all.
- Stackable notes for ordinary items and equipment; notes return to usable items through bank storage.
- Save schema additions are optional for older saves: bank, notes, packOrder, bankOrder. Valid existing items, gear, currency, XP, jobs and pets are retained.
- Runtime regression checks cover exact transfers, bulk notes, equipment aggregation, inventory limits, slot-order save roundtrips, proximity, and selling carried notes without touching bank contents.
- Browser checked real drag-to-empty in both grids, hold menu, exact deposit and bulk note withdrawal. Bag and chest positions survived reload. Phone layouts use Chest/Backpack pane buttons. Existing gameplay/save and village suites also pass.
- Player trading remains unavailable. Presence-only multiplayer cannot safely commit item transfers; no client-only trade simulation is shipped.
