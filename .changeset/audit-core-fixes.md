---
'@randsum/roller': patch
'@randsum/games': patch
'@randsum/mcp': patch
'@randsum/ui': patch
'@randsum/notation-spec': patch
---

Roller, games and MCP fixes from the core audit.

- **Unique exemptions repeat.** `U{...}` lets the listed values repeat (spec 6.5.3), so `3d2U{1}` and `7d6U{1}` now roll instead of throwing. A pool is rejected only when it has fewer distinct faces than dice and no exempt value is one of its faces: `7d6U` and `7d6U{7}` still throw. Custom faces count distinct values, so `3d{1,1,2}U` is rejected up front instead of failing after 99 rerolls.
- **Modifier errors read once.** A modifier's error was wrapped twice ("Modifier error for "unique": Modifier error for "unique": ...") and lost its context. It now propagates as thrown, and a non-RANDSUM error (a bug) is no longer reported as a `ModifierError`.
- **`validateNotation` means it rolls.** Notation that parses but cannot roll (`2d6L3`, `3d2U`, `1d6R{7}`, `99999d6`) was reported valid. It is now invalid with the reason `roll()` would give, and the invalid result has a new optional `error.code` (`INVALID_NOTATION`, or for example `MODIFIER_ERROR`). The MCP `validate` tool inherits this, and `@randsum/ui`'s field shows the modifier's reason.
- **Geometric dice.** Their description said they roll until a 1 and count the rolls, and left out the quantity; it now reads `Roll 3g6 (geometric: roll again on each 6, summing all rolls)`. A geometric die now takes only total modifiers (`+`, `-`, `*`, `//`, `%`, `**`): `g6L` or `3g6#{>6}` throws "Pool modifiers are not supported on geometric dice", because a geometric pool holds every roll, not one value per die. Spec 0.9.0 rev. 5 states the rule (Section 4.3) and adds error vectors 60 and 61. It also corrects Section 4.6: Custom Faces dice may take a quantity.
- **Error class names** survive minification: `constructor.name` is `ModifierError`, `SchemaError` and so on, not a single letter.
- **Game inputs.** Generated `roll()` functions checked an integer input only when it was already a number, so an untyped caller's `pbta({ stat: '3' })` rolled a total of 9300 and `pbta({})` rolled `2d6+NaN`. A required integer is now always checked, and an optional one whenever it is given. A bare value where an input object is expected (root-rpg `roll(2)`) throws `SchemaError` instead of silently using defaults.
- **Codegen.** `generateCode` rejects the `markDice`/`keepMarked` modify ops, which it never implemented, instead of generating a roll without the filter. Refreshing remote tables now applies `dataPath`.
- **MCP.** The `roll` tool reports invalid notation with the `INVALID_NOTATION` code.
