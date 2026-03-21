<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/roller</h1>
  <h3>A Zero Dependency, Typescript-First, Bun-Native Dice Notation and Rolling Engine</h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/roller)](https://bundlephobia.com/package/@randsum/roller)
[![Types](https://img.shields.io/npm/types/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![License](https://img.shields.io/npm/l/@randsum/roller)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

A Zero Dependency, Typescript-First, Bun-Native Dice Notation and Rolling Engine. Throw Dice, Not Exceptions.

**[RDN v1.0 Level 4 (Full) Conformant](https://notation.randsum.dev)** — implements the complete RANDSUM Dice Notation (RDN) Specification

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

### RDN Reference

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

See the [RANDSUM Dice Notation Specification](https://notation.randsum.dev) for the complete notation reference, taxonomy, and syntax guide.

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

### Subpath Exports

Use these subpaths to import only what you need without pulling in the full roll engine.

**`@randsum/roller/docs`** — Static modifier documentation. Zero dependencies, safe for any environment.

```typescript
import { MODIFIER_DOCS } from "@randsum/roller/docs"
import type { ModifierDoc } from "@randsum/roller/docs"

// Keyed by notation shorthand
const doc = MODIFIER_DOCS["L"] // Drop Lowest
const doc = MODIFIER_DOCS["!"] // Explode
const doc = MODIFIER_DOCS["R{..}"] // Reroll
```

**`@randsum/roller/trace`** — Transform a `RollRecord` into a step-by-step display trace.

```typescript
import { traceRoll, formatAsMath } from "@randsum/roller/trace"
import type { RollTraceStep } from "@randsum/roller/trace"

const result = roll("4d6L")
const steps = traceRoll(result.rolls[0]!)
// [
//   { kind: 'rolls', label: 'Rolled', unchanged: [...], removed: [], added: [] },
//   { kind: 'rolls', label: 'Drop Lowest 1', unchanged: [...], removed: [2], added: [] },
//   { kind: 'finalRolls', rolls: [...], arithmeticDelta: 0 }
// ]

formatAsMath([3, 4, 5]) // "3 + 4 + 5"
formatAsMath([3, 4, 5], -1) // "3 + 4 + 5 - 1"
```

`RollTraceStep` is a discriminated union on `kind`: `'rolls'` | `'divider'` | `'arithmetic'` | `'finalRolls'`.

**`@randsum/roller/tokenize`** — Notation tokenizer without the roll engine.

```typescript
import { tokenize } from "@randsum/roller/tokenize"
```

**`@randsum/roller/validate`** — Validation utilities only.

```typescript
import { validateNotation, isDiceNotation } from "@randsum/roller/validate"
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
