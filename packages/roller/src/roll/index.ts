import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll(...args: RollArgument[]): RollerRollResult {
  const parameters = args.flatMap((arg) => argToParameter(arg))
  const rolls = parameters.map((parameter) => generateRollRecord(parameter))
  const total = rolls.reduce((acc, cur) => {
    const factor = cur.parameters.subtract ? -1 : 1
    const total = cur.total * factor
    return acc + total
  }, 0)
  return {
    rolls,
    result: total,
    total
  }
}
