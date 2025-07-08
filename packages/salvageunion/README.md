<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/randsum/icon.webp" alt="Randsum Logo">
  <h1>@randsum/salvageunion</h1>
  <h3>Salvage Union compatible dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/salvageunion)](https://bundlephobia.com/package/@randsum/salvageunion)
[![Types](https://img.shields.io/npm/types/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![License](https://img.shields.io/npm/l/@randsum/salvageunion)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)

</div>

A type-safe implementation of [Salvage Union](https://www.geargrindergames.com/salvage-union) dice rolling mechanics that supports:

- 🎲 Standard 2d10 rolls with modifiers
- 🎯 Automatic outcome determination
- 📊 Built-in roll tables
- 🔒 Full TypeScript support
- 🪶 Tree-shakeable implementation

## Installation

```bash
npm install @randsum/salvageunion
# or
yarn add @randsum/salvageunion
# or
bun add @randsum/salvageunion
```

## Usage

```typescript
import { roll } from "@randsum/salvageunion"
import type { Hit, TableResult } from "@randsum/salvageunion"

// Basic roll with default table
const [result, rollValue] = roll()
// Returns table result with hit type and details

// Roll with specific table
const [result, rollValue] = roll("Morale")

// Type-safe result handling
const [{ hit }] = roll("Core Mechanic")
switch (hit) {
  case "Nailed It":
    // 20
    break
  case "Success":
    // 11-19
    break
  case "Tough Choice":
    // 6-10
    break
  case "Failure":
    // 2-5
    break
  case "Cascade Failure":
    // 1
    break
}
```

## API Reference

### `roll`

Makes a d20 roll following Salvage Union rules, returning both the interpreted result and roll value.

```typescript
function roll(tableName?: TableName): [TableResult, number]
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
