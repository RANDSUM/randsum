import type { RollHistory, RollParams } from '../../types'
import { coreSpreadRolls } from '../../lib'

export function generateInitialRolls({
  options
}: RollParams): RollHistory['initialRolls'] {
  const quantity = options.quantity ?? 1

  return coreSpreadRolls(quantity, options.sides)
}
