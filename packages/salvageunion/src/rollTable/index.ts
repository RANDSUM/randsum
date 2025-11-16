import type { SURefMetaTable } from 'salvageunion-reference'
import { SalvageUnionReference, resultForTable } from 'salvageunion-reference'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName
} from '../types'
import type { RollRecord, RollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'

function tableDataForTable(tableName: SalvageUnionTableName): SURefMetaTable {
  if (tableName === 'Mechapult') {
    const system = SalvageUnionReference.Systems.find(sys => sys.name === tableName)
    if (!system || !system.actions[0]?.table) {
      throw new Error(`Invalid Salvage Union table name: "${tableName}"`)
    }
    return system.actions[0].table
  }

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
  const { result, key } = resultForTable(tableData, total)

  const [label, ...rest] = result.split(':')

  const description = rest.join(':').trim()

  return {
    rolls,
    result: {
      key,
      label: String(label).trim(),
      description,
      table: tableData,
      tableName,
      roll: total
    }
  }
}
