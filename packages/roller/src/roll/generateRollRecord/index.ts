import { coreSpreadRolls } from '../../lib/utils'
import type { RollParams, RollRecord } from '../../types'
import { generateHistory } from './generateHistory'

export function generateRollRecord(parameters: RollParams): RollRecord {
  const { sides, quantity = 1, faces } = parameters
  const initialRolls = coreSpreadRolls(quantity, sides)
  const isNegative = parameters.arithmetic === 'subtract'
  const customResults = faces
    ? { customResults: initialRolls.map((roll) => String(faces[roll - 1])) }
    : {}
  const modifierHistory = generateHistory(parameters, initialRolls)

  return {
    ...customResults,
    parameters,
    description: parameters.description,
    modifierHistory,
    rolls: modifierHistory.modifiedRolls,
    appliedTotal: isNegative ? -modifierHistory.total : modifierHistory.total,
    total: modifierHistory.total
  }
}
