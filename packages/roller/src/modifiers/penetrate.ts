import type { ComparisonOptions } from '../notation/types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  hasConditions,
  parseComparisonNotation
} from '../notation/comparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { ExplosionStrategies, createAccumulatingExplosionBehavior } from './shared/explosion'

const penetratePattern = /!p(\d+)?(\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\})?/i

export const penetrateSchema: NotationSchema<boolean | number | ComparisonOptions> =
  defineNotationSchema<boolean | number | ComparisonOptions>({
    name: 'penetrate',
    priority: 52,

    pattern: penetratePattern,

    parse: notation => {
      const match = penetratePattern.exec(notation)
      if (!match) return {}

      const depth = match[1]
      const conditionBlock = match[3]

      if (conditionBlock) {
        const parsed = parseComparisonNotation(conditionBlock)
        if (hasConditions(parsed)) {
          return { penetrate: parsed }
        }
      }

      if (depth !== undefined) {
        return { penetrate: Number(depth) }
      }

      return { penetrate: true }
    },

    toNotation: options => {
      if (options === true) return '!p'
      if (typeof options === 'number') return `!p${options}`
      if (typeof options === 'object') {
        const parts = formatComparisonNotation(options)
        if (!parts.length) return '!p'
        return `!p{${parts.join(',')}}`
      }
      return undefined
    },

    toDescription: options => {
      if (options === true) return ['Penetrating Dice']
      if (options === 0) return ['Penetrating Dice (unlimited)']
      if (typeof options === 'number') return [`Penetrating Dice (max ${options} times)`]
      if (typeof options === 'object') {
        const conditions = formatComparisonDescription(options)
        if (conditions.length === 0) return ['Penetrating Dice']
        return [`Penetrating Dice on ${conditions.join(' or ')}`]
      }
      return []
    }
  })

export const penetrateModifier: ModifierDefinition<boolean | number | ComparisonOptions> = {
  ...penetrateSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.penetrate)
}
