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
    },

    docs: [
      {
        key: '!!',
        category: 'Accumulate',
        color: '#f59e0b',
        colorLight: '#b45309',
        title: 'Compound Explode',
        description:
          'Like explode, but extra rolls add to the triggering die rather than creating new dice.',
        displayBase: '!!',
        displayOptional: 'n',
        forms: [
          { notation: '!!(n)', note: 'Compound up to n times (default: once)' },
          { notation: '!!0', note: 'Unlimited depth (capped at 100)' },
          { notation: '!!{condition}', note: 'Compound on condition match' }
        ],
        comparisons: [
          { operator: 'n', note: 'compound on exactly n' },
          { operator: '>n', note: 'compound on more than n' },
          { operator: '>=n', note: 'compound on n or more' },
          { operator: '<n', note: 'compound on less than n' },
          { operator: '<=n', note: 'compound on n or less' }
        ],
        examples: [
          { description: 'Roll 3d6; 6s add to themselves', notation: '3d6!!', options: { sides: 6, quantity: 3, modifiers: { compound: true } } },
          { description: 'Roll 1d8, compound up to 5 times', notation: '1d8!!5' },
          {
            description: 'Roll 5d10; compound on 8 or higher',
            notation: '5d10!!{>=8}',
            options: { sides: 10, quantity: 5, modifiers: { compound: { greaterThanOrEqual: 8 } } }
          }
        ]
      }
    ]
  })

export const compoundModifier: ModifierDefinition<boolean | number | ComparisonOptions> = {
  ...compoundSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.compound)
}
