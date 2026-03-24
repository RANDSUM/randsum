import type { ComparisonOptions } from '../notation/types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  hasConditions,
  parseComparisonNotation
} from '../notation/comparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'
import { ExplosionStrategies, createAccumulatingExplosionBehavior } from './shared/explosion'

const penetratePattern = /!p(\d+)?(\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\})?/i

export const penetrateSchema: NotationSchema<boolean | number | ComparisonOptions> =
  defineNotationSchema<boolean | number | ComparisonOptions>({
    name: 'penetrate',
    priority: 52,

    pattern: penetratePattern,

    docs: [
      {
        key: '!p',
        category: 'Accumulate',
        color: '#d97706',
        colorLight: '#92400e',
        title: 'Penetrating Explode',
        description:
          'Like explode, but each subsequent explosion subtracts 1 from the result (Hackmaster-style).',
        displayBase: '!p',
        forms: [
          { notation: '!p(n)', note: 'Penetrate up to n times (default: once)' },
          { notation: '!p0', note: 'Unlimited depth (capped at 100)' },
          { notation: '!p{condition}', note: 'Penetrate on condition match' }
        ],
        comparisons: [
          { operator: 'n', note: 'penetrate on exactly n' },
          { operator: '>n', note: 'penetrate on more than n' },
          { operator: '>=n', note: 'penetrate on n or more' },
          { operator: '<n', note: 'penetrate on less than n' },
          { operator: '<=n', note: 'penetrate on n or less' }
        ],
        examples: [
          {
            description: 'Roll 1d6; max penetrates with -1 per chain',
            notation: '1d6!p',
            options: { sides: 6, modifiers: { penetrate: true } }
          },
          { description: 'Penetrate, then drop lowest', notation: '2d6!pL' },
          {
            description: 'Roll 5d10; penetrate on 8 or higher',
            notation: '5d10!p{>=8}',
            options: { sides: 10, quantity: 5, modifiers: { penetrate: { greaterThanOrEqual: 8 } } }
          }
        ]
      } satisfies NotationDoc
    ],

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
