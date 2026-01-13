# @randsum/fifth - D&D 5th Edition

## Game System

Dungeons & Dragons 5th Edition d20 system with advantage/disadvantage.

## API

### `actionRoll(arg: FifthRollArgument): RollerRollResult`

Rolls a D&D 5e action roll (attack, skill check, save).

**Parameters:**

- `rollingWith`: `'Advantage' | 'Disadvantage' | undefined`
- `modifier`: `number` - Ability/skill modifier

**Returns:**

- Standard `RollerRollResult` from core roller
- Total includes modifier

## Implementation Details

- Uses `generateQuantity()` to determine dice count:
  - Advantage/Disadvantage: 2 dice
  - Normal: 1 die
- Uses `generateModifiers()` to apply drop logic:
  - Advantage: `drop: { lowest: 1 }`
  - Disadvantage: `drop: { highest: 1 }`
- Always rolls d20
- Modifier added via `modifiers.plus`

## Type Exports

```typescript
export type { FifthRollArgument, FifthAdvantageDisadvantage } from "./types"
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

