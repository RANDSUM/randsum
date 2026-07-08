import type { CountOptions } from '../notation/types'
import { countSchema } from '../notation/definitions/count'
import { ModifierError } from '../errors'
import { matchesComparison } from '../lib/comparison/matchesComparison'
import type { ModifierDefinition } from './schema'

export const countModifier: ModifierDefinition<CountOptions> = {
  ...countSchema,
  mutatesRolls: false as const,

  validate: options => {
    if (
      options.deduct &&
      options.lessThanOrEqual !== undefined &&
      options.greaterThanOrEqual !== undefined &&
      options.lessThanOrEqual >= options.greaterThanOrEqual
    ) {
      throw new ModifierError(
        'count',
        `botchThreshold (${options.lessThanOrEqual}) must be less than threshold (${options.greaterThanOrEqual})`,
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
