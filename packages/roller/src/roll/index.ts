import type { RollArgument } from '../types/core'
import type { RollerRollResult } from '../types/roll'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll<T = string>(
  ...args: RollArgument<T>[]
): RollerRollResult<T> {
  const parameters = args.flatMap((arg) => argToParameter(arg))
  const rolls = parameters.map((parameter) => generateRollRecord(parameter))
  const total = rolls.reduce((acc, cur) => {
    const factor = cur.parameters.arithmetic === 'subtract' ? -1 : 1
    const t = cur.total * factor
    return acc + t
  }, 0)

  const isCustom = rolls.every((roll) => roll.customResults)

  return {
    rolls,
    result: rolls.flatMap((roll) =>
      isCustom ? (roll.customResults ?? []) : (roll.rolls.map(String) as T)
    ),
    total
  }
}
