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
```

`@randsum/roller/tokenize` is isolated — it does not pull in the roll engine, random number generation, or modifier registry. Use this subpath in UI components and form validators that need notation parsing without the full engine.

Comparison utilities (`parseComparisonNotation`, `hasConditions`, `formatComparisonNotation`, `formatComparisonDescription`) are available from the main barrel.

## Dice Notation Reference

Full spec: `RANDSUM_DICE_NOTATION.md` in this package. That file is the canonical reference for all notation syntax, modifier behavior, and options-object forms.

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

The `RANDSUM_MODIFIERS` array in `src/lib/modifiers/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order.

Each modifier is split into two parts, both living within this package:

- **Schema** (`src/notation/definitions/<mod>.ts`) — regex pattern, parse/format logic, priority. Defined using `defineNotationSchema`.
- **Behavior** (`src/lib/modifiers/behaviors/<mod>.ts`) — applies the modifier to dice rolls. Implements `ModifierBehavior`.
- **Combined** (`src/lib/modifiers/definitions/<mod>.ts`) — spreads schema and behavior into a `ModifierDefinition`.

To add a modifier:

1. Add the schema file in `src/notation/definitions/`
2. Add the behavior file in `src/lib/modifiers/behaviors/`
3. Add the combined definition in `src/lib/modifiers/definitions/`
4. Register it in `RANDSUM_MODIFIERS` in `src/lib/modifiers/definitions/index.ts`
5. Add the notation to `RANDSUM_DICE_NOTATION.md`

See `RANDSUM_DICE_NOTATION.md` for the full modifier priority table.

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

> Consumers who previously imported `RollResult` should use `RollerRollResult`. Consumers who previously imported `ValidValidationResult` or `InvalidValidationResult` should use `ValidationResult` (discriminated union on `valid: boolean`). Consumers who previously imported `RollParams`, `RequiredNumericRollParameters`, `ModifierLog`, `NumericRollBonus`, or `ModifierConfig` should use `ReturnType<typeof roll>` or construct the relevant types from the public surface.

## Internal Architecture

```
src/
  notation/          # Notation parsing, validation, tokenization, modifier schemas
    comparison/      # Comparison notation ({<3,>18} syntax)
    definitions/     # NotationSchema definitions — one per modifier
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
    modifiers/       # Modifier system (schema + behavior + registry)
      behaviors/     # ModifierBehavior implementations — one per modifier
      definitions/   # Combined ModifierDefinition — spreads schema + behavior
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

Game-specific interpretation (outcome tables, pool conditions, critical thresholds) belongs in `packages/games/`.

Do not add game-specific logic here. If a game mechanic requires new notation primitives, evaluate against ADR-006 (Notation Scope Boundary) first.
