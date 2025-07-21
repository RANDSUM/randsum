import type { RollArgument, RollerRollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollRecord } from './generateRollRecord'

export function roll(...args: RollArgument[]): RollerRollResult {
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
      isCustom ? (roll.customResults ?? []) : roll.rolls.map(String)
    ),
    total
  }
}
