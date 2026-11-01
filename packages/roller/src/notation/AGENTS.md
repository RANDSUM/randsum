# Notation lexer (the only parser)

All notation processing runs through **one cursor-based lexer** in `lexer/`. Every public surface is a thin view over it: there is no regex system per surface, and no second parser that builds options. Do not add one.

- **`lexer/specs.ts`** is the single token inventory. `POOL_SPECS` (die-type heads) and `MODIFIER_SPECS` (category + schema + sticky matcher per modifier) derive from `MODIFIER_SCHEMAS` plus the `S{..}` / `F{..}` / `ms{..}` sugar, sorted by schema priority, so the schemas stay the semantic source of truth.
- **`lexer/scan.ts`**: `scan(input)` is a pure left-to-right lexical pass producing positioned `Lexeme`s (pool / modifier / annotation / repeat / unknown). It enforces no structure; it is exactly what `tokenize` exposes.
- **`lexer/parse.ts`**: `parseNotation(input)` layers grammar over the token stream (begins with a pool, no unknown tokens, positive-integer magnitudes, at most one Count-family modifier, 1000-char limit) and returns a typed pool AST plus the error position.

The public surfaces are views of that one pass:

- `isDiceNotation` is `parseNotation(...).valid`; `notation()` throws with the real `ErrorContext.position`.
- `validateNotation` is parse + describe, with `error.position` populated.
- `notationToOptions` maps the AST to `ParsedNotationOptions[]` (`parse/poolToOptions.ts`) and throws a positioned `NotationParseError` on invalid input. Tokens of one schema are parsed together, space-separated so `!` and `!` never fuse into `!!`, and a keep-middle `drop` is summed with an `L`/`H` drop rather than overwriting it. Schemas that read only their first match (`V`, `C`, `U`, `!{..}`, `*`, `//`, `%`) keep only the first occurrence of a repeated token. `modifierCombination.property.test.ts` checks that no modifier key is lost and that order does not matter across schemas (it compares keys, not values).
- `tokenize` is the positioned `scan` stream with descriptions attached.
- `roll()`'s `parseArguments` parses each string once and hands that result to `parsedToOptions`; the notation it renders back is not re-validated. Special dice are built from the additive `dieType` / `fateVariant` / `customFaces` fields and carry their modifiers (`4dF+1`, `d%+5`, `3DD6L`). Max-face explosions (`!`, `!!`, `!p`, `!s`, `W`) without a condition are a parse error on `dF`, `zN` and `d{...}`, whose faces are not 1..N.
- Modifiers are validated in `parseArguments.optionsToParams`, so notation and options objects share one check.

Input over 1000 characters throws on every surface. The lexer is linear, so it is ReDoS-free; keep it that way.
