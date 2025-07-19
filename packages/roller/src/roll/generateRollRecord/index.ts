import { coreSpreadRolls } from '../../lib'
import type { RollParams, RollRecord } from '../../types'
import { generateHistory } from './generateHistory'

export function generateRollRecord(parameters: RollParams): RollRecord {
  const initialRolls = coreSpreadRolls(
    parameters.quantity ?? 1,
    parameters.sides
  )
  const modifierHistory = generateHistory(parameters, initialRolls)
  return {
    parameters,
    description: parameters.description,
    modifierHistory,
    rolls: modifierHistory.modifiedRolls,
    appliedTotal:
      parameters.arithmetic === 'subtract'
        ? -modifierHistory.total
        : modifierHistory.total,
    total: modifierHistory.total
  }
}
