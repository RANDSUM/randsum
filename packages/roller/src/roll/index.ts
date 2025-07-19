import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll(...args: RollArgument[]): RollerRollResult {
  const parameters = args.map((arg) => argToParameter(arg))
  const rolls = parameters.map((parameter) => generateRollRecord(parameter))
  const total = rolls.reduce((acc, cur) => acc + cur.total, 0)
  return {
    rolls,
    result: total,
    total
  }
}
