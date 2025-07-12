import type { RollParams, RollResult } from '../../types'
import { generateHistory } from './generateHistory'
import { generateInitialRolls } from './generateInitialRolls'

export function generateRollResult(parameters: RollParams): RollResult {
  const initialRolls = generateInitialRolls(parameters)
  const history = generateHistory(parameters, initialRolls)
  return {
    parameters,
    description: parameters.description,
    history,
    rolls: history.modifiedRolls,
    total: history.total
  }
}
