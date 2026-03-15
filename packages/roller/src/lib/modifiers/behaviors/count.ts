import type { CountOptions } from '../../../types'
import type { ModifierBehavior } from '../schema'

function matchesAbove(roll: number, options: CountOptions): boolean {
  if (options.greaterThanOrEqual !== undefined && roll >= options.greaterThanOrEqual) return true
  if (options.greaterThan !== undefined && roll > options.greaterThan) return true
  return false
}

function matchesBelow(roll: number, options: CountOptions): boolean {
  if (options.lessThanOrEqual !== undefined && roll <= options.lessThanOrEqual) return true
  if (options.lessThan !== undefined && roll < options.lessThan) return true
  return false
}

function matchesExact(roll: number, options: CountOptions): boolean {
  if (options.exact?.includes(roll)) return true
  return false
}

export const countBehavior: ModifierBehavior<CountOptions> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        const aboveCount = currentRolls.filter(r => matchesAbove(r, options)).length
        const belowCount = currentRolls.filter(r => matchesBelow(r, options)).length
        const exactCount = currentRolls.filter(r => matchesExact(r, options)).length

        if (options.deduct) {
          return aboveCount + exactCount - belowCount
        }
        return aboveCount + belowCount + exactCount
      }
    }
  }
}
