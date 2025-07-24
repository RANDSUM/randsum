import { AllRollTables } from '../tables'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName,
  SalvageUnionTableType
} from '../types'
import type { RollRecord, RollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { customTableFaces } from './customTableFaces'

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): RollResult<SalvageUnionRollRecord, RollRecord<SalvageUnionTableListing>> {
  if (!(AllRollTables[tableName] as undefined | SalvageUnionTableType)) {
    const availableTables = Object.keys(AllRollTables).join(', ')
    throw new Error(
      `Invalid Salvage Union table name: "${tableName}". Available tables: ${availableTables}`
    )
  }

  const {
    rolls,
    result: [result],
    total
  } = roll({
    sides: customTableFaces.map(face => AllRollTables[tableName][face])
  })

  if (!result) {
    throw new Error('Failed to properly roll.')
  }
  return {
    rolls,
    result: {
      ...result,
      table: AllRollTables[tableName],
      tableName,
      roll: total
    }
  }
}
