# @randsum/blades - Blades in the Dark

## Game System

Forged in the Dark system. Dice pool mechanics with position/effect.

## API

### `roll(count: number): BladesRollResult`

Rolls a Blades in the Dark action roll.

**Parameters:**

- `count`: Number of dice in pool (typically 0-4, max 10)

**Returns:**

- `result`: `BladesResult` - Outcome type
- `total`: Sum of dice
- `rolls`: Array of `RollRecord` from core roller

## Result Interpretation

`BladesResult` type:

- `"critical"` - Two or more 6s (critical success)
- `"success"` - Highest die is 6 (full success)
- `"partial"` - Highest die is 4-5 (partial success/complication)
- `"failure"` - Highest die is 1-3 (bad outcome)

## Implementation Details

- Uses `@randsum/roller` core `roll()` function
- 0 dice pool: rolls 2d6 and drops highest (desperate position)
- 1+ dice pool: rolls that many d6
- Result determined by highest die via `interpretHit()`

## Type Exports

```typescript
export type { BladesResult } from "./types"
```

Game-specific types only, core types imported from `@randsum/roller` as needed.

## Testing

Test file: `__tests__/roll.test.ts`

Tests cover:

- Different dice pool sizes (0-10)
- Result interpretation
- Input validation (non-integer, negative, too large)
