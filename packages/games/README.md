# @randsum/games

TTRPG game packages for the RANDSUM dice ecosystem. Each game subpath wraps [@randsum/roller](https://www.npmjs.com/package/@randsum/roller) with game-specific input validation, roll configuration, and result interpretation.

ESM-only. The only dependency is `@randsum/roller`, which is **[RDN Level 4 (Full) Conformant](https://notation.randsum.dev)**. Game subpaths never depend on each other.

## Install

```bash
bun add @randsum/games
# or
npm install @randsum/games
```

## Available Games

| Subpath                       | Game System               | Dice              |
| ----------------------------- | ------------------------- | ----------------- |
| `@randsum/games/blades`       | Blades in the Dark        | 0-4d6 pool        |
| `@randsum/games/daggerheart`  | Daggerheart               | 2d12 Hope + Fear  |
| `@randsum/games/fate`         | Fate Core                 | 4dF + modifier    |
| `@randsum/games/fifth`        | D&D 5th Edition           | 1d20 + modifier   |
| `@randsum/games/pbta`         | Powered by the Apocalypse | 2d6 + stat        |
| `@randsum/games/root-rpg`     | Root RPG                  | 2d6 + bonus       |
| `@randsum/games/salvageunion` | Salvage Union             | 1d20 table lookup |

## Usage

```typescript
import { roll } from "@randsum/games/blades"

const { result } = roll(3)
// result: 'critical' | 'success' | 'partial' | 'failure'
```

```typescript
import { roll } from "@randsum/games/fifth"

const { result } = roll({ modifier: 5, rollingWith: "Advantage" })
// result: number (d20 + modifier)
```

```typescript
import { roll } from "@randsum/games/fate"

const { result } = roll({ modifier: 2 })
// result: ladder rung, e.g. 'Average' | 'Fair' | 'Good' | 'Great' | 'Superb' | ...
```

```typescript
import { roll } from "@randsum/games/pbta"

const { result } = roll({ stat: 2 })
// result: 'strong_hit' | 'weak_hit' | 'miss'
```

```typescript
import { roll } from "@randsum/games/daggerheart"

const { result } = roll({ modifier: 3 })
// result: 'hope' | 'fear' | 'critical hope'
```

```typescript
import { roll } from "@randsum/games/root-rpg"

const { result } = roll({ modifier: 2 })
// result: 'Strong Hit' | 'Weak Hit' | 'Miss'
```

```typescript
import { roll } from "@randsum/games/salvageunion"

const { result } = roll("Core Mechanic")
// result: { key, label, description, table, tableName, roll }
```

## Error Handling

All game subpaths throw `SchemaError` on invalid input:

```typescript
import { roll, SchemaError } from "@randsum/games/fifth"

try {
  roll({ modifier: Infinity })
} catch (error) {
  if (error instanceof SchemaError) {
    console.log(error.code) // e.g. 'INVALID_INPUT_TYPE'
  }
}
```

## Type Exports

Each subpath exports its own game-specific result type (e.g. `BladesRollResult`,
`FateRollResult`, `FifthRollResult`) plus the shared types:

- `GameRollResult` -- the full return type from `roll()`
- `RollRecord` -- raw dice data from the core roller
- `SchemaErrorCode` -- union type of error codes

and the value:

- `SchemaError` -- error class thrown on invalid input

```typescript
import { roll, SchemaError } from "@randsum/games/blades"
import type { BladesRollResult, GameRollResult, RollRecord } from "@randsum/games/blades"
```

The salvageunion subpath additionally exports the values `VALID_TABLE_NAMES` (a
const tuple of all table names) and `ROLL_TABLE_ENTRIES` (the full table data).

## Schema

The `@randsum/games/schema` subpath exposes the validator and code generator for
the `.randsum.json` spec files used to code-generate game packages:

```typescript
import {
  validateSpec,
  resolveExternalRefs,
  generateCode,
  specToFilename,
  lookupByRange,
  SchemaError
} from "@randsum/games/schema"
```

It also exports the spec types (`RandSumSpec`, `ValidationResult`, `ValidationError`,
`SchemaErrorCode`, and the spec-section types).

## Documentation

Full documentation at [randsum.dev](https://randsum.dev/games/overview/).

## License

MIT
