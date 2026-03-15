# @randsum/roller - Core Dice Rolling Engine

## Overview

The core package provides the `roll()` function and dice notation parsing. All other packages depend on this.

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

## Dice Notation Reference

Full spec: `RANDSUM_DICE_NOTATION.md` in this package. That file is the canonical reference for all notation syntax, modifier behavior, and options-object forms.

## Modifier System

The `RANDSUM_MODIFIERS` array in `src/lib/modifiers/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order. Each entry combines a `NotationSchema` (parsing, from `@randsum/notation`) with a `ModifierBehavior` (dice manipulation). See `RANDSUM_DICE_NOTATION.md` for the full priority table and syntax reference.

## Type Exports

All types are exported with `export type`:

- `RollArgument<T>` - Input type (includes `PercentileDie`, `FateDieNotation`)
- `RollerRollResult<T>` - Return type
- `RollOptions<T>` - Configuration options
- `ModifierOptions` - Modifier configuration
- `ValidationResult` - Validation output
- `DiceNotation` - Notation string type

## Internal Architecture

- `roll/` - Main roll function and argument parsing
- `lib/modifiers/` - Modifier definitions (schema + behavior) and registry
- `lib/random/` - Random number generation
- `lib/transformers/` - Options ↔ notation conversion
