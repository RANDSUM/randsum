import type { RerollOptions } from '../../../types'
import { matchesComparison } from '../../comparisonUtils'

export function applyRerolling(
  rolls: number[],
  options: RerollOptions,
  rollOne: () => number
): number[] {
  const { max } = options
  let globalRerollCount = 0

  return rolls.map(roll => {
    if (max !== undefined && globalRerollCount >= max) {
      return roll // Don't reroll if we've hit the global limit
    }

    const result = rerollSingle(roll, options, rollOne)
    if (result !== roll) {
      globalRerollCount++
    }
    return result
  })
}

function rerollSingle(
  roll: number,
  options: RerollOptions,
  rollOne: () => number,
  attempt = 0
): number {
  if (attempt >= 99) {
    return roll
  }

  if (matchesComparison(roll, options)) {
    return rerollSingle(rollOne(), options, rollOne, attempt + 1)
  }

  return roll
}
