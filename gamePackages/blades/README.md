<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  <h1>@randsum/blades</h1>
  <h3>Blades in the Dark compatible dice rolling for randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/blades)](https://bundlephobia.com/package/@randsum/blades)
[![Types](https://img.shields.io/npm/types/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![License](https://img.shields.io/npm/l/@randsum/blades)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)

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
yarn add @randsum/blades
# or
bun add @randsum/blades
```

## Usage

```typescript
import { rollBlades } from '@randsum/blades'
import type { BladesResult } from '@randsum/blades'

// Basic roll with dice pool
const result = rollBlades(2)
// Returns the highest die result and determines outcome
```

## API Reference

### `rollBlades`

Makes a Blades in the Dark roll, returning the result based on the highest die.

```typescript
function rollBlades(dicePool: number): BladesResult
```

```typescript
type BladesResult = 'critical' | 'success' | 'partial' | 'failure'
```

## Related Packages

- [@randsum/dice](https://github.com/RANDSUM/randsum/tree/main/packages/dice): Core dice rolling implementation
- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/packages/notation): Dice notation parser

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
