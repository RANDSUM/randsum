import type { System, Table } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { RollRecord, RollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'

function tableDataForTable(
  tableName: SalvageUnionTableName
): Table['rollTable'] | System['rollTable'] {
  const table =
    tableName === 'Mechapult'
      ? SalvageUnionReference.Systems.findByName(tableName)
      : SalvageUnionReference.Tables.findByName(tableName)

  if (!table) {
    throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
  }

  return table.rollTable
}

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): RollResult<SalvageUnionRollRecord, RollRecord<SalvageUnionTableListing | string>> {
  const { total, rolls } = roll({
    sides: 20
  })

  const tableData = tableDataForTable(tableName)
  const result = resultForTable(tableData, total)

  const label = typeof result === 'string' ? result : result.result
  const description = typeof result === 'string' ? '' : result.result
  return {
    rolls,
    result: {
      label,
      description,
      table: tableData,
      tableName,
      roll: total
    }
  }
}
