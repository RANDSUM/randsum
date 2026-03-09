import type { SURefObjectTable } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { GameRollResult, RollRecord } from '@randsum/roller'
import { roll as coreRoll } from '@randsum/roller'

/**
 * NOTE: This package does not use the createGameRoll factory pattern because:
 *
 * 1. External library dependency: The implementation requires integration with
 *    the `salvageunion-reference` library for table lookups, which doesn't fit
 *    the standard factory pattern focused on dice mechanics.
 *
 * 2. Table lookup pattern: The roll result is used as a lookup key for table
 *    resolution rather than being the primary game mechanic itself. The actual
 *    game logic is in the table lookup, not the dice roll.
 *
 * 3. Custom result structure: The result includes table-specific metadata
 *    (table data, table name, key, label, description) that extends beyond
 *    standard game roll interpretation.
 *
 * 4. Table processing logic: The implementation includes complex table result
 *    processing (label/value extraction, success checking) that is specific to
 *    the Salvage Union table system.
 *
 * This is more accurately a table lookup utility than a dice rolling mechanic,
 * and would benefit from a specialized table-based factory if such a pattern
 * emerges in other packages.
 */

function tableDataForTable(tableName: SalvageUnionTableName): SURefObjectTable {
  const rollTable = SalvageUnionReference.RollTables.find(t => t.name === tableName)
  if (!rollTable?.table) {
    throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
  }

  return rollTable.table
}

export function roll(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): GameRollResult<
  SalvageUnionRollRecord,
  undefined,
  RollRecord<SalvageUnionTableListing | string>
> {
  const { total, rolls } = coreRoll({
    sides: 20
  })

  const tableData = tableDataForTable(tableName)
  const tableResult = resultForTable(tableData, total)

  if (!tableResult.success) {
    throw new Error(`Failed to get result from table: "${tableName}"`)
  }

  const { result, key } = tableResult
  const resultTyped = result as { label?: string; value?: string }
  const label = resultTyped.label ?? resultTyped.value ?? ''
  const description = resultTyped.label ? (resultTyped.value ?? '') : ''

  return {
    rolls,
    total,
    result: {
      key,
      label,
      description,
      table: tableData,
      tableName,
      roll: total
    }
  }
}
