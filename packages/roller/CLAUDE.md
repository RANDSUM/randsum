# @randsum/roller — Core Dice Engine

## Overview

The core package: the `roll()` function, native notation parsing, validation,
tokenization, and the 19-modifier roll pipeline. Every other package in the
monorepo depends on this one. Zero runtime dependencies. ESM-only output
(`dist/index.js` + `dist/index.d.ts`; no `.cjs`/`.d.cts`).

Notation parsing, validation, tokenization, and modifier schemas are **native to
this package** (under `src/notation/` and `src/modifiers/`). There is no separate
`@randsum/notation` package — it was merged in (ADR-005). Any reference to it is
stale.

## Notation lexer (single pass)

All notation processing runs through **one cursor-based lexer** in
`src/notation/lexer/`. Every public surface is a thin view over it — there is no
separate regex system per surface:

- **`specs.ts`** — the single token inventory. `POOL_SPECS` (die-type heads) and
  `MODIFIER_SPECS` (category + sticky matcher per modifier). The modifier matchers
  are compiled from the `notation/definitions/<mod>Schema` patterns in RDN
  specificity order, so the schemas stay the semantic source of truth.
- **`scan.ts`** — `scan(input)` is a pure lexical left-to-right pass producing
  positioned `LexToken`s (pool / modifier / annotation / repeat / unknown). No
  structure is enforced here; this is exactly what `tokenize` exposes.
- **`parse.ts`** — `parseNotation(input)` layers grammar over the token stream
  (begins with a pool, no unknown tokens, positive-integer magnitudes, ≤1
  Count-family modifier, 1000-char limit) and returns a typed pool AST plus the
  error position.

The four surfaces are views of that one pass:

- `isDiceNotation` = `parseNotation(...).valid`; `notation()` throws with the real
  `ErrorContext.position`.
- `validateNotation` = parse + describe, with `error.position` populated.
- `notationToOptions` = AST → `ParsedNotationOptions[]`. Special-die semantics
  survive via the additive `dieType` / `fateVariant` / `customFaces` fields, and
  multi-pool splitting comes from the AST (no separate splitter).
- `tokenize` = the positioned `scan` stream with descriptions attached (no
  hand-rolled pattern table).
- `roll()`'s `parseArguments` consumes the same parser — no private die-type
  regexes, no multi-pool splitter. Special dice are built from `dieType`; a
  special die carrying modifiers still throws (roller rejects modifiers on
  special dice).

Oversized input (> 1000 chars) fails consistently (throws) across every surface.
The lexer is linear, so it is inherently ReDoS-free, and — by dropping the old
per-roll giant-alternation validator — `roll()` on the gate notations is ~2–5×
faster than the pre-lexer path.

## Main API

### `roll<T = string>(...args): RollerRollResult<T>`

Accepts a number (`roll(20)` → 1d20), a notation string (`roll("4d6L")`), an
options object (`roll({ sides, quantity, modifiers })`), or several of these
combined into one total (`roll("1d20+5", "2d6")`). An optional `RollConfig`
(`{ randomFn }`) may be passed as the **last** argument — placed earlier it is
treated as a roll argument and fails validation.

`RollerRollResult`:

- `total: number` — combined total across all pools
- `values: T[]` — flat array of individual die values (numeric strings for
  numeric dice, actual face values for custom-faced dice)
- `rolls: RollRecord[]` — full per-pool records with modifier history

`roll()` throws on invalid input — wrap in try/catch.

### Validation

`src/validate.ts` (and the `./validate` subpath) re-exports:

- `isDiceNotation(value): value is DiceNotation` — type guard
- `notation(value): DiceNotation` — assert valid or throw `NotationParseError`
- `validateNotation(notation): ValidationResult` — detailed result/errors
- `validateInteger`, `validateRange`, `validateNonNegative`, `validateFinite` —
  numeric validators (from `src/lib/utils/validation`)

## Subpath exports

Declared in `package.json` `exports`:

