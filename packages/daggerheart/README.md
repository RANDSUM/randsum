<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/randsum/icon.webp" alt="Randsum Logo">
  <h1>@randsum/daggerheart</h1>
  <h3>Daggerheart dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/daggerheart)](https://www.npmjs.com/package/@randsum/daggerheart)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/daggerheart)](https://bundlephobia.com/package/@randsum/daggerheart)
[![Types](https://img.shields.io/npm/types/@randsum/daggerheart)](https://www.npmjs.com/package/@randsum/daggerheart)
[![License](https://img.shields.io/npm/l/@randsum/daggerheart)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/daggerheart)](https://www.npmjs.com/package/@randsum/daggerheart)

</div>

A type-safe implementation of [Daggerheart](https://daggerheart.com/) dice.

## Installation

```bash
npm install @randsum/daggerheart
# or
yarn add @randsum/daggerheart
# or
bun add @randsum/daggerheart
```

## Usage

```typescript
import { roll, meetOrBeat } from '@randsum/daggerheart'
import type { RollArgument } from '@randsum/daggerheart'

// Basic Hope and Fear roll
const result = roll({ modifier: 2 })
// result.type: 'hope' | 'fear' | 'critical hope'
// result.total: number (sum of both dice + modifier)
// result.rolls: { hope: number, fear: number, modifier: number }

// Roll with Advantage (adds d6 to total)
roll({
  modifier: 3,
  rollingWith: 'Advantage'
})

// Roll with Disadvantage (subtracts d6 from total)
roll({
  modifier: -1,
  rollingWith: 'Disadvantage'
})

// Check if roll meets or beats Difficulty Class
const rollArgs: RollArgument = {
  modifier: 4,
  rollingWith: 'Advantage'
}
const result = meetOrBeat(12, rollArgs)
// result.success: boolean
// result.description: string (formatted result description)
// result.target: number (the DC that was tested against)
```

## API Reference

### `roll`

Makes a Hope and Fear roll following Daggerheart rules.

```typescript
function roll(args: RollArgument): RollResult
```

**Parameters:**

- `args.modifier` (optional): Numeric modifier to add to the roll total
- `args.rollingWith` (optional): 'Advantage' or 'Disadvantage'

**Returns:**

- `type`: 'hope' (Hope > Fear), 'fear' (Fear > Hope), or 'critical hope' (Hope = Fear)
- `total`: Sum of both dice + modifier ± advantage/disadvantage d6
- `rolls`: Object containing individual Hope, Fear, and modifier values

### `meetOrBeat`

Checks if a Daggerheart roll meets or exceeds a Difficulty Class.

```typescript
function meetOrBeat(difficultyClass: number, rollArg: RollArgument): MeetOrBeatResult
```

**Parameters:**

- `difficultyClass`: The target number to meet or exceed
- `rollArg`: Roll arguments (same as `rollDH`)

**Returns:**

- All properties from `RollResultDH`, plus:
- `success`: `true` if roll meets/exceeds DC (Critical Hope always succeeds)
- `target`: The DC that was tested against
- `description`: Formatted description of the result

## Daggerheart Mechanics

## Type Definitions

```typescript
type AdvantageDisadvantageDH = 'Advantage' | 'Disadvantage'

interface RollArgumentDH {
  modifier?: number
  rollingWith?: AdvantageDisadvantageDH
}

type RollResultDHType = 'hope' | 'fear' | 'critical hope'

interface RollResultDH {
  type: RollResultDHType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
  }
}

interface MeetOrBeatResultDH extends RollResultDH {
  success: boolean
  target: number
  description: string
}
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
