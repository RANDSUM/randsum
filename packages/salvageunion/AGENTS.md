# @randsum/salvageunion - Salvage Union

## Game System

Salvage Union is a mech-based tabletop RPG that uses table-based mechanics with d20 rolls. The system uses roll-under mechanics where lower rolls are generally better.

## Core Mechanics

- Roll 1d20 against tables
- Lower is better (1 = critical success, 20 = critical failure)
- Results are looked up in reference tables
- Different tables for different game mechanics

## API

### `rollTable(tableName?: SalvageUnionTableName): GameRollResult<SalvageUnionRollRecord, undefined, RollRecord>`

Rolls on a Salvage Union table.

**Parameters:**

- `tableName`: Optional table name (defaults to `'Core Mechanic'`)

**Returns:**

- `result`: `SalvageUnionRollRecord` - Table result with metadata
- `total`: d20 roll result (1-20)
- `rolls`: Array of `RollRecord` from core roller

## Result Structure

`SalvageUnionRollRecord` includes:

- `key`: Table result key (internal identifier)
- `label`: Result label (human-readable)
- `description`: Result description (if available)
- `table`: Full table data object from reference
- `tableName`: Name of table that was rolled
- `roll`: d20 roll result (1-20)

## Result Interpretation

Result quality is determined by the roll value:

- **1** - Critical success ("Nailed It" on Core Mechanic)
- **2-10** - Success with complications ("Tough Choice" on Core Mechanic)
- **11-19** - Standard success ("Success" on Core Mechanic)
- **20** - Critical failure

## Usage

```typescript
import { rollTable } from "@randsum/salvageunion"

// Basic roll with default table (Core Mechanic)
const result = rollTable()

// Roll specific table
const result = rollTable("Morale")

// Access result details
const { label, description, roll } = result.result
```

## Available Tables

Tables are defined in the `salvageunion-reference` package. Common tables include:

- `'Core Mechanic'` - Main action resolution table
- `'Morale'` - Morale checks
- `'Quirks'` - Random quirks/features
- And many others...

## External Dependency

Uses `salvageunion-reference` package:

- `SalvageUnionReference.RollTables` - Available tables
- `resultForTable(tableData, roll)` - Lookup function

This package does not use the standard `createGameRoll` factory pattern because:

1. External library dependency for table lookups
2. Table lookup pattern differs from standard dice mechanics
3. Custom result structure includes table metadata

## Implementation Details

- Always rolls 1d20 via `@randsum/roller`
- Validates table name exists in reference data
- Looks up result from table based on roll value
- Some tables have both label and value, others only value
- Result includes full table metadata for reference
- Handles table result processing (label/value extraction)

## Type Exports

```typescript
export type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from "./types"
```

Game-specific types only, core types imported from `@randsum/roller` as needed.

## Testing

Test file: `__tests__/rollTable.test.ts`

Tests cover:

- Different table types
- Invalid table names
- Result structure validation
- Label and description extraction
