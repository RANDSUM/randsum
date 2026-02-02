# @randsum/daggerheart - Daggerheart RPG

## Game System

Daggerheart is a fantasy tabletop RPG that uses unique hope and fear dice mechanics. Players roll both a Hope die and a Fear die, with the higher determining narrative outcomes and the sum determining mechanical success.

## Core Mechanics

- Roll 2d12: one Hope die and one Fear die
- Higher die determines narrative outcome
- Sum of both dice determines mechanical success
- Optional advantage/disadvantage die (d6, added or subtracted)
- Hope or Fear die can be amplified to d20
- Additional modifier can be added to total

## API

### `roll(arg: DaggerheartRollArgument): GameRollResult<DaggerheartRollResultType, DaggerheartRollDetails, RollRecord>`

Rolls a Daggerheart action roll.

**Parameters:**

- `rollingWith`: `'Advantage' | 'Disadvantage' | undefined` - Optional advantage/disadvantage
- `amplifyHope`: `boolean` - Use d20 instead of d12 for hope die
- `amplifyFear`: `boolean` - Use d20 instead of d12 for fear die
- `modifier`: `number` - Additional modifier to total

**Returns:**

- `result`: `DaggerheartRollResultType` - Success type
- `total`: Final roll total (includes modifier)
- `details`: `DaggerheartRollDetails` - Detailed roll information
- `rolls`: Array of `RollRecord` from core roller

## Result Structure

`DaggerheartRollResult` includes:

- `type`: `DaggerheartRollResultType` - Success type calculated from hope/fear comparison
- `total`: Final roll total (hope + fear + advantage/disadvantage + modifier)
- `details`:
  - `hope`: Hope die result with amplification status
  - `fear`: Fear die result with amplification status
  - `advantage`: Advantage/disadvantage die (if applicable)
  - `modifier`: Applied modifier

## Result Interpretation

Success type is determined by comparing Hope and Fear die values:

- Hope > Fear: Positive narrative outcome
- Fear > Hope: Negative narrative outcome
- Hope === Fear: Balanced outcome

Mechanical success is determined by the total (sum of all dice + modifier).

## Usage

```typescript
import { roll } from "@randsum/daggerheart"

// Basic roll
const result = roll({ modifier: 3 })

// With advantage
const result = roll({
  rollingWith: "Advantage",
  modifier: 5
})

// With amplified hope
const result = roll({
  amplifyHope: true,
  modifier: 2
})

// Full options
const result = roll({
  rollingWith: "Disadvantage",
  amplifyHope: true,
  amplifyFear: true,
  modifier: 4
})

// Access details
const { type, details } = result.result
const { hope, fear, advantage, modifier } = details
```

## Implementation Details

- Uses `createMultiRollGameRoll` factory from `@randsum/roller`
- Always rolls hope die (d12 or d20 if amplified)
- Always rolls fear die (d12 or d20 if amplified)
- Optionally rolls advantage/disadvantage die (d6, added or subtracted)
- Uses `key` parameter ('hope', 'fear', 'Advantage', 'Disadvantage') to identify each die
- Type determined by `calculateType()` comparing hope vs fear totals
- Modifier added after all dice are summed

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

## Testing

Test file: `__tests__/roll.test.ts`

Tests cover:

- Basic roll mechanics
- Advantage/disadvantage
- Hope/fear amplification
- Modifier application
- Result type calculation
