---
'@randsum/roller': minor
'@randsum/mcp': patch
---

Notation and descriptions built from options now list modifiers in the order
they run. Before, they used a separate hand-kept order that put drop and keep
before replace, reroll and the explosions, and count after the arithmetic. For
example, `roll('4d6L!').rolls[0].notation` is now `'4d6!L'`, and
`validateNotation('4d6LR{1}+3').notation[0]` is `'4d6R{1}L+3'`. The dice roll
the same way: modifiers have always run in priority order, whatever order the
notation lists them in.
