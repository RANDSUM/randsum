import type { SURefObjectTable } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { RollRecord, RollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'

function tableDataForTable(tableName: SalvageUnionTableName): SURefObjectTable {
  const rollTable = SalvageUnionReference.RollTables.find(t => t.name === tableName)
  if (!rollTable?.table) {
    throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
  }

  return rollTable.table
}

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): RollResult<SalvageUnionRollRecord, RollRecord<SalvageUnionTableListing | string>> {
  const { total, rolls } = roll({
    sides: 20
  })

  const tableData = tableDataForTable(tableName)
  const tableResult = resultForTable(tableData, total)

  if (!tableResult.success) {
    throw new Error(`Failed to get result from table: "${tableName}"`)
  }

  const { result, key } = tableResult

  return {
    rolls,
    result: {
      key,
      label: result.label ?? '',
      description: result.value,
      table: tableData,
      tableName,
      roll: total
    }
  }
}
