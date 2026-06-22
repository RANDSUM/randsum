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

| Subpath      | Source            | Provides                                                                   |
| ------------ | ----------------- | -------------------------------------------------------------------------- |
| `.`          | `src/index.ts`    | Barrel — `roll`, validation, conversion, errors, types, comparison helpers |
| `./roll`     | `src/roll/`       | `roll` only                                                                |
| `./errors`   | `src/errors.ts`   | Error classes + `ERROR_CODES`                                              |
| `./validate` | `src/validate.ts` | Validation + numeric validators                                            |
| `./tokenize` | `src/tokenize.ts` | `tokenize`, `Token`, `TokenType`, `TokenCategory`                          |
| `./docs`     | `src/docs/`       | `NOTATION_DOCS`, `MODIFIER_DOCS`, `DICE_DOCS`, `NotationDoc`               |
| `./trace`    | `src/trace/`      | `traceRoll`, `formatAsMath`, `RollTraceStep`                               |

There is **no `./comparison` subpath**. Comparison helpers
(`parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`,
`formatComparisonDescription`) are exported from the main barrel (ADR-009 folded
the old `./comparison` export into `.`).

### `./docs` — static notation documentation

Pure static `NotationDoc` data derived from the modifier and dice schema
registries; no roll engine, safe for any bundling context.

- `NOTATION_DOCS: Readonly<Record<string, NotationDoc>>` — every dice type and
  modifier, keyed by canonical notation shorthand (`'xDN'`, `'d%'`, `'L'`, `'!'`,
  `'R{..}'`, …)
- `MODIFIER_DOCS` / `DICE_DOCS` — modifier-only / dice-only subsets
- `NotationDoc`, `ModifierCategory` types

Source: `src/docs/modifierDocs.ts` derives the records; `src/docs/index.ts`
re-exports. Keys are case-sensitive canonical shorthand (`'L'`, not `'l'`), even
though the parser is case-insensitive.

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

All native to this package (`src/notation/`):

- **Parsing:** `notation`, `isDiceNotation`, `validateNotation`,
  `notationToOptions`, `listOfNotations`, `suggestNotationFix`
- **Transformers:** `optionsToNotation`, `optionsToDescription`,
  `optionsToSidesFaces`, `modifiersToNotation`, `modifiersToDescription`
- **Tokenization:** `tokenize`
- **Comparison:** `parseComparisonNotation`, `hasConditions`,
  `formatComparisonNotation`, `formatComparisonDescription`
- **Constants:** `TTRPG_STANDARD_DIE_SET`, `coreNotationPattern`, `formatHumanList`

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

Each modifier is one co-located file `src/modifiers/<mod>.ts` exporting two
symbols:

- **`<mod>Schema`** (`NotationSchema`) — regex pattern, parse/format logic,
  priority, and a co-located `docs` array. Used by both the tokenize path and the
  roll path.
- **`<mod>Modifier`** (`ModifierDefinition`) — full definition combining schema
  and dice-pool behavior. Used only by the roll path.

To add a modifier:

1. Create `src/modifiers/<mod>.ts` exporting `<mod>Schema` and `<mod>Modifier`
2. Register `<mod>Modifier` in `RANDSUM_MODIFIERS` (`src/modifiers/definitions.ts`)
3. Add a `docs` array to `<mod>Schema` — one entry per notation surface (e.g.
   drop has three: `L`, `H`, `D{..}`)
4. Document the notation at https://notation.randsum.dev (`apps/rdn/`)

### Tokenize isolation invariant

The `./tokenize` subpath must never pull in modifier behaviors. Behaviors are
dice-pool manipulation functions, meaningless in a UI context. Post-co-location,
isolation rests on ESM tree-shaking rather than directory structure:

- Each modifier file exports `<mod>Schema` (tokenize path) and `<mod>Modifier`
  (roll path only).
- The tokenize import graph references `<mod>Schema` by name and never
  `<mod>Modifier`, so bundlers eliminate the behavior from `dist/tokenize.js`.
- **Invariant:** a `<mod>Schema` must not reference any behavior-only symbol at
  module-init time, or the reference defeats tree-shaking and leaks the engine.
- Static `docs` data on a schema is display metadata, not behavior — it does not
  violate the invariant.

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
- `Token`, `TokenType`, `TokenCategory`, `ModifierCategory`

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
  modifiers/        # one file per modifier (co-located schema + behavior)
    definitions.ts  # RANDSUM_MODIFIERS — single source of truth (existence + order)
    index.ts        # re-exports RANDSUM_MODIFIERS + registry helpers
    registry.ts     # MODIFIER_ORDER, applyAllModifiers, validateModifiers
    schema.ts       # ModifierContext
    cap.ts, drop.ts, explode.ts, ...   # one file per modifier
    shared/         # shared modifier helpers (e.g. explosion factory)
  dice/             # internal dice schema registry (DiceSchema not exported)
  docs/
    modifierDocs.ts # derives NOTATION_DOCS, MODIFIER_DOCS, DICE_DOCS
    index.ts        # ./docs re-exports
  trace/            # ./trace — traceRoll, formatAsMath, RollTraceStep
  notation/         # native notation parsing/validation/tokenization
    comparison/     # {<3,>18} condition syntax
    definitions/    # schema-only, tokenize-safe sources
    parse/          # notationToOptions, listOfNotations
    transformers/   # options <-> notation/description
    schema.ts       # NotationSchema type + defineNotationSchema
    tokenize.ts, validateNotation.ts, isDiceNotation.ts, suggestions.ts, ...
  types/            # shared types: core.ts, modifiers.ts, results.ts, index.ts
  lib/              # random/, transformers/, utils/ (incl. validation.ts)
```

## Bundle size limits

`size-limit` in `package.json` enforces:

| File                  | Limit   |
| --------------------- | ------- |
| `dist/index.js`       | 16 KB   |
| `dist/index.d.ts`     | 10 KB   |
| `dist/tokenize.js`    | 6.75 KB |
| `dist/docs/index.js`  | 20 KB   |
| `dist/trace/index.js` | 5 KB    |

A bump in `dist/tokenize.js` usually means a behavior leaked into the tokenize
path — trace the import graph from `src/tokenize.ts`.

## Commands

```bash
bun test                              # run tests (bun:test)
bun run test:coverage                 # tests with lcov coverage
bun run build                         # bunup — ESM + DTS
bun run typecheck                     # tsc --noEmit
bun run lint                          # eslint
bun run format / format:check         # prettier
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
