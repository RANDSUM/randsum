<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  <h1>@randsum/dice</h1>
  <h3>Core dice rolling implementation for randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/dice)](https://bundlephobia.com/package/@randsum/dice)
[![Types](https://img.shields.io/npm/types/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)
[![License](https://img.shields.io/npm/l/@randsum/dice)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)

</div>

A flexible, type-safe dice rolling implementation that supports:

- 🎲 Standard dice notation (`4d6`, `2d20H`, etc.)
- 🎯 Complex modifiers (drop lowest, reroll, exploding dice)
- 🔒 Full TypeScript support
- 🎮 Perfect for games, RPGs, and simulations
- 🪶 Tree-shakeable implementation

## Installation

```bash
npm install @randsum/dice
# or
yarn add @randsum/dice
# or
bun add @randsum/dice
```

## Usage

```typescript
import { D, D20, D6, roll } from '@randsum/dice'

// Using premade dice
D20.roll() // Roll a d20
D6.roll(4) // Roll 4d6

// Create custom dice
const d12 = new D(12)
d12.roll() // Returns number 1-12
d12.rollSpread(3) // Returns [n, n, n]

// Create dice with custom faces
const coin = new D(['heads', 'tails'])
coin.roll() // Returns "heads" or "tails"

// Using the roll function
roll('4d6L') // 4d6, drop lowest
roll('2d20H') // 2d20, keep highest
roll('4d6R{<3}') // 4d6, reroll values below 3
```

## Available Dice

- `D4`, `D6`, `D8`, `D10`, `D12`, `D20`, `D100`: Standard numeric dice
- `Coin`: Two-sided die with 'heads' and 'tails'
- `FudgeDice`: Fate/Fudge dice with +, -, and blank faces
- `AlphaNumDie`: Custom die with alphanumeric faces

## API Reference

### `D` Class

```typescript
// Create numeric die
const d20 = new D(20)
d20.roll() // Returns 1-20

// Create custom die
const colorDie = new D(['red', 'blue', 'green'])
colorDie.roll() // Returns random color
```

### `roll` Function

```typescript
// Basic rolls
roll(20) // Roll 1d20
roll('4d6') // Roll 4d6

// Using RollOptions object
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    drop: { lowest: 1 }, // Drop lowest roll
    plus: 2 // Add 2 to total
  }
})

// Multiple dice in one roll
roll('2d20', '4d6', '1d8') // Roll them all at once
roll(D20, D6, D8) // Using predefined dice
roll(
  {
    sides: 20,
    quantity: 2
  },
  {
    sides: 6,
    quantity: 4
  }
) // Using options objects

// Mix and match different argument types
roll(
  '2d20H', // Notation string, with modifiers
  D6, // Die instance
  {
    // Options object
    sides: 8,
    quantity: 2,
    modifiers: {
      explode: true // Exploding dice
    }
  },
  12 // Simple number (1d12)
)

// Different Result Types Examples:

// Numeric Results (type: 'numerical')
const numericResult = roll('4d6')
// {
//   type: 'numerical',
//   result: [3, 4, 5, 2],
//   total: 14, // number
//   ...
// }

// Custom Results (type: 'custom')
const customResult = roll(new D(['critical', 'hit', 'miss']))
// {
//   type: 'custom',
//   result: ['critical'],
//   total: 'critical', // string
//   ...
// }

// Mixed Results (type: 'mixed')
const mixedResult = roll(
  '2d6', // numeric dice
  new D(['hit', 'miss']) // custom dice
)
// {
//   type: 'mixed',
//   result: [4, 6, 'hit'],
//   total: '10, hit', // string
//   ...
// }

// Custom-faced dice
roll(new D(['critical', 'hit', 'miss']))
roll({
  sides: ['heads', 'tails'],
  quantity: 3
})

// With modifiers
roll('4d6L') // Drop lowest
roll('2d20H') // Keep highest
roll('3d8!') // Exploding dice
roll('4d6R{<3}') // Reroll values below 3
```

See [Dice Notation Reference](https://github.com/RANDSUM/randsum/blob/main/RANDSUM_DICE_NOTATION.md) for all supported modifiers.

## Related Packages

- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/packages/notation): Dice notation parser
- [@randsum/5E](https://github.com/RANDSUM/randsum/tree/main/packages/5E): 5th Edition compatible dice rolling

## License

MIT © Alex Jarvis
