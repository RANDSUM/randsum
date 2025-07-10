import type { RollArgument, RollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollResult } from './generateRollResult'

export function roll(arg: RollArgument): RollResult {
  const parameter = argToParameter(arg)
  return generateRollResult(parameter)
}
