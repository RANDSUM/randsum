<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/fifth</h1>
  <h3>5th Edition compatible dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/fifth)](https://www.npmjs.com/package/@randsum/fifth)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/fifth)](https://bundlephobia.com/package/@randsum/fifth)
[![Types](https://img.shields.io/npm/types/@randsum/fifth)](https://www.npmjs.com/package/@randsum/fifth)
[![License](https://img.shields.io/npm/l/@randsum/fifth)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/fifth)](https://www.npmjs.com/package/@randsum/fifth)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

A type-safe implementation of 5th Edition d20 mechanics with advantage/disadvantage.

## Installation

```bash
npm install @randsum/fifth
# or
bun add @randsum/fifth
```

## Usage

```typescript
import { roll } from "@randsum/fifth"

// Basic roll with modifier
const result = roll({ modifier: 5 })

// Roll with advantage
roll({
  modifier: 5,
  rollingWith: "Advantage"
})

// Roll with disadvantage
roll({
  modifier: -2,
  rollingWith: "Disadvantage"
})

// Check against DC
const { total } = roll({ modifier: 5 })
const success = total >= 15 // DC 15 check
```

## API Reference

### `roll(options)`

```typescript
function roll(options: FifthRollArgument): FifthRollResult
```

**Options:**

| Parameter     | Type                            | Description                       |
| ------------- | ------------------------------- | --------------------------------- |
| `modifier`    | `number`                        | Bonus/penalty to add to roll      |
| `rollingWith` | `'Advantage' \| 'Disadvantage'` | Roll 2d20 and keep highest/lowest |

**Returns:**

```typescript
interface FifthRollResult {
  total: number
  result: "natural_20" | "natural_1" | "standard"
  details: { modifier: number }
  rolls: RollRecord[]
}
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller) - Core dice rolling

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
