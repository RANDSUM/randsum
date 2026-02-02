<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/daggerheart</h1>
  <h3>Daggerheart dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/daggerheart)](https://www.npmjs.com/package/@randsum/daggerheart)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/daggerheart)](https://bundlephobia.com/package/@randsum/daggerheart)
[![Types](https://img.shields.io/npm/types/@randsum/daggerheart)](https://www.npmjs.com/package/@randsum/daggerheart)
[![License](https://img.shields.io/npm/l/@randsum/daggerheart)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/daggerheart)](https://www.npmjs.com/package/@randsum/daggerheart)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

A type-safe implementation of [Daggerheart](https://daggerheart.com/) Duality Dice mechanics.

## Installation

```bash
npm install @randsum/daggerheart
# or
bun add @randsum/daggerheart
```

## Usage

```typescript
import { roll } from "@randsum/daggerheart"

// Basic roll - Hope die (d12) + Fear die (d12)
const result = roll({})

console.log(result.total) // Combined total
console.log(result.result) // 'hope' | 'fear' | 'critical hope'

// With a modifier
const modified = roll({ modifier: 2 })

// With advantage (adds d6) or disadvantage (subtracts d6)
const withAdvantage = roll({ rollingWith: "Advantage" })
const withDisadvantage = roll({ rollingWith: "Disadvantage" })

// Amplified dice (d20 instead of d12)
const amplified = roll({
  amplifyHope: true, // Hope die becomes d20
  amplifyFear: true // Fear die becomes d20
})
```

## Result Types

Daggerheart uses **Duality Dice**: a Hope die and a Fear die. The result type is determined by which die rolls higher:

- **`'hope'`** - Hope die is higher (player narrates)
- **`'fear'`** - Fear die is higher (GM gains Fear)
- **`'critical hope'`** - Both dice show the same value (critical success)

```typescript
const { result, total, details } = roll({ modifier: 2 })

switch (result) {
  case "critical hope":
    console.log("Critical success!")
    break
  case "hope":
    console.log("Success with Hope")
    break
  case "fear":
    console.log("Success, but GM gains Fear")
    break
}

// Access individual dice
console.log(details.hope.roll) // Hope die value
console.log(details.fear.roll) // Fear die value
console.log(details.modifier) // Applied modifier
```

## API Reference

### `roll(options)`

```typescript
function roll(options: DaggerheartRollArgument): DaggerheartRollResult
```

**Options:**

| Parameter     | Type                            | Default | Description            |
| ------------- | ------------------------------- | ------- | ---------------------- |
| `modifier`    | `number`                        | `0`     | Added to the total     |
| `rollingWith` | `'Advantage' \| 'Disadvantage'` | -       | Adds or subtracts a d6 |
| `amplifyHope` | `boolean`                       | `false` | Use d20 for Hope die   |
| `amplifyFear` | `boolean`                       | `false` | Use d20 for Fear die   |

**Returns:**

```typescript
interface DaggerheartRollResult {
  total: number
  result: "hope" | "fear" | "critical hope"
  details: {
    hope: { roll: number; amplified: boolean }
    fear: { roll: number; amplified: boolean }
    modifier: number
    advantage: { roll: number } | undefined
  }
}
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller) - Core dice rolling

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
