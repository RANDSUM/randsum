<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/salvageunion</h1>
  <h3>Salvage Union dice mechanics for <a href="https://github.com/RANDSUM/randsum">@RANDSUM</a></h3>
  <p>Throw Dice, Not Exceptions.</p>

[![npm version](https://img.shields.io/npm/v/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/salvageunion)](https://bundlephobia.com/package/@randsum/salvageunion)
[![Types](https://img.shields.io/npm/types/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![License](https://img.shields.io/npm/l/@randsum/salvageunion)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)

</div>

Type-safe [Salvage Union](https://leyline.press/collections/salvage-union) d20 table-based mechanics, built on [@RANDSUM](https://github.com/RANDSUM/randsum).

## Installation

```bash
npm install @randsum/salvageunion
# or
bun add @randsum/salvageunion
```

## Usage

```typescript
import { roll } from "@randsum/salvageunion"
import type { SalvageUnionRollRecord } from "@randsum/salvageunion"

// Basic roll with default table (Core Mechanic)
const { result } = roll()
// result.label: human-readable outcome label
// result.description: outcome description
// result.roll: d20 value (1-20)

// Roll with specific table
const { result: moraleResult } = roll("Morale")

// Type-safe result handling
const { result: coreResult } = roll("Core Mechanic")
console.log(coreResult.label) // e.g. "Nailed It"
console.log(coreResult.description) // e.g. outcome details
console.log(coreResult.roll) // d20 result (1-20)
```

## API Reference

### `roll`

Makes a d20 roll following Salvage Union rules, returning a table result object with hit type, label, description, and roll value.

```typescript
function roll(tableName?: SalvageUnionTableName): {
  total: number
  result: SalvageUnionRollRecord
  rolls: RollRecord[]
}
```

### Roll Tables

The package includes all official Salvage Union roll tables, organized into collections:

#### PCTables

- `Core Mechanic`: Standard action resolution
- `Critical Damage`: Vehicle critical hits
- `Critical Injury`: Character injuries
- `Reactor Overload`: Mech reactor issues
- `Area Salvage`: Random salvage finds
- `Mech Salvage`: Salvageable mech parts

#### NPCTables

- `NPC Action`: Random NPC actions
- `Reaction`: NPC reactions to PCs
- `Morale`: NPC morale checks
- `Group Initiative`: Group combat initiative
- `Retreat`: NPC retreat behavior

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
