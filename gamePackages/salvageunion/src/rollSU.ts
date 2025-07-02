import { D20 } from '@randsum/dice'
import { AllRollTables } from './tables'
import type { SUHit, SUTableName, SUTableResult } from './types'

function interpretHit(result: number): SUHit {
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

export function rollSU(
  tableName: SUTableName = 'Core Mechanic'
): [SUTableResult, number] {
  const total = D20.roll()
  const hit = interpretHit(total)
  const table = AllRollTables[tableName]
  const result = table[hit]
  return [{ ...result, hit, table, tableName, roll: total }, total]
}
