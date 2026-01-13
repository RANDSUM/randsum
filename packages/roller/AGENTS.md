# @randsum/roller - Core Dice Rolling Engine

## Overview

The core package provides the `roll()` function and dice notation parsing. All other packages depend on this.

## Main API

### `roll(...args: RollArgument[]): RollerRollResult`

Main entry point for rolling dice. Accepts:

- Number: `roll(20)` - Roll 1d20
- String notation: `roll("4d6L")` - Parse notation
- Options object: `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })`
- Multiple arguments: `roll("1d20", "2d6", "+5")` - Combine rolls

### `validateNotation(notation: string): ValidationResult`

Validates dice notation syntax and returns parsed structure or error.

### `isDiceNotation(value: string): value is DiceNotation`

Type guard to check if string is valid dice notation.

## Dice Notation Reference

See `RANDSUM_DICE_NOTATION.md` in this package for complete syntax.

Key patterns:

- `NdS` - Basic roll (N dice, S sides)
- `NdS+X` - Add modifier
- `NdSL` - Drop lowest
- `NdSH` - Drop highest
- `NdSR{conditions}` - Reroll conditions
- `NdS!` - Exploding dice
- `NdSU` - Unique results
- `NdSC{conditions}` - Cap values

## Modifier System

Modifiers are applied in order: reroll → explode → replace → drop → cap → arithmetic

Modifier options are defined in `ModifierOptions` type:

- `reroll`: Conditional rerolling
- `explode`: Cascade rolling on max
- `replace`: Replace values
- `drop`: Remove dice from pool
- `cap`: Enforce value ranges
- `unique`: Ensure no duplicates
- `plus/minus`: Arithmetic adjustments

## Type Exports

All types are exported with `export type`:

- `RollArgument<T>` - Input type
- `RollerRollResult<T>` - Return type
- `RollOptions<T>` - Configuration options
- `ModifierOptions` - Modifier configuration
- `ValidationResult` - Validation output
- `DiceNotation` - Notation string type

## Internal Architecture

- `roll/` - Main roll function and argument parsing
- `lib/notation/` - Notation parsing
- `lib/modifiers/` - Modifier application logic
- `lib/random/` - Random number generation
- `lib/patterns/` - Regex patterns for parsing
- `lib/transformers/` - Options ↔ notation conversion

