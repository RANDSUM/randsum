# @randsum/roller

## 4.1.0

### Minor Changes

- [#1304](https://github.com/RANDSUM/randsum/pull/1304) [`8a382dd`](https://github.com/RANDSUM/randsum/commit/8a382ddf10d38a6c2fcbe35fdb7c7cbc580858a6) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Notation and descriptions built from options now list modifiers in the order
  they run. Before, they used a separate hand-kept order that put drop and keep
  before replace, reroll and the explosions, and count after the arithmetic. For
  example, `roll('4d6L!').rolls[0].notation` is now `'4d6!L'`, and
  `validateNotation('4d6LR{1}+3').notation[0]` is `'4d6R{1}L+3'`. The dice roll
  the same way: modifiers have always run in priority order, whatever order the
  notation lists them in.

- [#1304](https://github.com/RANDSUM/randsum/pull/1304) [`8a382dd`](https://github.com/RANDSUM/randsum/commit/8a382ddf10d38a6c2fcbe35fdb7c7cbc580858a6) Thanks [@alxjrvs](https://github.com/alxjrvs)! - The lexer is now the only notation parser. The old regex parser that still
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

- [#1302](https://github.com/RANDSUM/randsum/pull/1302) [`0280991`](https://github.com/RANDSUM/randsum/commit/028099121181b193c369c2507fe9670ece43606f) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Modifiers on special dice now roll, and notation that used to pass validation
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

## 4.0.0

### Major Changes

- [#1137](https://github.com/RANDSUM/randsum/pull/1137) [`47a37fe`](https://github.com/RANDSUM/randsum/commit/47a37fe5b460d93bdf9b77f5e8249f7ad5d4eed9) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Prune dead registry helpers and leaked internal exports from the public surface.

  **Breaking — the following were removed from the `@randsum/roller` main barrel.**
  They were never part of the documented public API; each is either fully internal
  now or gone entirely. If you imported any of them from `@randsum/roller`, switch
  to the documented API (`notationToOptions`, `optionsToNotation`,
  `optionsToDescription`, `modifiersToNotation`, `modifiersToDescription`,
  `validateNotation`, `isDiceNotation`, `suggestNotationFix`).

  Removed barrel exports:

  - `optionsToSidesFaces` — now internal to `src/notation/transformers/`
  - `listOfNotations` — now internal to `src/notation/parse/`
  - `coreNotationPattern` — now internal to `src/notation/`
  - `formatHumanList` — now internal to `src/notation/`
  - `TTRPG_STANDARD_DIE_SET` — now internal to `src/notation/constants`
  - `parseComparisonNotation` — now internal to `src/notation/comparison/`
  - `hasConditions` — now internal to `src/notation/comparison/`
  - `formatComparisonNotation` — now internal to `src/notation/comparison/`
  - `formatComparisonDescription` — now internal to `src/notation/comparison/`
  - `TokenType` type alias (was `= string`) — removed from the barrel and the
    `./tokenize` subpath; use `Token['key']` / `TokenCategory` instead

  Removed dead registry helpers (`src/modifiers/registry.ts`), which duplicated
  `src/notation/transformers/modifiersToStrings.ts` and had no production
  consumers: `getModifier`, `hasModifier`, `getAllModifiers`,
  `processModifierNotations`, `processModifierDescriptions`, `modifierToNotation`,
  `modifierToDescription`.

- [#1158](https://github.com/RANDSUM/randsum/pull/1158) [`cba0564`](https://github.com/RANDSUM/randsum/commit/cba05643b8cc9c1fb4d0f97bf5ac70f66f369d3b) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Honest `values` typing, multi-pool guard, public seeded RNG, typed `label`, and
  closed `ErrorCode` union. Several of these are breaking.

  - **Breaking — `result.values` is now honest.** Numeric pools populate the
    actual `number` roll values instead of `String(n)` (`roll("2d6").values` is
    now `[3, 5]`, not `["3", "5"]`). Custom-faced pools still populate their face
    values (`T`). `RollerRollResult<T>['values']` is retyped from `T[]` to
    `(number | T)[]`. Consumers that relied on string values must adapt.

  - **Breaking — mixing custom-faced (non-numeric) dice with other pools in a
    single `roll()` now throws.** Previously `roll("1d20", { sides: ["H","T"] })`
    silently returned `total: 0`, indistinguishable from a genuine zero. It now
    throws a `ValidationError`; roll such pools separately.

  - **New `@randsum/roller/random` subpath.** Exports `createSeededRandom` (seeded
    LCG, now normalized so negative seeds still produce valid faces) and
    `createQueueRandom` (deterministic replay from a fixed sequence of die
    values), plus the `QueueRandomOptions` type. This is the public home of the
    RNG factories that previously lived only in `test-utils`.

  - **Breaking — bare `dN` notation is now accepted** (`d20` === `1d20`, quantity
    optional per RDN §4.1). `isDiceNotation("d20")`, `validateNotation("d20")`,
    and `roll("d20")` are now valid, the `DiceNotation` type accepts an omitted
    leading quantity, and roller now passes conformance vector 2. Notation that
    previously threw for a "missing quantity" no longer does.

  - **`label` is now a typed `RollOptions` field.** `roll({ sides: 6, label: "fire" })`
    is honored via the type system (the previous untyped `'label' in options`
    cast is gone).

  - **Breaking — `ErrorCode` is now a closed literal union** of the four
    `ERROR_CODES` values (no longer `... | (string & {})`), so consumers can
    `switch` over it exhaustively. Runtime values are unchanged.

  - **`traceRoll` fixes.** Exact-match conditions (`exact: number[]`) now render in
    trace labels (they were silently dropped), and `finalRolls.arithmeticDelta` is
    now derived as `total - sum(rolls)` — the real scalar arithmetic offset — so
    `+N`/`-N` modifiers show up in the final math line instead of only subtractive
    pools.

- [#1160](https://github.com/RANDSUM/randsum/pull/1160) [`c32837d`](https://github.com/RANDSUM/randsum/commit/c32837d722cf737e2b400585a7632d9330bfc24d) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Rewrite notation processing around a single cursor-based lexer.

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

### Patch Changes

- [#1153](https://github.com/RANDSUM/randsum/pull/1153) [`8fcab44`](https://github.com/RANDSUM/randsum/commit/8fcab447ad14cb01eaf0c05415347be51601a5f3) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Unify the duplicated modifier schemas into a single source (internal refactor; no
  public API change).

  Every modifier previously had its notation schema implemented **twice** — once in
  `src/modifiers/<mod>.ts` (schema + behavior + docs, driving `roll()`) and once in
  `src/notation/definitions/<mod>.ts` (schema-only, driving parse/validate/
  tokenize). The two had drifted, and the main bundle shipped both copies.

  - `src/notation/definitions/<mod>.ts` is now the single canonical source of each
    modifier's `pattern`/`parse`/`toNotation`/`toDescription`. Each
    `src/modifiers/<mod>.ts` imports its schema and attaches only dice-pool
    behavior (`apply`/`validate`).
  - Static notation docs moved to a dedicated pure-data module
    (`src/docs/modifierDocData.ts`), so `dist/docs/index.js` is now self-contained
    and pulls in zero roll-engine code (the package's "pure static data" claim is
    now literally true), and the tokenize path stays schema-only.

  Net effect: `dist/index.js` shrinks ~15.7 → 11.5 KB and `dist/docs/index.js`
  ~10 → 4.5 KB (brotli); size-limit budgets tightened accordingly. The public
  surface is unchanged.

## 2.0.0

### Minor Changes

- [#1056](https://github.com/RANDSUM/randsum/pull/1056) [`6cf8b29`](https://github.com/RANDSUM/randsum/commit/6cf8b298a04d5aa2f6b7ca2ab8815bf2ebb01afb) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Audit pass: 30 prioritized improvements landed across the ecosystem.

  **@randsum/roller**

  - Fix `explodeSequence` requiring `randomFn` without declaring it (raw `Error` → proper `ModifierError`)
  - Add `integerDivide` and `modulo` to `traceRoll` arithmetic step types
  - Remove `registry.parseModifiers` dead-code parser (production uses `MODIFIER_SCHEMAS`)
  - Correct `!` modifier description (single-wave behavior, not chained)
  - Restore tree-shaking: `sideEffects: false`

  **@randsum/games**

  - Fix D&D 5e nat 1/20 inversion under advantage/disadvantage (read kept die, not RNG-order initial)
  - Add Root RPG mastery / helping (3d6 keep highest 2) via `rollingWith: Advantage/Disadvantage`

  **@randsum/cli**

  - stdin / pipe support and non-zero exit on error
  - Remove Ink TUI; CLI is now a thin one-shot binary (drops `-i`/`--interactive`)

  **@randsum/dice-ui** (BREAKING)

  - Remove `./ink` subpath export and all Ink-based components. Consumers that imported from `@randsum/dice-ui/ink` should pin the prior version or fork. Web (`.tsx`) and native (`.native.tsx`) entrypoints unchanged.

  **Repo-wide**

  - CI now uploads coverage to Codecov, runs bench regression gate, includes expo in the test matrix, and serializes `bun install` before parallel pre-commit steps
  - Discord bot: ephemeral roll option (`hidden: boolean`)
  - TS consolidated on `catalog:` (6.0.2 everywhere)
  - SECURITY.md rewritten for scoped packages; bug report + PR templates updated
  - Phantom Railway docs stripped; RDN version claims rolled back to match shipped spec
  - `check:all` script added; docs aligned

## 1.3.0

### Minor Changes

- [#1018](https://github.com/RANDSUM/randsum/pull/1018) [`fd52c31`](https://github.com/RANDSUM/randsum/commit/fd52c3109c583b835ff7edf35bcff2a79099970a) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Testing changes for 2.0.0 release
