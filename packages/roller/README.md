<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/roller</h1>
  <h3>TypeScript-First Dice Notation Ecosystem</h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/roller)](https://bundlephobia.com/package/@randsum/roller)
[![Types](https://img.shields.io/npm/types/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![License](https://img.shields.io/npm/l/@randsum/roller)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

TypeScript-first dice notation engine for JavaScript and TypeScript. Throw Dice, Not Exceptions.

## Installation

```bash
npm install @randsum/roller
# or
bun add @randsum/roller
```

## Usage

```typescript
import { roll } from "@randsum/roller"

// Three ways to roll: number, notation string, or options object
roll(20) // Roll 1d20
roll("4d6L") // Roll 4d6, drop lowest
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })

// Complex modifiers
roll("2d20L") // Advantage (drop lowest, keep highest)
roll("4d6!R{<3}") // Exploding dice, reroll below 3
roll("1d20+5", "2d6+3") // Multiple rolls combined
```

## CLI

```bash
npx @randsum/cli 2d20    # Roll two d20s
npx @randsum/cli 4d6L    # Roll 4d6, drop lowest
npx @randsum/cli 3d8+2   # Roll 3d8 and add 2
```

## API

### `roll(...args)`

The main function accepts numbers, notation strings, or options objects.

```typescript
const result = roll("2d6+3")

result.total // Final total after all modifiers
result.values // Array of individual die values
result.rolls // Full roll records with modifier history
```

`roll()` throws on invalid input. Wrap calls in try/catch:

```typescript
import { roll, RandsumError } from "@randsum/roller"

try {
  const result = roll(userInput)
  console.log(result.total)
} catch (e) {
  if (e instanceof RandsumError) {
    console.error(e.message)
  }
}
```

### Notation Reference

| Notation   | Description                 |
| ---------- | --------------------------- |
| `4d6`      | Roll 4 six-sided dice       |
| `4d6+2`    | Add 2 to total              |
| `4d6L`     | Drop lowest                 |
| `4d6H`     | Drop highest                |
| `2d20L`    | Drop lowest (advantage)     |
| `2d20H`    | Drop highest (disadvantage) |
| `4d6!`     | Exploding dice              |
| `4d6R{<3}` | Reroll values below 3       |
| `4d6U`     | Unique rolls only           |

See [RANDSUM_DICE_NOTATION.md](./RANDSUM_DICE_NOTATION.md) for the complete notation guide.

### Other Exports

```typescript
import {
  // Validation
  validateNotation,
  isDiceNotation,
  validateRollOptions,

  // Conversion utilities
  optionsToNotation,
  optionsToDescription,

  // Error types
  RandsumError,
  NotationParseError,
  ValidationError
} from "@randsum/roller"
```

## Related Packages

- [@randsum/games/blades](../../packages/games) - Blades in the Dark
- [@randsum/games/daggerheart](../../packages/games) - Daggerheart
- [@randsum/games/fifth](../../packages/games) - D&D 5th Edition
- [@randsum/games/root-rpg](../../packages/games) - Root RPG
- [@randsum/games/salvageunion](../../packages/games) - Salvage Union
- [@randsum/games/pbta](../../packages/games) - Powered by the Apocalypse

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
