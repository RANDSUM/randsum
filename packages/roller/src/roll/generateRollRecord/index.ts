import { coreSpreadRolls } from '../../lib/random'
import type { RollParams, RollRecord } from '../../types/roll'
import { generateHistory } from './generateHistory'

export function generateRollRecord<T>(
  parameters: RollParams<T>
): RollRecord<T> {
  const { sides, quantity = 1, faces, arithmetic, description } = parameters
  const initialRolls = coreSpreadRolls(quantity, sides)
  const isNegative = arithmetic === 'subtract'
  const customResults = faces
    ? { customResults: initialRolls.map((roll) => faces[roll - 1] as T) }
    : {}
  const modifierHistory = generateHistory(parameters, initialRolls)

  return {
    ...customResults,
    parameters,
    description,
    modifierHistory,
    rolls: modifierHistory.modifiedRolls,
    appliedTotal: isNegative ? -modifierHistory.total : modifierHistory.total,
    total: modifierHistory.total
  }
}
