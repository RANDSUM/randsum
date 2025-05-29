<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp">
  <h1>@randsum/salvageunion</h1>
  <h3>Salvage Union compatible dice rolling for randsum</h3>

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
import { rollSU } from '@randsum/salvageunion'
import type { Hit, TableResult } from '@randsum/salvageunion'

// Basic roll with modifier
const result = rollSU('Core Mechanic', 2)
// Returns table result with hit type and details

// Type-safe result handling
const { hit } = rollSU('Morale', -1)
switch (hit) {
  case 'Nailed It':
    // 20 or higher
    break
  case 'Success':
    // 15-19
    break
  case 'Tough Choice':
    // 10-14
    break
  case 'Failure':
    // 5-9
    break
  case 'Cascade Failure':
    // 4 or lower
    break
}
```

## API Reference

### `rollSU`

Makes a 2d10 roll following Salvage Union rules, returning both the interpreted result and table details.

```typescript
function rollSU(tableName: TableName, modifier: number): TableResult
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

- [@randsum/dice](https://github.com/RANDSUM/randsum/tree/main/packages/dice): Core dice rolling implementation
- [@randsum/notation](https://github.com/RANDSUM/randsum/tree/main/packages/notation): Dice notation parser

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
