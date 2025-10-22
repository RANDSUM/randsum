import type { RollTable, System } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { RollRecord, RollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'

function tableDataForTable(tableName: SalvageUnionTableName): RollTable['table'] | System['table'] {
  const table =
    tableName === 'Mechapult'
      ? SalvageUnionReference.Systems.findByName(tableName)
      : SalvageUnionReference.RollTables.findByName(tableName)

  if (!table) {
    throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
  }

  return table.table
}

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): RollResult<SalvageUnionRollRecord, RollRecord<SalvageUnionTableListing | string>> {
  const { total, rolls } = roll({
    sides: 20
  })

  const tableData = tableDataForTable(tableName)

  const [label, ...rest] = resultForTable(tableData, total).result.split(':')

  const description = rest.join(':').trim()

  return {
    rolls,
    result: {
      label: String(label).trim(),
      description,
      table: tableData,
      tableName,
      roll: total
    }
  }
}
