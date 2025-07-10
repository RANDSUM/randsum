import { roll } from '@randsum/roller'
import { AllRollTables } from '../tables'
import type { SalvageUnionTableName, SalvageUnionTableResult } from '../types'
import { interpretHit } from './interpretHit'

export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): SalvageUnionTableResult {
  const total = roll(20).total
  const hit = interpretHit(total)
  const table = AllRollTables[tableName]
  const result = table[hit]
  return { ...result, hit, table, tableName, roll: total }
}