| Subpath      | Source            | Provides                                                     |
| ------------ | ----------------- | ------------------------------------------------------------ |
| `.`          | `src/index.ts`    | Barrel — `roll`, validation, conversion, errors, types       |
| `./roll`     | `src/roll/`       | `roll` only                                                  |
| `./errors`   | `src/errors.ts`   | Error classes + `ERROR_CODES`                                |
| `./validate` | `src/validate.ts` | Validation + numeric validators                              |
| `./tokenize` | `src/tokenize.ts` | `tokenize`, `Token`, `TokenCategory`                         |
| `./docs`     | `src/docs/`       | `NOTATION_DOCS`, `MODIFIER_DOCS`, `DICE_DOCS`, `NotationDoc` |
| `./trace`    | `src/trace/`      | `traceRoll`, `formatAsMath`, `RollTraceStep`                 |

There is **no `./comparison` subpath**. Comparison helpers
(`parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`,
`formatComparisonDescription`) are **internal** to `src/notation/comparison/` —
consumed directly by the modifier and notation-definition code, not re-exported
from any public surface.

### `./docs` — static notation documentation

Pure static `NotationDoc` data — `dist/docs/index.js` is fully self-contained
(no chunk imports) and pulls in zero roll-engine or notation-parse code, safe for
any bundling context. Modifier docs come from `src/docs/modifierDocData.ts` (pure
data); dice docs from `src/dice/index.ts`.

- `NOTATION_DOCS: Readonly<Record<string, NotationDoc>>` — every dice type and
  modifier, keyed by canonical notation shorthand (`'xDN'`, `'d%'`, `'L'`, `'!'`,
  `'R{..}'`, …)
- `MODIFIER_DOCS` / `DICE_DOCS` — modifier-only / dice-only subsets
- `NotationDoc`, `ModifierCategory` types

Source: `src/docs/modifierDocs.ts` derives the records from
`src/docs/modifierDocData.ts` (modifier docs) and `RANDSUM_DICE_SCHEMAS` (dice
docs); `src/docs/index.ts` re-exports. Keys are case-sensitive canonical
shorthand (`'L'`, not `'l'`), even though the parser is case-insensitive.

### `./trace` — roll result visualization

- `traceRoll(record: RollRecord): readonly RollTraceStep[]` — walk a single roll
  record's modifier history into ordered display steps. Always starts with a
  `kind: 'rolls'` step labeled `'Rolled'`; appends a `kind: 'finalRolls'` step
  when any modifier ran.
- `formatAsMath(rolls, delta?): string` — render a number array as a math
  expression (`"3 + 4 + 5 - 1"`).
- `RollTraceStep` — discriminated union on `kind`:
  `'rolls' | 'divider' | 'arithmetic' | 'finalRolls'`.

The trace subpath uses no Node-specific APIs and works in browser contexts.

## Notation API (from the barrel)

All native to this package (`src/notation/`). Public barrel surface:

- **Parsing:** `notation`, `isDiceNotation`, `validateNotation`,
  `notationToOptions`, `suggestNotationFix`
- **Transformers:** `optionsToNotation`, `optionsToDescription`,
  `modifiersToNotation`, `modifiersToDescription`
- **Tokenization:** `tokenize`

Comparison helpers (`parseComparisonNotation`, `hasConditions`,
`formatComparisonNotation`, `formatComparisonDescription`), `listOfNotations`,
`optionsToSidesFaces`, `TTRPG_STANDARD_DIE_SET`, `coreNotationPattern`, and
`formatHumanList` are **internal** — used within `src/`, not re-exported from the
barrel.

## Modifier system

`RANDSUM_MODIFIERS` in `src/modifiers/definitions.ts` is the single source of
truth for which modifiers exist and their execution priority order. `src/modifiers/index.ts`
re-exports it alongside `MODIFIER_ORDER`, `applyAllModifiers`, and
`validateModifiers` (from `src/modifiers/registry.ts`).

Execution priority order (19 modifiers):

```
cap, replace, reroll, explode, compound, penetrate, explodeSequence,
wildDie, unique, drop, keep, count, multiply, plus, minus,
integerDivide, modulo, sort, multiplyTotal
```

Each modifier's schema and behavior are **single-sourced**, split across two
files to keep the tokenize path free of roll-engine code:

- **`<mod>Schema`** (`NotationSchema`) lives in
  `src/notation/definitions/<mod>.ts` — the canonical, behavior-free source of
  regex pattern, `parse`, `toNotation`, and `toDescription`. This is the only
  copy; the parse/validate/tokenize path imports it directly (via
  `src/notation/parse/parseModifiers.ts` and
  `src/notation/transformers/modifiersToStrings.ts`).
