import { AllRollTables } from '../tables'

import type { SalvageUnionTableName, SalvageUnionTableResult } from '../types'
import { roll } from '@randsum/roller'
import { customTableFaces } from './customTableFaces'

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): SalvageUnionTableResult {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (tableName && !AllRollTables[tableName]) {
    const availableTables = Object.keys(AllRollTables).join(', ')
    throw new Error(
      `Invalid Salvage Union table name: "${tableName}". Available tables: ${availableTables}`
    )
  }

  const table = AllRollTables[tableName]
  const faces = customTableFaces.map((face) => table[face])

  const {
    rolls,
    result: [result],
    total
  } = roll({ sides: faces })

  if (!result) {
    throw new Error('Failed to properly roll.')
  }

  return {
    rolls,
    result: {
      ...result,
      table,
      tableName,
      roll: total
    }
  }
}
