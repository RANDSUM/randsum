<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/blades</h1>
  <h3>Blades in the Dark dice mechanics for <a href="https://github.com/RANDSUM/randsum">@RANDSUM</a></h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/blades)](https://bundlephobia.com/package/@randsum/blades)
[![Types](https://img.shields.io/npm/types/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![License](https://img.shields.io/npm/l/@randsum/blades)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

Type-safe [Blades in the Dark](https://bladesinthedark.com/) action roll mechanics, built on [@RANDSUM](https://github.com/RANDSUM/randsum).

## Installation

```bash
npm install @randsum/blades
# or
bun add @randsum/blades
```

## Usage

```typescript
import { roll, rollFortune, rollResistance } from "@randsum/blades"
import type { BladesResult } from "@randsum/blades"

// Action roll (most common)
const { result } = roll({ rating: 2 })
console.log(result) // 'critical' | 'success' | 'partial' | 'failure'

// Desperate action (rating 0 — rolls 2d6, keeps lowest)
roll({ rating: 0 })

// Fortune roll
rollFortune({ quantity: 3 })

// Resistance roll
rollResistance({ rating: 2 })
```

## API Reference

### `roll(input?)`

Action roll. Rolls `rating` d6 dice and keeps the highest.

```typescript
function roll(input?: { rating?: number }): GameRollResult
```

- `rating` (default `1`): Action rating (0–4). At `0`, rolls 2d6 and keeps the lowest instead.

**Results:**

- `'critical'`: Two or more 6s in the pool
- `'success'`: Highest die is 6
- `'partial'`: Highest die is 4–5
- `'failure'`: Highest die is 1–3

### `rollFortune(input)`

Fortune roll. Rolls a pool of d6 dice and keeps the highest.

```typescript
function rollFortune(input: { quantity: number }): GameRollResult
```

Returns the same result strings as `roll`.

### `rollResistance(input?)`

Resistance roll. Determines how much harm is resisted.

```typescript
function rollResistance(input?: { rating?: number }): GameRollResult
```

**Results:**

- `'clearWithBenefit'`: Highest die is 6
- `'clear'`: Highest die is 4–5
- `'takeLesserHarm'`: Highest die is 1–3

```typescript
type BladesResult = "critical" | "success" | "partial" | "failure"
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