- **`<mod>Modifier`** (`ModifierDefinition`) lives in `src/modifiers/<mod>.ts` —
  it **imports** `<mod>Schema` from `notation/definitions`, spreads it, and
  attaches only the dice-pool behavior (`apply`, `validate`, `requires*`,
  `mutatesRolls`). Used only by the roll path (`RANDSUM_MODIFIERS`). The registry
  reads `name` + behavior fields off the modifier; it never touches the schema's
  `parse`/`toNotation`/`toDescription`.

There is **no second schema copy**. (Historically `src/modifiers/<mod>.ts`
redefined the whole schema — pattern/parse/format plus a `docs` array — duplicating
`notation/definitions/<mod>.ts`; the two had already drifted. That duplication is
gone.)

Static notation **docs are pure data**, defined once in
`src/docs/modifierDocData.ts` (grouped per modifier: most own one surface, `drop`
owns `L`/`H`/`D{..}`, `keep` owns `K`/`KL`/`KM`, `reroll` owns `R{..}`/`ro{..}`,
`explodeSequence` owns `!s{..}`/`!i`/`!r`, and `count` owns the whole count family
`#{..}`/`S{..}`/`F{..}`/`ms{..}`). Docs are **not** carried on the schema or
modifier objects — that would leak ~4 KB of doc strings into `dist/tokenize.js`
(which imports the schemas to parse). `MODIFIER_DOCS_BY_NAME` re-establishes the
modifier→docs linkage explicitly.

To add a modifier:

1. Create `src/notation/definitions/<mod>.ts` exporting `<mod>Schema`
2. Create `src/modifiers/<mod>.ts` importing `<mod>Schema` and exporting
   `<mod>Modifier` (schema spread + behavior)
3. Register `<mod>Modifier` in `RANDSUM_MODIFIERS` (`src/modifiers/definitions.ts`)
4. Add a `<mod>Docs` group to `src/docs/modifierDocData.ts` — one entry per
   notation surface — and wire it into `MODIFIER_DOCS_BY_NAME` and
   `MODIFIER_NOTATION_DOCS`
5. Document the notation at https://notation.randsum.dev (`apps/rdn/`)

### Tokenize isolation invariant

The `./tokenize` subpath must never pull in modifier behaviors. Behaviors are
dice-pool manipulation functions, meaningless in a UI context. Isolation rests on
directory boundaries plus ESM tree-shaking:

- The tokenize path imports schemas only from `src/notation/definitions/`, never
  from `src/modifiers/` (which carry `apply`/`validate`). So the roll engine is
  never in the tokenize import graph.
- **Invariant:** a `notation/definitions/<mod>.ts` schema must not import any
  behavior-only symbol (nothing from `src/modifiers/**` or the roll pipeline).
- **Invariant:** doc data is heavy static strings, so it lives in
  `src/docs/modifierDocData.ts` — **never** on the schema objects the tokenize
  path imports. Attaching a `docs` array back onto a `notation/definitions`
  schema re-bloats `dist/tokenize.js` by ~3.5 KB (the whole doc dataset).

The `size-limit` gate on `dist/tokenize.js` (6.75 KB) is the enforcement check.
Verify after any modifier change:

```bash
bun run --filter @randsum/roller size
```

## Errors

`src/errors.ts` (and `./errors`) exports `ERROR_CODES` plus the full hierarchy —
all extend `RandsumError`:

- `RandsumError` — base; carries `code: ErrorCode` and optional `context`
- `NotationParseError` — unparseable notation; carries optional `suggestion`
- `ModifierError` — a modifier failed to apply
- `ValidationError` — input validation failed
- `RollError` — roll execution failed

There is **no `SchemaError`** in roller — that lives in `@randsum/games`.

## Type exports

All types use `export type`. From the barrel:

- `RollArgument<T>`, `RollerRollResult<T>`, `RollOptions<T>`, `RollConfig`, `RandomFn`
- `DiceNotation` and special-die notation types: `CustomFacesNotation`,
  `DrawDieNotation`, `FateDieNotation`, `GeometricDieNotation`, `PercentileDie`,
  `ZeroBiasNotation`
- `ModifierOptions` and per-modifier option types: `ComparisonOptions`,
  `CountOptions`, `DropOptions`, `KeepOptions`, `RerollOptions`, `ReplaceOptions`,
  `UniqueOptions`
