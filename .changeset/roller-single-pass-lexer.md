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
  validator accepted (a die/modifier out of pool position, a leading-zero
  magnitude on a special die). Acceptance of all well-formed notation is
  unchanged.
- `validateNotation(...).description` (and the public `optionsToDescription`) now
  render special dice with their own semantics — `validateNotation('4dF')` reports
  `"Roll 4dF"`, `'3DD6'` reports `"Draw 3 from d6"`, `'g6'` reports the geometric
  line, etc. — matching the description `roll()` already emitted, instead of the
  generic "Roll N M-sided dice". Standard and percentile pools are unchanged.
