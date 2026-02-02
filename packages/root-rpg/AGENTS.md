# @randsum/root-rpg - Root RPG

## Game System

Root RPG is a tabletop RPG set in the world of Root board game. It uses a 2d6 + bonus mechanic with success thresholds similar to Powered by the Apocalypse games.

## Core Mechanics

- Roll 2d6 + stat modifier
- 10+ = strong hit (complete success)
- 7-9 = weak hit (partial success, success with cost)
- 6- = miss (failure)

## API

### `roll(bonus: number): GameRollResult<RootRpgRollResult, undefined, RollRecord>`

Rolls a Root RPG action roll.

**Parameters:**

- `bonus`: Number from -20 to +20 (validated)

**Returns:**

- `result`: `RootRpgRollResult` - Game-specific result
- `total`: Final roll total (2d6 + bonus)
- `rolls`: Array of `RollRecord` from core roller

## Result Structure

`RootRpgRollResult` includes:

- `hit`: `'Strong Hit' | 'Weak Hit' | 'Miss'` - Roll outcome
- `total`: Final roll total (2d6 + bonus)

## Result Interpretation

Outcome thresholds:

- **10+** - Strong Hit (complete success)
- **7-9** - Weak Hit (partial success, success with cost)
- **6-** - Miss (failure)

## Usage

```typescript
import { roll } from "@randsum/root-rpg"

// Basic roll with stat bonus
const result = roll(2)
// result.result.hit: 'Strong Hit' | 'Weak Hit' | 'Miss'

// Type-safe result handling
const { hit, total } = result.result
switch (hit) {
  case "Strong Hit":
    // Complete success
    break
  case "Weak Hit":
    // Partial success with cost
    break
  case "Miss":
    // Failure
    break
}
```

## Implementation Details

- Uses `createGameRoll` factory from `@randsum/roller`
- Always rolls 2d6
- Bonus validated to be finite and in range -20 to +20
- Uses `modifiers.plus` to add bonus
- Result interpretation via `interpretResult()` using thresholds
- Similar to PbtA mechanics but specific to Root RPG

## Type Exports

```typescript
export type { RootRpgRollResult } from "./types"
```

Game-specific types only, core types imported from `@randsum/roller` as needed.

## Testing

Test file: `__tests__/roll.test.ts`

Tests cover:

- Valid bonus ranges (-20 to +20)
- Invalid input validation (non-finite, out of range)
- Hit result interpretation (Strong Hit, Weak Hit, Miss)
- Edge cases (boundary values)
