<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  <h1>@randsum/5e</h1>
  <h3>5th Edition compatible dice rolling for randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/5e)](https://bundlephobia.com/package/@randsum/5e)
[![Types](https://img.shields.io/npm/types/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)
[![License](https://img.shields.io/npm/l/@randsum/5e)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)

</div>

A type-safe implementation of 5th Edition dice rolling mechanics that supports:

- 🎲 Standard d20 rolls with advantage/disadvantage
- 🎯 Automatic handling of modifiers
- 🔒 Full TypeScript support
- 🎮 Perfect for 5e compatible applications
- 🪶 Tree-shakeable implementation

## Installation

```bash
npm install @randsum/5e
# or
yarn add @randsum/5e
# or
bun add @randsum/5e
```

## Usage

```typescript
import { roll5e, meetOrBeat5e } from '@randsum/5e'
import type { RollArgument5e } from '@randsum/5e'

// Basic roll with modifier
roll5e({ modifier: 5 })

// Roll with advantage
roll5e({
  modifier: 5,
  rollingWith: 'Advantage'
})

// Roll with disadvantage
roll5e({
  modifier: -2,
  rollingWith: 'Disadvantage'
})

// Check if roll meets or beats DC
const roll: RollArgument5e = {
  modifier: 5,
  rollingWith: 'Advantage'
}
meetOrBeat5e(15, roll) // Returns true if roll meets or exceeds DC 15
```

## API Reference

### `roll5e`

Makes a d20 roll following 5th Edition rules.

```typescript
const result = roll5e({
  modifier: 5, // the result of your bonuses after all bonuses are applied
  rollingWith: 'Advantage' // Optional
})
// Returns a roll result with total and details
```

### `meetOrBeat5e`

Checks if a roll meets or exceeds a Difficulty Class (DC).

```typescript
const success = meetOrBeat5e(15, {
  modifier: 5,
  rollingWith: 'Advantage'
})
// Returns true if roll + modifier meets or exceeds 15
```

## Related Packages

- [@randsum/dice](https://github.com/RANDSUM/randsum/tree/main/packages/dice): Core dice rolling implementation
- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/packages/notation): Dice notation parser

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
