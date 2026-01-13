# @randsum/daggerheart - Daggerheart RPG

## Game System

Daggerheart uses hope and fear dice mechanics with advantage/disadvantage.

## API

### `rollDaggerheart(arg: DaggerheartRollArgument): RollResult<DaggerheartRollResult>`

Rolls a Daggerheart action roll.

**Parameters:**

- `rollingWith`: `'Advantage' | 'Disadvantage' | undefined`
- `amplifyHope`: `boolean` - Use d20 instead of d12 for hope
- `amplifyFear`: `boolean` - Use d20 instead of d12 for fear
- `modifier`: `number` - Additional modifier to total

**Returns:**

- `result`: `DaggerheartRollResult` - Game-specific result
- `rolls`: Array of `RollRecord` from core roller

## Result Structure

`DaggerheartRollResult` includes:

- `total`: Final roll total (includes modifier)
- `type`: Success type calculated from hope/fear comparison
- `details`:
  - `hope`: Hope die result (with amplification status)
  - `fear`: Fear die result (with amplification status)
  - `advantage`: Advantage/disadvantage die (if applicable)
  - `modifier`: Applied modifier

## Implementation Details

- Always rolls hope die (d12 or d20 if amplified)
- Always rolls fear die (d12 or d20 if amplified)
- Optionally rolls advantage/disadvantage die (d6, added or subtracted)
- Uses `key` parameter to identify each die in roll result
- Type determined by `calculateType()` comparing hope vs fear totals

## Type Exports

```typescript
export type {
  DaggerheartRollArgument,
  DaggerheartRollResult,
  DaggerheartRollResultType,
  DaggerheartAdvantageDisadvantage
} from "./types"
```

Also re-exports core types from `@randsum/roller`:

- `roll`, `validateNotation`
- `RollArgument`, `RollerRollResult`, `ValidationResult`

