# @randsum/roller - Core Dice Rolling Engine

## Overview

The core package provides the `roll()` function, dice notation parsing, validation, and the full modifier system. All other packages depend on this one. `@randsum/roller` has zero runtime dependencies.

Notation parsing, validation, tokenization, and modifier schemas are **native to this package** — they live in `src/notation/` and are not imported from any external package.

## Main API

### `roll(...args: RollArgument[]): RollerRollResult`

Main entry point for rolling dice. Accepts number, notation string, options object, or multiple arguments (optionally followed by `RollConfig` for `randomFn`):

- **Number**: `roll(20)` - Roll 1d20 (quantity 1, sides = number)
- **Notation**: `roll("4d6L")` - Parse notation string
- **Options object**: `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })` - Same as 4d6L
- **Multiple arguments**: `roll("1d20+5", "2d6")` - Combine rolls into one total
- **Percentile**: `roll("d%")` - Roll 1d100 (no quantity prefix; use `roll("d%", "d%")` for multiple)
- **Fate/Fudge**: `roll("4dF")` - Four Fate dice (-4 to +4), `roll("dF.2")` - Extended variant (supports quantity prefix)

```typescript
roll(20) // 1d20
roll("2d6+3") // 2d6 with +3
roll({ sides: 6, quantity: 2, modifiers: { plus: 3 } }) // same
roll("1d20", "2d6") // attack + damage, combined total
roll("d%") // percentile (1d100)
roll("4dF") // Fate Core roll
```

### `validateNotation(notation: string): ValidationResult`

Validates dice notation syntax and returns parsed structure or error.

### `isDiceNotation(value: string): value is DiceNotation`

Type guard to check if string is valid dice notation. Recognizes all die types including special dice (`d%`, `dF`, `zN`, `gN`, `DDN`, `d{...}`).

## Subpath Exports

```typescript
import { roll } from "@randsum/roller" // main barrel — roll + all notation API
import { roll } from "@randsum/roller/roll" // roll function only
import { ValidationError } from "@randsum/roller/errors"
import { validateNotation, isDiceNotation } from "@randsum/roller/validate"
import { tokenize } from "@randsum/roller/tokenize" // notation tokenizer, no roll engine
import { NOTATION_DOCS, MODIFIER_DOCS, DICE_DOCS } from "@randsum/roller/docs"
import type { NotationDoc } from "@randsum/roller/docs"
import { traceRoll, formatAsMath } from "@randsum/roller/trace"
import type { RollTraceStep } from "@randsum/roller/trace"
```

`@randsum/roller/tokenize` is isolated — it does not pull in the roll engine, random number generation, or modifier registry. Use this subpath in UI components and form validators that need notation parsing without the full engine.

### `@randsum/roller/docs` — Static notation documentation

Exports static documentation data describing every RANDSUM dice type and modifier. Pure static data derived from the modifier and dice schema registries. Safe for any bundling context (browser, Node, edge).

**Exports:**

- `NOTATION_DOCS: Readonly<Record<string, NotationDoc>>` — documentation for every dice type and modifier, keyed by stable notation shorthand (e.g. `'xDN'`, `'d%'`, `'dF'`, `'L'`, `'H'`, `'!'`, `'R{..}'`)
- `MODIFIER_DOCS: Readonly<Record<string, NotationDoc>>` — modifier-only subset of `NOTATION_DOCS` (excludes dice types)
- `DICE_DOCS: Readonly<Record<string, NotationDoc>>` — dice-type-only subset of `NOTATION_DOCS` (excludes modifiers)
- `NotationDoc` type — primary type for all documentation entries

**`NotationDoc` shape:**

```typescript
interface NotationDoc {
  readonly key: string // stable record identifier (e.g. 'L', 'R{..}', 'xDN')
  readonly category: string // display category (see categories below)
  readonly title: string
  readonly description: string
  readonly color: string // dark-mode accent color (hex), e.g. '#fb7185'
  readonly colorLight: string // light-mode accent color (hex), e.g. '#e11d48'
  readonly displayBase: string // primary notation symbol(s), e.g. 'L', 'R{..}'
  readonly forms: readonly {
    readonly notation: string
    readonly note: string
  }[]
  readonly comparisons?: readonly {
    // present for condition-based modifiers
    readonly operator: string
    readonly note: string
  }[]
  readonly examples: readonly {
    readonly notation: string
    readonly description: string
  }[]
}
```

**Category values:**

Dice types use:

- `'Core'` — the fundamental `xDN` notation
- `'Special'` — special dice types (`d%`, `dF`, `zN`, `gN`, `DDN`, `d{...}`)

Modifiers use:

