import { AllRollTables } from '../tables'
import type {
  SalvageUnionNumericTable,
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName,
  SalvageUnionTableType
} from '../types'
import type { RollRecord, RollResult, RollerRollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { customTableFaces } from './customTableFaces'

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): RollResult<SalvageUnionRollRecord, RollRecord<SalvageUnionTableListing | string>> {
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
  } = generateRoll(tableName)

  if (!result) {
    throw new Error('Failed to properly roll.')
  }
  const label = typeof result === 'string' ? result : result.label
  const description = typeof result === 'string' ? '' : result.description
  const hit = typeof result === 'string' ? result : result.hit
  return {
    rolls,
    result: {
      hit,
      label,
      description,
      table: AllRollTables[tableName],
      tableName,
      roll: total
    }
  }
}

function generateRoll(
  tableName: SalvageUnionTableName
): RollerRollResult<SalvageUnionTableListing | string> {
  const table = AllRollTables[tableName]
  const sides = isNumericTable(table)
    ? Object.values(table as SalvageUnionNumericTable)
    : customTableFaces.map(face => table[face])

  return roll({
    sides
  })
}

function isNumericTable(
  table: SalvageUnionTableType | SalvageUnionNumericTable
): table is SalvageUnionNumericTable {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].every(
    key => key in table
  )
}
