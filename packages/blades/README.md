<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/blades</h1>
  <h3>Blades in the Dark compatible dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/blades)](https://bundlephobia.com/package/@randsum/blades)
[![Types](https://img.shields.io/npm/types/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![License](https://img.shields.io/npm/l/@randsum/blades)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

A utility for rolling dice in [Forged in the Dark](https://bladesinthedark.com/) systems!

- 🎲 Standard Blades in the Dark position and effect rolls
- 🎯 Automatic handling of dice pools
- 🔒 Full TypeScript support
- 🪶 Lightweight implementation

## Installation

```bash
npm install @randsum/blades
# or
bun add @randsum/blades
```

## Usage

```typescript
import { roll } from "@randsum/blades"
import type { BladesResult } from "@randsum/blades"

// Basic roll with dice pool
const { result } = roll(2)
console.log(result) // 'critical' | 'success' | 'partial' | 'failure'

// Different dice pool sizes
roll(0) // Zero-dice roll (2d6, drop highest — desperate action)
roll(1) // Single die
roll(2) // Two-dice pool
roll(3) // Three-dice pool
```

## API Reference

### `roll`

Makes a Blades in the Dark roll, returning the result based on the highest die.

```typescript
function roll(dicePool: number): BladesRollResult
```

**Parameters:**

- `dicePool`: Number of d6 dice to roll (typically 1-4)

**Returns:**

- `'critical'`: Two or more dice showing 6 (only possible with dice pool > 0)
- `'success'`: Highest die is 6
- `'partial'`: Highest die is 4–5
- `'failure'`: Highest die is 1–3

**Result Interpretation:**

```typescript
type BladesResult = "critical" | "success" | "partial" | "failure"
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
