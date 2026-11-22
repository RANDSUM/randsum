import type { CountOptions } from '../notation/types'
import { countSchema } from '../notation/definitions/count'
import { ModifierError } from '../errors'
import { matchesComparison } from '../lib/comparison/matchesComparison'
import type { ModifierDefinition } from './schema'

export const countModifier: ModifierDefinition<CountOptions> = {
  ...countSchema,
  mutatesRolls: false as const,

  validate: options => {
    if (!options.deduct) return
    // In deduct mode a die is a success or a failure, never both: the highest
    // value that fails must be below the lowest value that succeeds.
    const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } = options
    const successes = [
      ...(greaterThan !== undefined ? [greaterThan + 1] : []),
      ...(greaterThanOrEqual !== undefined ? [greaterThanOrEqual] : []),
      ...(exact ?? [])
    ]
    const failures = [
      ...(lessThan !== undefined ? [lessThan - 1] : []),
      ...(lessThanOrEqual !== undefined ? [lessThanOrEqual] : [])
    ]
    if (successes.length === 0 || failures.length === 0) return
    const threshold = Math.min(...successes)
    const botchThreshold = Math.max(...failures)
    if (botchThreshold >= threshold) {
      throw new ModifierError(
        'count',
        `botchThreshold (${botchThreshold}) must be less than threshold (${threshold})`,
        { path: 'modifiers.count', value: options }
      )
    }
  },

  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        if (options.deduct) {
          const aboveOptions = {
            ...(options.greaterThan !== undefined ? { greaterThan: options.greaterThan } : {}),
            ...(options.greaterThanOrEqual !== undefined
              ? { greaterThanOrEqual: options.greaterThanOrEqual }
              : {}),
            ...(options.exact !== undefined ? { exact: options.exact } : {})
          }
          const belowOptions = {
            ...(options.lessThan !== undefined ? { lessThan: options.lessThan } : {}),
            ...(options.lessThanOrEqual !== undefined
              ? { lessThanOrEqual: options.lessThanOrEqual }
              : {})
          }
          const aboveCount = currentRolls.filter(r => matchesComparison(r, aboveOptions)).length
          const belowCount = currentRolls.filter(r => matchesComparison(r, belowOptions)).length
          return aboveCount - belowCount
        }
        return currentRolls.filter(r => matchesComparison(r, options)).length
      }
    }
  }
}
