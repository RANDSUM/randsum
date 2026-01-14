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

A type-safe implementation of 5th Edition dice rolling mechanics that supports:

- 🎲 Standard d20 rolls with advantage/disadvantage
- 🎯 Automatic handling of modifiers
- 🔒 Full TypeScript support
- 🎮 Perfect for 5e compatible applications
- 🪶 Tree-shakeable implementation

## Installation

```bash
npm install @randsum/fifth
# or
yarn add @randsum/fifth
# or
bun add @randsum/fifth
```

## Usage

```typescript
import { roll } from "@randsum/fifth"
import type { RollArgument } from "@randsum/fifth"

// Basic roll with modifier
roll({ modifier: 5 })

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

// Check if roll meets or beats DC
const rollArg: RollArgument = {
  modifier: 5,
  rollingWith: "Advantage"
}
const result = roll(rollArg)
const success = result.total >= 15 // Check if roll meets or exceeds DC 15
```

## API Reference

### `d20Roll`

Makes a d20 roll following 5th Edition rules.

```typescript
const result = d20Roll({
  modifier: 5, // the result of your bonuses after all bonuses are applied
  rollingWith: "Advantage" // Optional
})
// Returns a roll result with total and details
```

We also export the `roll` function from `@randsum/roller` for your convenience.

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
