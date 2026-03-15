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
- `NdS!s{4,6,8}` - Explode through die size sequence
- `NdS!i` / `NdS!r` - Inflation/reduction explode (standard TTRPG set)
- `NdSU` - Unique results
- `NdSC{conditions}` - Cap values
- `NdSro{conditions}` - Reroll once (sugar for `R{...}1`)
- `NdSKM` / `NdSKMN` - Keep middle (sugar for drop lowest + highest)
- `NdSms{N}` - Margin of success (sugar for `-N`)
- `d{2,3,5,7}` - Custom dice faces
- `d{fire,ice,lightning}` - String-faced dice
- `zN` - Zero-bias die (0 to N-1)
- `d%` - Percentile die (1d100)
- `dF` / `dF.1` / `dF.2` - Fate/Fudge dice

## Modifier System

The `ALL_MODIFIERS` array in `src/lib/modifiers/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order. Each entry combines a `NotationSchema` (parsing, from `@randsum/notation`) with a `ModifierBehavior` (dice manipulation). Applied in priority order (lower = earlier):

| Priority | Modifier        | Description                        |
| -------- | --------------- | ---------------------------------- |
| 10       | cap             | Limit roll values to a range       |
| 20       | drop            | Remove dice from pool              |
| 21       | keep            | Keep dice in pool                  |
| 30       | replace         | Replace specific values            |
| 40       | reroll          | Reroll dice matching conditions    |
| 50       | explode         | Roll additional dice on max        |
| 51       | compound        | Add explosion to existing die      |
| 52       | penetrate       | Add explosion minus 1 to die       |
| 53       | explodeSequence | Explode through die size sequence  |
| 55       | wildDie         | D6 System wild die behavior        |
| 60       | unique          | Ensure no duplicate values         |
| 85       | multiply        | Multiply dice sum (pre-arithmetic) |
| 90       | plus            | Add to total                       |
| 91       | minus           | Subtract from total                |
| 92       | sort            | Sort results for display           |
| 93       | integerDivide   | Integer divide total               |
| 94       | modulo          | Total modulo N                     |
| 95       | countSuccesses  | Count dice meeting threshold       |
| 96       | countFailures   | Count dice at or below threshold   |
| 100      | multiplyTotal   | Multiply entire final total        |

Modifier options are defined in `ModifierOptions` type. See `RANDSUM_DICE_NOTATION.md` for full syntax reference.

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
- `lib/notation/` - Notation parsing
- `lib/modifiers/` - Modifier application logic
- `lib/random/` - Random number generation
- `lib/transformers/` - Options ↔ notation conversion
