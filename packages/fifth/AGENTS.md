# @randsum/fifth - D&D 5th Edition

## Game System

Dungeons & Dragons 5th Edition uses a d20 system with ability modifiers, advantage/disadvantage mechanics, and skill checks.

## Core Mechanics

- Roll 1d20 + ability/skill modifier
- Advantage: Roll 2d20, keep highest (drop lowest)
- Disadvantage: Roll 2d20, keep lowest (drop highest)
- Natural 1 = automatic failure (critical miss)
- Natural 20 = automatic success (critical hit) on attacks

## API

### `actionRoll(arg: FifthRollArgument): GameRollResult<number, undefined, RollRecord>`

Rolls a D&D 5e action roll (attack, skill check, saving throw).

**Parameters:**

- `rollingWith`: `'Advantage' | 'Disadvantage' | undefined` - Optional advantage/disadvantage
- `modifier`: `number` - Ability/skill modifier (validated: -30 to +30)

**Returns:**

- `result`: `number` - Final roll total (d20 result + modifier)
- `total`: Final roll total
- `rolls`: Array of `RollRecord` from core roller

## Usage

```typescript
import { actionRoll } from "@randsum/fifth"

// Basic roll with modifier
const result = actionRoll({ modifier: 5 })
// result.result: 6-25 (1-20 + 5)

// With advantage
const result = actionRoll({
  modifier: 3,
  rollingWith: "Advantage"
})
// Rolls 2d20, drops lowest, adds 3

// With disadvantage
const result = actionRoll({
  modifier: -2,
  rollingWith: "Disadvantage"
})
// Rolls 2d20, drops highest, subtracts 2

// Common patterns
actionRoll({ modifier: 5 }) // Normal attack roll
actionRoll({ modifier: 2, rollingWith: "Advantage" }) // Advantage on skill check
actionRoll({ modifier: -1, rollingWith: "Disadvantage" }) // Disadvantage on save
```

## Common Patterns

### Ability Scores

```typescript
import { roll } from "@randsum/roller"

// Roll 4d6, drop lowest for each ability score (notation or options object)
roll("4d6L")
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }) // same as 4d6L
```

### Attack Rolls

```typescript
// Normal attack with +5 to hit
actionRoll({ modifier: 5 })

// Attack with advantage
actionRoll({ modifier: 5, rollingWith: "Advantage" })
```

### Skill Checks

```typescript
// Perception check with +3 Wisdom modifier
actionRoll({ modifier: 3 })

// Stealth check with disadvantage
actionRoll({ modifier: 2, rollingWith: "Disadvantage" })
```

## Implementation Details

- Uses `createGameRoll` factory from `@randsum/roller`
- Uses `generateQuantity()` to determine dice count:
  - Advantage/Disadvantage: 2 dice
  - Normal: 1 die
- Uses `generateModifiers()` to apply drop logic:
  - Advantage: `drop: { lowest: 1 }` (equivalent to `2d20L`)
  - Disadvantage: `drop: { highest: 1 }` (equivalent to `2d20H`)
- Always rolls d20
- Modifier validated to be finite and in range -30 to +30
- Modifier added via `modifiers.plus`

## Type Exports

```typescript
export type { FifthRollArgument, FifthAdvantageDisadvantage, FifthRollResult } from "./types"
```

Also re-exports core types from `@randsum/roller`:

- `roll`, `validateNotation`
- `RollArgument`, `RollerRollResult`, `ValidationResult`

## Testing

Test file: `__tests__/actionRoll.test.ts`

Tests cover:

- Advantage rolls (2d20 drop lowest)
- Disadvantage rolls (2d20 drop highest)
- Normal rolls (1d20)
- Modifier application
- Input validation (range checks)
- Integration with core roller
