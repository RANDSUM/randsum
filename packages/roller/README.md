<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/roller</h1>
  <h3>Advanced Dice Rolling for JavaScript & TypeScript</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/roller)](https://bundlephobia.com/package/@randsum/roller)
[![Types](https://img.shields.io/npm/types/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![License](https://img.shields.io/npm/l/@randsum/roller)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)

</div>

A flexible, type-safe dice rolling implementation for tabletop RPGs, game development, and probability simulations that supports:

- 🎲 Standard dice notation (`4d6`, `2d20H`, etc.)
- 🎯 Complex modifiers (drop lowest, reroll, exploding dice)
- 🔒 Full TypeScript support with intelligent type inference
- 🎮 Perfect for games, RPGs, and simulations
- 🪶 Tree-shakeable implementation for minimal bundle size
- 📦 Optimized for performance and reliability
- 🧩 Extensible architecture for custom game systems
- 🌐 Works in Node.js, browsers, and React Native

## Installation

```bash
npm install @randsum/roller
# or
yarn add @randsum/roller
# or
bun add @randsum/roller
```

## CLI Usage

Roll dice directly from your terminal:

```bash
npx randsum 2d20    # Roll two twenty-sided dice
npx randsum 4d6L    # Roll 4d6, drop lowest
npx randsum 3d8+2   # Roll three d8s and add 2
```

Example output:

```text
🎲 Roll Result:
───────────────
Total: 24
Rolls: [14, 10]
Description: Roll 2d20
```

## Usage

```typescript
import { D, D20, D6, roll } from '@randsum/roller'

// Using premade dice
D20.roll() // Roll a d20
D6.roll(4) // Roll 4d6

// Create custom dice
const d12 = D(12)
d12.roll() // Returns number 1-12
d12.rollSpread(3) // Returns [n, n, n]

// Create dice with custom faces
const coin = D(['heads', 'tails'])
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
const d20 = D(20)
d20.roll() // Returns 1-20

// Create custom die
const colorDie = D(['red', 'blue', 'green'])
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

// Numeric Results (type: 'numeric')
const numericResult = roll('4d6')
// {
//   type: 'numeric',
//   result: [3, 4, 5, 2],
//   total: 14, // number
//   ...
// }

// Custom Results (type: 'custom')
const customResult = roll(D(['critical', 'hit', 'miss']))
// {
//   type: 'custom',
//   result: ['critical'],
//   total: 'critical', // string
//   ...
// }

// Mixed Results (type: 'mixed')
const mixedResult = roll(
  '2d6', // numeric dice
  D(['hit', 'miss']) // custom dice
)
// {
//   type: 'mixed',
//   result: [4, 6, 'hit'],
//   total: '10, hit', // string
//   ...
// }

// Custom-faced dice
roll(D(['critical', 'hit', 'miss']))
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

See [Dice Notation Reference](https://github.com/RANDSUM/randsum/blob/main/packages/roller/RANDSUM_DICE_NOTATION.md) for all supported modifiers.

## Bundle Size Optimization

This package is optimized for minimal bundle size and supports tree-shaking. For the smallest possible bundles, import only what you need:

```typescript
// ❌ Imports everything
import * as dice from '@randsum/roller'

// ✅ Only imports what you need
import { D20, roll } from '@randsum/roller'

// ✅ Best for tree-shaking - direct imports
import { D20 } from '@randsum/roller/premadeDice'
import { roll } from '@randsum/roller/roll'
```

## Use Cases

### Virtual Tabletop Applications

```typescript
import { roll } from '@randsum/roller'

// Handle player attack roll
function handleAttackRoll(characterLevel, strengthModifier, hasAdvantage) {
  const notation = hasAdvantage ? '2d20H' : '1d20'
  const attackRoll = roll(`${notation}+${strengthModifier}+${Math.floor(characterLevel / 2)}`)
  return {
    total: attackRoll.sum,
    critical: attackRoll.rolls.includes(20),
    fumble: attackRoll.rolls.includes(1)
  }
}
```

### Game Development

```typescript
import { D6, D20 } from '@randsum/roller'

class LootTable {
  generateLoot(playerLevel) {
    const rarity = this.determineRarity(playerLevel)
    return this.rollForItem(rarity)
  }

  private determineRarity(playerLevel) {
    const roll = D20.roll()
    if (roll >= 18 + Math.min(playerLevel, 10)) return 'legendary'
    if (roll >= 15) return 'rare'
    if (roll >= 10) return 'uncommon'
    return 'common'
  }

  private rollForItem(rarity) {
    // Implementation details...
  }
}
```

### Probability Simulations

```typescript
import { roll } from '@randsum/roller'

// Simulate 10,000 character stat rolls
function simulateStatRolls(iterations = 10000) {
  const results = []
  for (let i = 0; i < iterations; i++) {
    const stats = Array.from({ length: 6 }, () => roll('4d6L').sum)
    results.push(stats)
  }

  // Calculate average stat value
  const allStats = results.flat()
  const average = allStats.reduce((sum, stat) => sum + stat, 0) / allStats.length

  return {
    average,
    min: Math.min(...allStats),
    max: Math.max(...allStats)
    // Further analysis...
  }
}
```

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
