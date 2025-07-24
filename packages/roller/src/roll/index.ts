import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll<T = string>(...args: RollArgument<T>[]): RollerRollResult<T> {
  const parameters = args.flatMap(arg => argToParameter(arg))
  const rolls = parameters.map(parameter => generateRollRecord(parameter))
  const total = rolls.reduce((acc, cur) => {
    const factor = cur.parameters.arithmetic === 'subtract' ? -1 : 1
    return acc + cur.total * factor
  }, 0)

  const isCustom = rolls.every(roll => roll.customResults)
  const result = rolls.flatMap(roll =>
    isCustom ? (roll.customResults ?? []) : (roll.rolls.map(String) as T)
  )

  return {
    rolls,
    result,
    total
  }
}