- `'Clamp'` — cap modifier (clamp individual die values)
- `'Map'` — replace modifier (map die values to new values)
- `'Filter'` — drop/keep modifiers (remove dice from pool)
- `'Substitute'` — reroll/unique modifiers (re-randomize dice)
- `'Generate'` — explode/explodeSequence modifiers (add dice to pool)
- `'Accumulate'` — compound/penetrate modifiers (accumulate into existing die)
- `'Scale'` — arithmetic modifiers (plus, minus, multiply, multiplyTotal, integerDivide, modulo)
- `'Reinterpret'` — count modifiers (replace sum with count)
- `'Dispatch'` — wildDie modifier (conditional dispatch)
- `'Order'` — sort modifier (ordering operations)

Every entry in `NOTATION_DOCS` has at least one `forms` entry and at least one `examples` entry. The `key` field is the stable identifier for display routing, filtering, and reference panels — use it instead of the record key (they match, but `key` is explicit). Keys are case-sensitive; the underlying notation parser is case-insensitive, but doc keys use the canonical shorthand from the notation spec (`'L'` not `'l'`).

**Example:**

```typescript
import { NOTATION_DOCS, MODIFIER_DOCS, DICE_DOCS } from "@randsum/roller/docs"

const dropLowest = NOTATION_DOCS["L"]
// { key: 'L', category: 'Filter', title: 'Drop Lowest', ... }

// All modifier docs
Object.entries(MODIFIER_DOCS).forEach(([key, doc]) => {
  console.log(key, doc.category, doc.title) // 'L' → 'Filter' → 'Drop Lowest', etc.
})

// All dice type docs
Object.entries(DICE_DOCS).forEach(([key, doc]) => {
  console.log(key, doc.category, doc.title) // 'xDN' → 'Core' → 'Core Roll', etc.
})
```

Bundle size limit: 20 KB (`dist/docs/index.js`).

### `@randsum/roller/trace` — Roll result trace visualization

Exports utilities for transforming a `RollRecord` (from `roll().rolls[n]`) into a step-by-step trace of how modifiers transformed the dice pool. Intended for display surfaces (tooltips, step-by-step result panels, roll histories).

**Exports:**

- `traceRoll(record: RollRecord): readonly RollTraceStep[]` — walk a single roll record's modifier history and return an ordered array of display steps
- `formatAsMath(rolls: readonly number[], delta?: number): string` — format a number array as a human-readable math expression (e.g. `"3 + 4 + 5 - 1"`)
- `RollTraceStep` type

**`RollTraceStep` discriminated union (discriminant: `kind`):**

```typescript
type RollTraceStep =
  | {
      kind: "rolls"
      label: string // human-readable modifier label, e.g. "Drop Lowest 1"
      unchanged: readonly number[] // dice that were not affected
      removed: readonly number[] // dice that were removed from the pool
      added: readonly number[] // dice that were added to the pool
    }
  | { kind: "divider" }
  | {
      kind: "arithmetic"
      label: string // e.g. "Add", "Subtract", "Multiply"
      display: string // e.g. "+5", "-2", "×3"
    }
  | {
      kind: "finalRolls"
      rolls: readonly number[] // the final dice pool after all pool modifiers
      arithmeticDelta: number // net arithmetic offset applied to the total
    }
```

**`traceRoll` step sequence rules:**

1. Always starts with a `kind: 'rolls'` step labeled `'Rolled'` showing the initial dice pool
2. For each modifier log entry in `record.modifierLogs`:
   - Arithmetic modifiers (`plus`, `minus`, `multiply`, `multiplyTotal`) produce a `kind: 'arithmetic'` step
   - `drop`/`keep` logs with both `lowest` and `highest` keys are split into two separate `kind: 'rolls'` steps
   - All other modifiers produce a single `kind: 'rolls'` step
3. If any modifier steps were produced, a `kind: 'finalRolls'` step is appended as the last step
4. If no modifiers were applied, the result is a single-element array containing only the initial `kind: 'rolls'` step

**`formatAsMath` behavior:**

- First element is emitted as a plain number string
- Subsequent elements are prefixed with `+ ` (positive) or `- ` (using the absolute value)
- `delta > 0` appends `+ delta` at the end
- `delta < 0` appends `- Math.abs(delta)` at the end
- `delta === 0` or omitted: no delta term appended

**Example:**

```typescript
import { roll } from "@randsum/roller"
import { traceRoll, formatAsMath } from "@randsum/roller/trace"

const result = roll("4d6L")
const steps = traceRoll(result.rolls[0]!)
// steps[0]: { kind: 'rolls', label: 'Rolled', unchanged: [3,4,2,5], removed: [], added: [] }
// steps[1]: { kind: 'rolls', label: 'Drop Lowest 1', unchanged: [3,4,5], removed: [2], added: [] }
// steps[2]: { kind: 'finalRolls', rolls: [3,4,5], arithmeticDelta: 0 }

formatAsMath([3, 4, 5]) // "3 + 4 + 5"
formatAsMath([3, 4, 5], -1) // "3 + 4 + 5 - 1"
formatAsMath([3, 4, 5], 2) // "3 + 4 + 5 + 2"
```