- `RollRecord`, `RollRecord<T>`
- `ValidationResult`, `ValidationErrorInfo`
- `Token`, `TokenCategory`, `ModifierCategory`

Shared type definitions live in `src/types/` (`core.ts`, `modifiers.ts`,
`results.ts`, `index.ts`). The `NotationSchema` type lives in
`src/notation/schema.ts`.

## Internal architecture

```
src/
  index.ts          # Main barrel
  validate.ts       # validateNotation, isDiceNotation, notation, numeric validators
  tokenize.ts       # ./tokenize subpath entry
  errors.ts         # ERROR_CODES + RandsumError and its 4 subclasses
  roll/             # roll() entry, argument parsing, execution pipeline
    parseArguments.ts
    pipeline.ts
  modifiers/        # roll-path behavior; each file imports its schema + attaches apply/validate
    definitions.ts  # RANDSUM_MODIFIERS — single source of truth (existence + order)
    index.ts        # re-exports RANDSUM_MODIFIERS + registry helpers
    registry.ts     # MODIFIER_ORDER, applyAllModifiers, validateModifiers
    schema.ts       # ModifierContext, ModifierDefinition (= NotationSchema & ModifierBehavior)
    cap.ts, drop.ts, explode.ts, ...   # import <mod>Schema from notation/definitions + behavior
    shared/         # shared modifier helpers (e.g. explosion factory)
  dice/             # internal dice schema registry (DiceSchema not exported); pure doc data
  docs/
    modifierDocData.ts # pure static NotationDoc data (single source; grouped per modifier)
    modifierDocs.ts    # derives NOTATION_DOCS, MODIFIER_DOCS, DICE_DOCS from the data
    index.ts           # ./docs re-exports
  trace/            # ./trace — traceRoll, formatAsMath, RollTraceStep
  notation/         # native notation parsing/validation/tokenization
    comparison/     # {<3,>18} condition syntax
    definitions/    # schema-only, tokenize-safe sources
    parse/          # notationToOptions, listOfNotations
    transformers/   # options <-> notation/description
    schema.ts       # NotationSchema type + defineNotationSchema
    tokenize.ts, validateNotation.ts, isDiceNotation.ts, suggestions.ts, ...
  types/            # shared types: core.ts, modifiers.ts, results.ts, index.ts
  lib/              # comparison/, random/, utils/ + constants.ts, optionsValidation.ts (transformers live under notation/)
```

## Bundle size limits

`size-limit` in `package.json` enforces:

| File                  | Limit    |
| --------------------- | -------- |
| `dist/index.js`       | 13.25 KB |
| `dist/index.d.ts`     | 10 KB    |
| `dist/tokenize.js`    | 6.75 KB  |
| `dist/docs/index.js`  | 5.25 KB  |
| `dist/trace/index.js` | 1.1 KB   |

These budgets were tightened after schema unification removed the duplicated
modifier schemas (the main bundle previously shipped both copies) and moved docs
off the roll/tokenize paths: `dist/index.js` fell ~15.7 → 11.5 KB and
`dist/docs/index.js` ~10 → 4.5 KB.

A bump in `dist/tokenize.js` usually means a behavior leaked into the tokenize
path — trace the import graph from `src/tokenize.ts`.

## Commands

```bash
bun test                              # run tests (bun:test)
bun run test:coverage                 # tests with lcov coverage
bun run build                         # bunup — ESM + DTS
bun run typecheck                     # tsc --noEmit
bun run lint                          # eslint
bun run format / format:check         # biome
bun run size                          # size-limit
bun run check                         # build + typecheck + format:check + lint + test
```

Filter from the repo root: `bun run --filter @randsum/roller <script>`.

## What belongs here

Everything dice-notation and dice-rolling: notation parsing/validation/
formatting/tokenization, modifier schemas and behaviors, RNG, roll execution,
static notation docs, and roll-result trace visualization.

Game-specific interpretation (outcome tables, pool conditions, critical
thresholds) belongs in `packages/games/`. Do not add game logic here. New
notation primitives must be evaluated against ADR-006 (Notation Scope Boundary)
first.

## Publishing

Always `bun publish`, never `npm publish` (npm does not resolve `workspace:~`).
See the root `CLAUDE.md`.
