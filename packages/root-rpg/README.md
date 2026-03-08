<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/root-rpg</h1>
  <h3>Root RPG dice mechanics for <a href="https://github.com/RANDSUM/randsum">@RANDSUM</a></h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/root-rpg)](https://bundlephobia.com/package/@randsum/root-rpg)
[![Types](https://img.shields.io/npm/types/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![License](https://img.shields.io/npm/l/@randsum/root-rpg)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

Type-safe [Root RPG](https://magpiegames.com/collections/root) 2d6+bonus mechanics, built on [@RANDSUM](https://github.com/RANDSUM/randsum).

## Installation

```bash
npm install @randsum/root-rpg
# or
bun add @randsum/root-rpg
```

## Usage

```typescript
import { roll } from "@randsum/root-rpg"
import type { RootRpgResult } from "@randsum/root-rpg"

// Basic roll with bonus
const { result, total } = roll(2)
// result: 'Strong Hit' | 'Weak Hit' | 'Miss'
// total: numeric total (2d6 + bonus)

// Type-safe result handling
switch (result) {
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

### `roll`

Makes a 2d6 roll following Root RPG rules, returning an object with the interpreted result and numeric details.

```typescript
function roll(bonus: number): RootRpgRollResult
```

```typescript
type RootRpgResult = "Strong Hit" | "Weak Hit" | "Miss"
```

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
