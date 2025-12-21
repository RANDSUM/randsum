# @randsum/root-rpg - Root RPG

## Game System

Root RPG uses 2d6 + bonus mechanic with success thresholds.

## API

### `rollRootRpg(bonus: number): RollResult<RootRpgRollResult>`

Rolls a Root RPG action roll.

**Parameters:**
- `bonus`: Number from -20 to +20 (validated)

**Returns:**
- `result`: `RootRpgRollResult` - Game-specific result
- `rolls`: Array of `RollRecord` from core roller

## Result Structure

`RootRpgRollResult` includes:
- `hit`: `boolean` - Whether roll succeeded
- `total`: Final roll total (2d6 + bonus)

## Success Threshold

Hit interpretation in `interpretResult()`:
- Total determines success/failure based on Root RPG mechanics
- Bonus added to 2d6 roll result

## Implementation Details

- Always rolls 2d6
- Bonus validated to be finite and in range -20 to +20
- Uses `modifiers.plus` to add bonus
- Result interpretation via `interpretResult()`

## Type Exports

```typescript
export type { RootRpgRollResult } from './types'
```

## Testing

Test file: `__tests__/rollRootRpg.test.ts`

Tests cover:
- Valid bonus ranges
- Invalid input validation
- Hit result interpretation

