import type { RandomFn } from '../../lib/random'
import { coreSpreadRolls } from '../../lib/random'
import type { RollParams, RollRecord } from '../../types'
import { generateHistory } from './generateHistory'

export function generateRollRecord<T>(parameters: RollParams<T>, rng?: RandomFn): RollRecord<T> {
  const { sides, quantity = 1, faces, arithmetic, description } = parameters
  const initialRolls = coreSpreadRolls(quantity, sides, rng)
  const isNegative = arithmetic === 'subtract'
  const customResults = faces
    ? { customResults: initialRolls.map(roll => faces[roll - 1] as T) }
    : {}
  const modifierHistory = generateHistory(parameters, initialRolls, rng)

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
