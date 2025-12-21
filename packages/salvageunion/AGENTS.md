# @randsum/salvageunion - Salvage Union

## Game System

Salvage Union uses table-based mechanics with d20 rolls.

## API

### `rollTable(tableName?: SalvageUnionTableName): RollResult<SalvageUnionRollRecord>`

Rolls on a Salvage Union table.

**Parameters:**
- `tableName`: Optional table name (defaults to `'Core Mechanic'`)

**Returns:**
- `result`: `SalvageUnionRollRecord` - Table result with metadata
- `rolls`: Array of `RollRecord` from core roller

## Result Structure

`SalvageUnionRollRecord` includes:
- `key`: Table result key
- `label`: Result label
- `description`: Result description (if available)
- `table`: Full table data object
- `tableName`: Name of table rolled
- `roll`: d20 roll result (1-20)

## External Dependency

Uses `salvageunion-reference` package:
- `SalvageUnionReference.RollTables` - Available tables
- `resultForTable(tableData, roll)` - Lookup function

## Implementation Details

- Always rolls 1d20
- Validates table name exists in reference data
- Looks up result from table based on roll value
- Some tables have both label and value, others only value
- Result includes full table metadata for reference

## Type Exports

```typescript
export type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from './types'
```

## Testing

Test file: `__tests__/rollTable.test.ts`

Tests cover:
- Different table types
- Invalid table names
- Result structure validation

