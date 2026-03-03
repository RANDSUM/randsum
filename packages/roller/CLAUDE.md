# @randsum/roller - Core Dice Rolling Engine

## Overview

The core package provides the `roll()` function and dice notation parsing. All other packages depend on this.

## Main API

### `roll(...args: RollArgument[]): RollerRollResult`

Main entry point for rolling dice. Accepts number, notation string, options object, or multiple arguments (optionally followed by `RollConfig` for `randomFn`):

- **Number**: `roll(20)` - Roll 1d20 (quantity 1, sides = number)
- **Notation**: `roll("4d6L")` - Parse notation string
- **Options object**: `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })` - Same as 4d6L
- **Multiple arguments**: `roll("1d20", "2d6", "+5")` - Combine rolls into one total

```typescript
roll(20) // 1d20
roll("2d6+3") // 2d6 with +3
roll({ sides: 6, quantity: 2, modifiers: { plus: 3 } }) // same
roll("1d20", "2d6") // attack + damage, combined total
```

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

Modifiers are applied in priority order (lower number = earlier execution):

| Priority | Modifier       | Description                        |
| -------- | -------------- | ---------------------------------- |
| 10       | cap            | Limit roll values to a range       |
| 20       | drop           | Remove dice from pool              |
| 21       | keep           | Keep dice in pool                  |
| 30       | replace        | Replace specific values            |
| 40       | reroll         | Reroll dice matching conditions    |
| 50       | explode        | Roll additional dice on max        |
| 51       | compound       | Add explosion to existing die      |
| 52       | penetrate      | Add explosion minus 1 to die       |
| 60       | unique         | Ensure no duplicate values         |
| 85       | multiply       | Multiply dice sum (pre-arithmetic) |
| 90       | plus           | Add to total                       |
| 91       | minus          | Subtract from total                |
| 95       | countSuccesses | Count dice meeting threshold       |
| 100      | multiplyTotal  | Multiply entire final total        |

Modifier options are defined in `ModifierOptions` type. See `RANDSUM_DICE_NOTATION.md` for full syntax reference.

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
