<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  <h1>@randsum/5E</h1>
  <h3>5th Edition compatible dice rolling for randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/5E)](https://www.npmjs.com/package/@randsum/5E)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/5E)](https://bundlephobia.com/package/@randsum/5E)
[![Types](https://img.shields.io/npm/types/@randsum/5E)](https://www.npmjs.com/package/@randsum/5E)
[![License](https://img.shields.io/npm/l/@randsum/5E)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/5E)](https://www.npmjs.com/package/@randsum/5E)

</div>

A type-safe implementation of 5th Edition dice rolling mechanics that supports:

- 🎲 Standard d20 rolls with advantage/disadvantage
- 🎯 Automatic handling of modifiers
- 🔒 Full TypeScript support
- 🎮 Perfect for 5E compatible applications
- 🪶 Tree-shakeable implementation

## Installation

```bash
npm install @randsum/5E
# or
yarn add @randsum/5E
# or
bun add @randsum/5E
```

## Usage

```typescript
import { roll5E, meetOrBeat } from '@randsum/5E'
import type { RollArgument5E } from '@randsum/5E'

// Basic roll with modifier
roll5E({ modifier: 5 })

// Roll with advantage
roll5E({
  modifier: 5,
  rollingWith: 'Advantage'
})

// Roll with disadvantage
roll5E({
  modifier: -2,
  rollingWith: 'Disadvantage'
})

// Check if roll meets or beats DC
const roll: RollArgument5E = {
  modifier: 5,
  rollingWith: 'Advantage'
}
meetOrBeat(15, roll) // Returns true if roll meets or exceeds DC 15
```

## API Reference

### `roll5E`

Makes a d20 roll following 5th Edition rules.

```typescript
const result = roll5E({
  modifier: 5,
  rollingWith: 'Advantage' // Optional
})
// Returns a roll result with total and details
```

### `meetOrBeat`

Checks if a roll meets or exceeds a Difficulty Class (DC).

```typescript
const success = meetOrBeat(15, {
  modifier: 5,
  rollingWith: 'Advantage'
})
// Returns true if roll + modifier meets or exceeds 15
```

## Related Packages

- [@randsum/dice](https://github.com/RANDSUM/randsum/tree/main/packages/dice): Core dice rolling implementation
- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/packages/notation): Dice notation parser

## License

MIT © Alex Jarvis
