<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/root-rpg</h1>
  <h3>Root RPG compatible dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/root-rpg)](https://bundlephobia.com/package/@randsum/root-rpg)
[![Types](https://img.shields.io/npm/types/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![License](https://img.shields.io/npm/l/@randsum/root-rpg)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)

</div>

A small collection of utilities for [Root RPG](https://magpiegames.com/collections/root)!

- 🎲 Standard Root RPG (2d6+N) rolls
- 🎯 Automatic handling of modifiers
- 🔒 Full TypeScript support
- 🪶 smol (not larger than a wolf)

## Installation

```bash
npm install @randsum/root-rpg
# or
yarn add @randsum/root-rpg
# or
bun add @randsum/root-rpg
```

## Usage

```typescript
import { rollRootRpg } from "@randsum/root-rpg"
import type { RootRpgRollResult } from "@randsum/root-rpg"

// Basic roll with modifier
const { outcome, roll, result } = rollRootRpg(2)
// outcome: 'Strong Hit' | 'Weak Hit' | 'Miss'
// roll: numeric total, result: detailed roll information

// Type-safe result handling
const { outcome } = rollRootRpg(0)
switch (outcome) {
  case "Strong Hit":
    // 10 or higher
    break
  case "Weak Hit":
    // 7-9
    break
  case "Miss":
    // 6 or lower
    break
}
```

## API Reference

### `rollRootRpg`

Makes a 2d6 roll following Root RPG rules, returning an object with the interpreted result and numeric details.

```typescript
function rollRootRpg(bonus: number): RootRpgRollResult
```

```typescript
type RootResult = RootStrongHit | RootWeakHit | RootMiss
type RootStrongHit = "Strong Hit"
type RootWeakHit = "Weak Hit"
type RootMiss = "Miss"
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
