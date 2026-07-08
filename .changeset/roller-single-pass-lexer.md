---
"@randsum/roller": major
---

Rewrite notation processing around a single cursor-based lexer.

`isDiceNotation`, `validateNotation`, `notationToOptions`, `tokenize`, and
`roll()`'s argument parsing are now all views over one positioned-token lexer +
parser, replacing five overlapping regex systems (the strip-and-check validator,
the per-schema merge scanner, the multi-pool splitter, the hand-rolled tokenize
pattern table, and the private die-type regexes in `roll`).

Breaking / behavior changes:

- `ParsedNotationOptions` gains additive fields (`dieType`, `fateVariant`,
  `customFaces`). `notationToOptions` no longer silently discards special-die
  semantics — e.g. `notationToOptions('4dF')` now reports `dieType: 'fate'`
  instead of a plain 3-sided pool, and multi-pool strings that mix standard and
  special dice (e.g. `1d20+g6`) return every pool instead of dropping the special
  ones.
- Oversized input (> 1000 characters) now fails consistently across every public
  surface: `notationToOptions` and `roll()` throw `NotationParseError` instead of
  returning `[]` / silently splitting a long multi-pool string into valid pieces.
- Error positions are populated: thrown `NotationParseError`s and
  `validateNotation(...).error` now carry the real character offset where parsing
  failed (`ErrorContext.position` / `ValidationErrorInfo.position`).
- The structural parser rejects some malformed strings the old strip-based
  validator accepted (a die/modifier out of pool position, an annotation before a
  pool such as `[fire]1d20`, a leading-zero magnitude on a special die).
  Acceptance of all well-formed notation is unchanged.
- Repeat operator (`xN`) scope is now explicit. `xN` repeats everything to its
  left, so it is accepted ONLY as a trailing run and a whole-string-trailing `xN`
  now repeats the ENTIRE expression (before → the pre-lexer engine scoped a
  trailing `xN` to the last pool: `2d6+1d8x2` was "2d6 then two 1d8"; after → it
  is "(2d6+1d8) twice"). A non-trailing `xN` — e.g. `4d6x2+2d8` — was previously
  accepted but silently dropped (the `x2` had no effect); it is now a positioned
  rejection (`isDiceNotation` → false, `roll()` throws). Single-pool trailing
  repeats (`4d6Lx6`) and nested trailing repeats (`2d6x2x3`) are unchanged.
- `validateNotation(...).description` (and the public `optionsToDescription`) now
  render special dice with their own semantics — `validateNotation('4dF')` reports
  `"Roll 4dF"`, `'3DD6'` reports `"Draw 3 from d6"`, `'g6'` reports the geometric
  line, etc. — matching the description `roll()` already emitted, instead of the
  generic "Roll N M-sided dice". Standard and percentile pools are unchanged.
