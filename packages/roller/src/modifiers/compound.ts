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

const compoundPattern = /!!(\d+)?(\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\})?/

export const compoundSchema: NotationSchema<boolean | number | ComparisonOptions> =
  defineNotationSchema<boolean | number | ComparisonOptions>({
    name: 'compound',
    priority: 51,

    pattern: compoundPattern,

    parse: notation => {
      const match = compoundPattern.exec(notation)
      if (!match) return {}

      const depth = match[1]
      const conditionBlock = match[3]

      if (conditionBlock) {
        const parsed = parseComparisonNotation(conditionBlock)
        if (hasConditions(parsed)) {
          return { compound: parsed }
        }
      }

      if (depth !== undefined) {
        return { compound: Number(depth) }
      }

      return { compound: true }
    },

    toNotation: options => {
      if (options === true) return '!!'
      if (typeof options === 'number') return `!!${options}`
      if (typeof options === 'object') {
        const parts = formatComparisonNotation(options)
        if (!parts.length) return '!!'
        return `!!{${parts.join(',')}}`
      }
      return undefined
    },

    toDescription: options => {
      if (options === true) return ['Compounding Dice']
      if (options === 0) return ['Compounding Dice (unlimited)']
      if (typeof options === 'number') return [`Compounding Dice (max ${options} times)`]
      if (typeof options === 'object') {
        const conditions = formatComparisonDescription(options)
        if (conditions.length === 0) return ['Compounding Dice']
        return [`Compounding Dice on ${conditions.join(' or ')}`]
      }
      return []
    }
  })

export const compoundModifier: ModifierDefinition<boolean | number | ComparisonOptions> = {
  ...compoundSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.compound)
}
