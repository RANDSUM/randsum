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
- Keep-middle now adds to an `L`/`H` drop instead of overwriting it: `5d6KmL`
  and `5d6LKm` both drop the two lowest and the highest. `6d6KKm` keeps both
  the highest and the middle, where keep-middle used to win. Other repeated
  modifiers are unchanged: `V`, `C`, `U`, `!{..}`, `*`, `//` and `%` still keep
  only their first occurrence (`4d6V{1=6}V{2=5}` replaces only 1s).