Bundle size limit: 5 KB (`dist/trace/index.js`). The trace subpath has no Node.js-specific APIs and works in browser contexts despite roller's `target: 'node'` bunup config.

Comparison utilities (`parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`, `formatComparisonDescription`) are available from the main barrel.

## Dice Notation Reference

The RANDSUM Dice Notation Specification lives at https://notation.randsum.dev — the authoritative reference for taxonomy, classification, conformance levels, syntax, and modifier behavior.

## Notation API

All notation functions are native to this package (`src/notation/`):

### Parsing

- `isDiceNotation(value: string): value is DiceNotation` — type guard
- `notation(value: string): DiceNotation` — assert valid notation or throw `NotationParseError`
- `validateNotation(notation: string): ValidationResult` — validate with detailed result/errors
- `notationToOptions(notation: DiceNotation): ParsedNotationOptions` — parse to options object
- `listOfNotations(input: string): DiceNotation[]` — split combined expression into individual notations
- `suggestNotationFix(notation: string): string | undefined` — suggest corrections for invalid input

### Transformers

- `optionsToNotation(options: RollOptions): DiceNotation` — options to notation string
- `optionsToDescription(options: RollOptions): string` — options to human-readable text
- `optionsToSidesFaces(options: RollOptions): number[]` — options to array of face values
- `modifiersToNotation(modifiers: ModifierOptions): string` — modifiers to notation suffix
- `modifiersToDescription(modifiers: ModifierOptions): string` — modifiers to readable text

### Tokenization

- `tokenize(notation: string): readonly Token[]` — parse notation into typed tokens for UI display

### Comparison Utilities

- `parseComparisonNotation(notation: string): ComparisonOptions` — parse `{<3,>18}` syntax
- `hasConditions(options: ComparisonOptions): boolean` — check for active conditions
- `formatComparisonNotation(options: ComparisonOptions): string[]` — format as notation parts array
- `formatComparisonDescription(options: ComparisonOptions): string[]` — format as text parts array

## Modifier System

The `RANDSUM_MODIFIERS` array in `src/modifiers/index.ts` is the single source of truth for which modifiers exist and their execution order.

Each modifier lives in a single co-located file under `src/modifiers/<mod>.ts`. Each file exports two named symbols:

- **`<mod>Schema`** (`NotationSchema`) — regex pattern, parse/format logic, priority. Used by the tokenize path and the roll path.
- **`<mod>Modifier`** (`ModifierDefinition`) — full modifier combining schema and dice pool behavior. Used only by the roll path.

To add a modifier:

1. Create `src/modifiers/<mod>.ts` — export `<mod>Schema` and `<mod>Modifier`
2. Register `<mod>Modifier` in `RANDSUM_MODIFIERS` in `src/modifiers/index.ts`
3. Document the notation at https://notation.randsum.dev (update `apps/rdn/src/content/specs/`)
4. Add a `docs: readonly NotationDoc[]` array to the `<mod>Schema` export — one entry per notation surface (e.g., drop has three: L, H, D{..}). Docs are co-located on the schema so adding a modifier is a single-file operation.

See `docs/adr/ADR-007-modifier-co-location.md` for the architectural rationale. See https://notation.randsum.dev for the full modifier priority table and faceted classification.

### Tokenize Isolation Invariant

The `@randsum/roller/tokenize` subpath must never import modifier behaviors. Behaviors are dice pool manipulation functions meaningless in a UI context; importing them into the tokenize bundle wastes bytes and couples a stateless parsing tool to the full roll engine.

Post-co-location, isolation is maintained by ESM tree-shaking rather than directory structure:

- Each modifier file in `src/modifiers/` exports two symbols: `<mod>Schema` (used by tokenize path) and `<mod>Modifier` (used only by roll path).
- The tokenize import graph reaches `<mod>Schema` by name and never references `<mod>Modifier`.
- ESM bundlers (esbuild, rollup, webpack 5+, Bun) statically eliminate `<mod>Modifier` from the tokenize bundle.
- The `size-limit` CI check on `dist/tokenize.js` is the enforcement gate. After any modifier addition or co-location refactor, verify the tokenize bundle size has not grown unexpectedly.

**The invariant:** `<mod>Schema` exports must not reference any behavior-only symbols at module initialization time. If a schema export imports from a behavior export within the same file, the module-level reference defeats tree-shaking and leaks the behavior into the tokenize bundle.

