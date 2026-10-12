---
'@randsum/roller': patch
'@randsum/mcp': patch
---

`tokenize()` now emits token keys that exist in `NOTATION_DOCS`.

The single-pass lexer gave every drop token the key `drop` and every explode
sequence token `!s`, while `NOTATION_DOCS` documents them as `L`, `H`, `D{..}`,
`!s{..}`, `!i` and `!r`. Drop tokens now carry `L`, `H` or `D{..}`, and explode
sequence tokens carry `!s{..}`, `!i` or `!r`, as the docs already described.

`NOTATION_DOCS` also gains entries for the two keys it was missing: `xN` (repeat)
and `label` (annotation). They are not added to `MODIFIER_DOCS` or `DICE_DOCS`.

Any consumer that looked tokens up in `NOTATION_DOCS` by key, such as a notation
highlighter, painted these valid tokens as unknown.
