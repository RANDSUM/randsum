import { AllRollTables } from './tables'
import * as SalvageUnionTypes from './types'
import { D20 } from '@randsum/dice'

function interpretHit(result: number): SalvageUnionTypes.Hit {
  switch (true) {
    case result === 20:
      return SalvageUnionTypes.Hit.nailedIt
    case result >= 11 && result <= 19:
      return SalvageUnionTypes.Hit.success
    case result >= 6 && result <= 10:
      return SalvageUnionTypes.Hit.toughChoice
    case result >= 2 && result <= 5:
      return SalvageUnionTypes.Hit.failure
    default:
      return SalvageUnionTypes.Hit.cascadeFailure
  }
}

function roll(
  tableName: SalvageUnionTypes.TableName = SalvageUnionTypes.TableName
    .coreMechanic
): [SalvageUnionTypes.TableResult, number] {
  const total = D20.roll()
  const hit = interpretHit(total)
  const table = AllRollTables[tableName]
  const result = table[hit]
  return [{ ...result, hit, table, tableName, roll: total }, total]
}

import * as tables from './tables'

export const SalvageUnion = { interpretHit, roll, tables }
