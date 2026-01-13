import type { SURefObjectTable } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { RollRecord } from '@randsum/roller'
import { roll } from '@randsum/roller'
import type { GameRollResult } from '@randsum/shared'

function tableDataForTable(tableName: SalvageUnionTableName): SURefObjectTable {
  const rollTable = SalvageUnionReference.RollTables.find(t => t.name === tableName)
  if (!rollTable?.table) {
    throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
  }

  return rollTable.table
}

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): GameRollResult<
  SalvageUnionRollRecord,
  undefined,
  RollRecord<SalvageUnionTableListing | string>
> {
  const { total, rolls } = roll({
    sides: 20
  })

  const tableData = tableDataForTable(tableName)
  const tableResult = resultForTable(tableData, total)

  if (!tableResult.success) {
    throw new Error(`Failed to get result from table: "${tableName}"`)
  }

  // After success check, TypeScript should narrow but we need to help it
  // Access properties directly from tableResult which is now known to be success case
  const { result, key } = tableResult

  // Some tables have both label and value (e.g., Core Mechanic)
  // Others only have value (e.g., Quirks) - value becomes the label
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
