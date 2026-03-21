# @randsum/games

TTRPG game packages for the RANDSUM dice ecosystem. Each game subpath wraps [@randsum/roller](https://www.npmjs.com/package/@randsum/roller) with game-specific input validation, roll configuration, and result interpretation.

Built on `@randsum/roller`, which is **[RDN v1.0 Level 4 (Full) Conformant](https://notation.randsum.dev)**. All game packages use RANDSUM Dice Notation (RDN) for dice mechanics.

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

const { result } = roll(2)
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
    console.log(error.code) // 'INVALID_INPUT_TYPE'
  }
}
```

## Type Exports

Every subpath exports:

- `RollResult` -- the game-specific result type
- `GameRollResult` -- the full return type from `roll()`
- `RollRecord` -- raw dice data from the core roller
- `SchemaError` -- error class thrown on invalid input
- `SchemaErrorCode` -- union type of error codes

```typescript
import type { RollResult, GameRollResult, RollRecord } from "@randsum/games/blades"
import { SchemaError } from "@randsum/games/blades"
```

The salvageunion subpath also exports `VALID_TABLE_NAMES` (a const tuple of all table names) and `ROLL_TABLE_ENTRIES` (the full table data).

## Schema

The `@randsum/games/schema` subpath provides the JSON Schema definition, validator, and loader for `.randsum.json` spec files used to code-generate game packages.

```typescript
import { validateSpec, loadSpec } from "@randsum/games/schema"
```

## Documentation

Full documentation at [randsum.dev](https://randsum.dev/games/overview/).

## License

MIT
