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

A type-safe implementation of [Daggerheart](https://daggerheart.com/) dice.

## Installation

```bash
npm install @randsum/daggerheart
# or
yarn add @randsum/daggerheart
# or
bun add @randsum/daggerheart
```

## API Reference

### `rollDaggerheart`

Rolls a pair of Duality Dice for Daggerheart, returning the result type and total.

```typescript
function rollDaggerheart(options: DaggerheartRollArgument): DaggerheartRollResult
```

**Parameters:**

- `options`: Configuration for the roll
  - `modifier`: Number to add to both dice (default: 0)
  - `rollingWith`: Roll with advantage or disadvantage
  - `amplifyHope`: Use d20 instead of d12 for Hope die (default: false)
  - `amplifyFear`: Use d20 instead of d12 for Fear die (default: false)

We also export the `roll` function from `@randsum/roller` for your convenience.

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
