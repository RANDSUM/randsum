import { D20 } from '@randsum/roller'
import { AllRollTables } from './tables'
import type { Hit, TableName, TableResult } from './types'

function interpretHit(result: number): Hit {
  switch (true) {
    case result === 20:
      return 'Nailed It'
    case result >= 11 && result <= 19:
      return 'Success'
    case result >= 6 && result <= 10:
      return 'Tough Choice'
    case result >= 2 && result <= 5:
      return 'Failure'
    default:
      return 'Cascade Failure'
  }
}

export function roll(
  tableName: TableName = 'Core Mechanic'
): [TableResult, number] {
  const total = D20.roll()
  const hit = interpretHit(total)
  const table = AllRollTables[tableName]
  const result = table[hit]
  return [{ ...result, hit, table, tableName, roll: total }, total]
}
