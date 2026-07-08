<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/roller</h1>
  <h3>A Zero Dependency, TypeScript-First, Bun-Native Dice Notation and Rolling Engine</h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/roller)](https://bundlephobia.com/package/@randsum/roller)
[![Types](https://img.shields.io/npm/types/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![License](https://img.shields.io/npm/l/@randsum/roller)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

A zero-dependency, TypeScript-first dice engine with native notation parsing,
validation, tokenization, and a 19-modifier roll pipeline. ESM-only.
Implements the [RANDSUM Dice Notation (RDN) specification](https://notation.randsum.dev).

## Installation

```bash
npm install @randsum/roller
# or
bun add @randsum/roller
```

ESM only — the package ships `dist/index.js` + `dist/index.d.ts` (no CommonJS
build). CJS consumers must use a bundler (esbuild, rollup, webpack 5+) that
translates ESM to CJS; direct `require()` is not supported.

## Usage

```typescript
import { roll } from "@randsum/roller"

// Number, notation string, or options object
roll(20) // 1d20
roll("4d6L") // 4d6, drop lowest
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }) // same as 4d6L

// Combine multiple arguments into one total
roll("1d20+5", "2d6+3") // attack + damage

// Custom RNG — RollConfig must be the LAST argument
roll("4d6L", { randomFn: myRandom })
```

## API

### `roll(...args)`

Accepts one or more roll arguments (a number, a notation string, or an options
object), optionally followed by a `RollConfig` (`{ randomFn }`) as the **last**
argument. Returns a `RollerRollResult`:

```typescript
const result = roll("2d6+3")

result.total // number — combined total after all modifiers
result.values // (number | T)[] — individual die values (3, 5, ...)
result.rolls // RollRecord[] — full per-pool records with modifier history
```

`values` is honest about what was rolled: numeric pools contribute actual
numbers, and custom-faced dice (`{ sides: ['+', '-', ' '] }`) contribute their
actual face values (`T`).

`roll()` throws on invalid input. Catch `RandsumError` (the base class) to handle
every RANDSUM error, or catch a subclass for specific handling:

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

### Error types

All extend `RandsumError`:

```typescript
import {
  RandsumError, // base — catch this to handle any RANDSUM error
  NotationParseError, // unparseable notation (carries an optional `suggestion`)
  ModifierError, // a modifier failed to apply
  ValidationError, // input validation failed
  RollError // roll execution failed
} from "@randsum/roller"
```

### Validation and conversion

```typescript
import {
  validateNotation, // (s: string) => ValidationResult — detailed result/errors
  isDiceNotation, // (s: string) => s is DiceNotation — type guard
  notation, // (s: string) => DiceNotation — assert valid or throw NotationParseError
  notationToOptions, // notation -> RollOptions
  optionsToNotation, // RollOptions -> notation string
  optionsToDescription, // RollOptions -> human-readable text
  suggestNotationFix // (s: string) => string | undefined — suggest a correction
} from "@randsum/roller"
```

### RDN reference

| Notation      | Description                                        |
| ------------- | -------------------------------------------------- |
| `4d6`         | Roll 4 six-sided dice                              |
| `d20`         | Bare `dN` — quantity omitted, equivalent to `1d20` |
| `4d6+2`       | Add 2 to the total                                 |
| `4d6L`        | Drop lowest                                        |
| `4d6H`        | Drop highest                                       |
| `4d6!`        | Exploding dice                                     |
| `4d6R{<3}`    | Reroll values below 3                              |
| `4d6R{<3}!`   | Reroll below 3, then explode                       |
| `4d6U`        | Unique rolls only                                  |
| `4d20C{>18}`  | Cap values above 18                                |
| `d%`          | Percentile (1d100)                                 |
| `4dF`         | Four Fate dice (-4 to +4)                          |
| `2d6+3[fire]` | Annotated roll                                     |

Modifiers run in a fixed priority order regardless of their position in the
source string, but the tokenizer still requires syntactically valid ordering
(e.g. `4d6R{<3}!`, not `4d6!R{<3}`). See the
[RANDSUM Dice Notation Specification](https://notation.randsum.dev) for the
complete reference, taxonomy, conformance levels, and modifier pipeline.

## Subpath exports

The package exposes focused subpaths so you can import only what you need:

| Subpath                    | Provides                                                                |
| -------------------------- | ----------------------------------------------------------------------- |
| `@randsum/roller`          | Barrel — `roll`, validation, conversion, errors, types                  |
| `@randsum/roller/roll`     | `roll` only                                                             |
| `@randsum/roller/errors`   | Error classes and `ERROR_CODES`                                         |
| `@randsum/roller/validate` | `validateNotation`, `isDiceNotation`, `notation`, numeric validators    |
| `@randsum/roller/tokenize` | `tokenize` — notation tokenizer, no roll engine                         |
| `@randsum/roller/docs`     | Static notation/modifier documentation data                             |
| `@randsum/roller/trace`    | Turn a `RollRecord` into a step-by-step display trace                   |
| `@randsum/roller/random`   | `createSeededRandom`, `createQueueRandom` — deterministic RNG factories |

**`@randsum/roller/tokenize`** — tokenizes notation without pulling in the roll
engine, RNG, or modifier behaviors. Use it in UI components and form validators.

```typescript
import { tokenize } from "@randsum/roller/tokenize"
import type { Token, TokenCategory } from "@randsum/roller/tokenize"
```

**`@randsum/roller/docs`** — static `NotationDoc` data describing every dice type
and modifier. Pure data, safe for any bundling context (browser, Node, edge).

```typescript
import { NOTATION_DOCS, MODIFIER_DOCS, DICE_DOCS } from "@randsum/roller/docs"
import type { NotationDoc } from "@randsum/roller/docs"

const dropLowest = NOTATION_DOCS["L"] // keyed by canonical notation shorthand
```

`NOTATION_DOCS` covers everything; `MODIFIER_DOCS` and `DICE_DOCS` are the
modifier-only and dice-only subsets.

**`@randsum/roller/trace`** — transform a `RollRecord` (from `roll().rolls[n]`)
into an ordered array of display steps.

```typescript
import { traceRoll, formatAsMath } from "@randsum/roller/trace"
import type { RollTraceStep } from "@randsum/roller/trace"

const result = roll("4d6L")
const steps = traceRoll(result.rolls[0]!)

formatAsMath([3, 4, 5]) // "3 + 4 + 5"
formatAsMath([3, 4, 5], -1) // "3 + 4 + 5 - 1"
```

`RollTraceStep` is a discriminated union on `kind`: `'rolls' | 'divider' | 'arithmetic' | 'finalRolls'`.

**`@randsum/roller/random`** — deterministic RNG factories for reproducible
rolls, seeded tests, and replayable sessions. Pass the result as `randomFn`.

```typescript
import { roll } from "@randsum/roller/roll"
import { createSeededRandom, createQueueRandom } from "@randsum/roller/random"

// Same seed → same sequence (negative seeds are normalized to valid faces).
roll("1d20", { randomFn: createSeededRandom(42) })

// Replay an exact sequence of die values.
roll("3d6", { randomFn: createQueueRandom({ sides: 6, rolls: [3, 5, 2] }) })
```

## Related packages

Game packages wrap this engine with system-specific interpretation:

- [@randsum/games/blades](../games) — Blades in the Dark
- [@randsum/games/daggerheart](../games) — Daggerheart
- [@randsum/games/fifth](../games) — D&D 5th Edition
- [@randsum/games/root-rpg](../games) — Root RPG
- [@randsum/games/salvageunion](../games) — Salvage Union
- [@randsum/games/pbta](../games) — Powered by the Apocalypse

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
