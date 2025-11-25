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
  const {
    result: { label, value },
    key
  } = resultForTable(tableData, total)

  return {
    rolls,
    result: {
      key,
      label: label as string,
      description: value as string,
      table: tableData,
      tableName,
      roll: total
    }
  }
}
