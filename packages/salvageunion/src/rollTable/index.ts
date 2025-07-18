import { AllRollTables, customTableFaces } from '../tables'
import type { SalvageUnionTableName, SalvageUnionTableResult } from '../types'
import { rollCustom } from '@randsum/roller'

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

  const baseResult = rollCustom(faces)

  return {
    rolls: [baseResult],
    result: {
      hit: baseResult.result.hit,
      label: baseResult.result.label,
      description: baseResult.result.description,
      table,
      tableName,
      roll: baseResult.rolls[0]?.total ?? 0
    }
  }
}
