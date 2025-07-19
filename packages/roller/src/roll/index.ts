import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'
import { calculateResultTotal } from './utils'

export function roll(...args: RollArgument[]): RollerRollResult {
  const parameters = args.flatMap((arg) => argToParameter(arg))
  const rolls = parameters.map((parameter) => generateRollRecord(parameter))
  const total = calculateResultTotal(rolls)

  return {
    rolls,
    result: total,
    total
  }
}
