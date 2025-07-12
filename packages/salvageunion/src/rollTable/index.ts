import { AllRollTables, customTableFaces } from '../tables'
import type { SalvageUnionTableName, SalvageUnionTableResult } from '../types'
import { rollCustom } from '@randsum/roller'

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): SalvageUnionTableResult {
  const table = AllRollTables[tableName]

  const faces = customTableFaces.map((face) => table[face])

  const rollResult = rollCustom(faces)

  return {
    ...rollResult.result,
    table,
    tableName,
    roll: rollResult.baseResult.total
  }
}
