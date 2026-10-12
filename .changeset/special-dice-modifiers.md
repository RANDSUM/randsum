---
'@randsum/roller': minor
'@randsum/games': patch
'@randsum/mcp': patch
---

Modifiers on special dice now roll, and notation that used to pass validation
and then crash or return a wrong total now behaves the same as its options form.

- `4dF+1`, `d%+5`, `g6+1`, `z6+1`, `3DD6L` and `2d{1,2,3}+1` passed
  `isDiceNotation`, then `roll()` and `validateNotation()` threw an internal
  `Invalid notation "0d0+1"` error. Special dice now carry their modifiers, as
  RDN's `die-core *modifier` grammar requires.
- An explosion that fires on the maximum face without a condition (`!`, `!!`,
  `!p`, `!s{}`, `!i`, `!r`, `W`) is now a parse error on `dF`, `zN` and
  `d{...}`, whose faces are not 1..N. Before, these crashed. Use a condition
  instead, as in `4dF!{>0}`.
- A reroll value is checked against the die's own faces, so `z6R{0}`,
  `dF.2R{0}` and `3d{2,4,6}R{6}` roll, and `z6R{9}` throws `ModifierError`.
- Notation strings now get the same modifier validation as options objects.
  `roll('1d6L')` and `roll('4d6L4')` used to return a total of 0 and
  `roll('3d6K5')` quietly kept all three dice. Each now throws `ModifierError`.
- `//0` and `%0` are no longer valid notation (the RDN grammar requires a
  positive divisor), and `{ integerDivide: 0 }` or `{ modulo: 0 }` throws
  `ModifierError`. Both used to return a `NaN` total.
- Game `integer` inputs now reject fractions with the game's own label. For
  example, Daggerheart `{ modifier: 0.5 }` used to return a fractional total.