**Static display data (`docs`) does not violate the invariant.** Modifier schemas may carry a `docs` field containing static `NotationDoc` entries (string literals and plain objects). This is display metadata, not behavior — it contains no dice pool manipulation functions and has no runtime side effects. Because `docs` arrays are static content rather than behavior-only symbols, their presence in a `<mod>Schema` does not defeat tree-shaking and does not leak the roll engine into the tokenize bundle. The `size-limit` gate on `dist/tokenize.js` remains the authoritative check.

To verify isolation after a modifier change:

```bash
bun run --filter @randsum/roller size
```

If the `dist/tokenize.js` size entry fails, a behavior has leaked into the tokenize path. Trace the import graph from `src/tokenize.ts` to find the leak.

## Type Exports

All types are exported with `export type`:

- `RollArgument<T>` - Input type (includes `PercentileDie`, `FateDieNotation`)
- `RollerRollResult<T>` - Return type
- `RollOptions<T>` - Configuration options
- `ModifierOptions` - Modifier configuration
- `ValidationResult` - Validation output (discriminated union on `valid: boolean`)
- `ValidationErrorInfo` - Error details when validation fails
- `DiceNotation` - Notation string type
- `Token`, `TokenType` - Tokenizer output types
- `NotationSchema` - Modifier schema interface (from `src/notation/schema.ts`)
- `ComparisonOptions` - Comparison condition type
- `CountOptions`, `DropOptions`, `KeepOptions`, `RerollOptions`, `ReplaceOptions`, `UniqueOptions` - Modifier option types
- `RollRecord` - Individual roll record with full history
- `RandomFn`, `RollConfig` - Custom random function types
- `CustomFacesNotation`, `DrawDieNotation`, `FateDieNotation`, `GeometricDieNotation`, `PercentileDie`, `ZeroBiasNotation` — special die notation types

> `DiceSchema` is an internal type in `src/dice/index.ts` and is not exported from any public subpath.

> Consumers who previously imported `RollResult` should use `RollerRollResult`. Consumers who previously imported `ValidValidationResult` or `InvalidValidationResult` should use `ValidationResult` (discriminated union on `valid: boolean`). Consumers who previously imported `RollParams`, `RequiredNumericRollParameters`, `ModifierLog`, `NumericRollBonus`, or `ModifierConfig` should use `ReturnType<typeof roll>` or construct the relevant types from the public surface.

## Internal Architecture

```
src/
  modifiers/         # Modifier system — one file per modifier, co-located schema + behavior
    shared/
      explosion.ts   # createAccumulatingExplosionBehavior(strategy) factory
    index.ts         # RANDSUM_MODIFIERS array — the single source of truth
    cap.ts           # exports capSchema, capModifier
    drop.ts          # exports dropSchema, dropModifier
    explode.ts       # exports explodeSchema, explodeModifier
    ...              # one file per modifier
  dice/
    index.ts         # RANDSUM_DICE_SCHEMAS — internal registry of DiceSchema entries
                     # DiceSchema is an internal type (not exported); each entry carries a NotationDoc
  docs/
    modifierDocs.ts  # derives NOTATION_DOCS, MODIFIER_DOCS, DICE_DOCS from registries; exports NotationDoc
    index.ts         # re-exports from modifierDocs.ts
  notation/          # Notation parsing, validation, tokenization
    comparison/      # Comparison notation ({<3,>18} syntax)
    definitions/     # NotationSchema definitions — schema-only, tokenize-safe source
    parse/           # notationToOptions, listOfNotations
    transformers/    # Options-to-notation and options-to-description converters
    constants.ts     # TTRPG_STANDARD_DIE_SET
    coreNotationPattern.ts
    formatHumanList.ts
    isDiceNotation.ts
    schema.ts        # NotationSchema type and defineNotationSchema helper
    suggestions.ts
    tokenize.ts
    types.ts         # All shared notation/roll types
    validateNotation.ts
  lib/
    random/          # Random number generation
    transformers/    # Options <-> notation conversion used at roll time
    utils/           # Internal utilities
  roll/              # Main roll function and argument parsing
  errors.ts          # ValidationError, NotationParseError
  index.ts           # Main barrel
  validate.ts        # validateNotation, isDiceNotation, numeric validators
```

## What Belongs Here

Everything related to dice notation and dice rolling belongs in this package:

- Notation parsing, validation, formatting, tokenization
- Modifier schemas (pattern matching, parse/format logic)
- Modifier behaviors (dice pool manipulation)
- Random number generation
- Roll execution
- Modifier documentation (static data describing notation syntax and examples)
- Roll result visualization (transforming `RollRecord` into display-friendly traces)

Game-specific interpretation (outcome tables, pool conditions, critical thresholds) belongs in `packages/games/`.

Do not add game-specific logic here. If a game mechanic requires new notation primitives, evaluate against ADR-006 (Notation Scope Boundary) first.
