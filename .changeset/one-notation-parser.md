---
'@randsum/roller': minor
---

The lexer is now the only notation parser. The old regex parser that still
built options for every standard pool is gone, and `roll()` parses each
notation string once instead of three times.

- `notationToOptions` throws `NotationParseError`, with `context.position`, on
  invalid notation. It used to return made-up options for input it could not
  parse. For example, `notationToOptions('0d0')` returned a zero-sided pool that
  only failed later inside `roll()`. Check with `isDiceNotation` first if you
  need to branch.
- A trailing repeat followed by whitespace now repeats: `'4d6x3 '` gives three
  pools, as `'4d6x3'` does. Before, the `x3` was silently dropped.
- `validateNotation` no longer throws on `g0`, `z0` and `DD0`, which
  `isDiceNotation` accepts. It returns a result for them like any other
  notation.
- The repeat-depth error now quotes the whole notation, not the inner segment
  where the limit was hit.
