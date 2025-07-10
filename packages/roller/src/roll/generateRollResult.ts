import { coreSpreadRolls } from '../lib'
import type { RollParams, RollResult } from '../types'
import { generateHistory } from './generateHistory'

export function generateRollResult(parameters: RollParams): RollResult {
  const { quantity = 1, sides } = parameters.options
  const initialRolls = coreSpreadRolls(quantity, sides)
  const history = generateHistory(parameters, initialRolls)

  return {
    parameters,
    description: parameters.description,
    history,
    rolls: history.modifiedRolls,
    total: history.total
  }
}
