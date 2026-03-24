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
import { assertRequiredContext } from './schema'
import { buildExplosionTrigger } from './shared/conditionMatch'

const explodePattern =
  /(?<!!)!(?!!|[pPsSiIrR])(\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\})?/

export const explodeSchema: NotationSchema<boolean | ComparisonOptions> = defineNotationSchema<
  boolean | ComparisonOptions
>({
  name: 'explode',
  priority: 50,

  pattern: /(?<!!)!(?!!|[pPsSiIrR])(\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\})?/,

  docs: [
    {
      key: '!',
      category: 'Generate',
      color: '#fbbf24',
      colorLight: '#d97706',
      title: 'Explode',
      description:
        'Each die showing its maximum value triggers an extra die roll. Continues if new dice also max.',
      displayBase: '!',
      forms: [
        { notation: '!', note: 'Explode on max value' },
        { notation: '!{condition}', note: 'Explode on condition match' }
      ],
      comparisons: [
        { operator: 'n', note: 'explode on exactly n' },
        { operator: '>n', note: 'explode on more than n' },
        { operator: '>=n', note: 'explode on n or more' },
        { operator: '<n', note: 'explode on less than n' },
        { operator: '<=n', note: 'explode on n or less' }
      ],
      examples: [
        {
          description: 'Roll 3d6; any 6 adds another d6',
          notation: '3d6!',
          options: { sides: 6, quantity: 3, modifiers: { explode: true } }
        },
        { description: 'Roll 4d6, explode, then drop lowest', notation: '4d6L!' },
        {
          description: 'Roll 3d10; explode on 8 or higher',
          notation: '3d10!{>=8}',
          options: { sides: 10, quantity: 3, modifiers: { explode: { greaterThanOrEqual: 8 } } }
        },
        { description: 'Roll 5d10; explode only on 10', notation: '5d10!{=10}' }
      ]
    } satisfies NotationDoc
  ],

  parse: notation => {
    const match = explodePattern.exec(notation)
    if (!match) return {}

    const conditionBlock = match[2]
    if (conditionBlock) {
      const parsed = parseComparisonNotation(conditionBlock)
      if (hasConditions(parsed)) {
        return { explode: parsed }
      }
    }

    return { explode: true }
  },

  toNotation: options => {
    if (options === true) return '!'
    if (typeof options === 'object') {
      const parts = formatComparisonNotation(options)
      if (!parts.length) return '!'
      return `!{${parts.join(',')}}`
    }
    return undefined
  },

  toDescription: options => {
    if (!options) return []
    if (options === true) return ['Exploding Dice']
    if (typeof options === 'object') {
      const conditions = formatComparisonDescription(options)
      if (conditions.length === 0) return ['Exploding Dice']
      return [`Exploding Dice on ${conditions.join(' or ')}`]
    }
    return ['Exploding Dice']
  }
})

export const explodeModifier: ModifierDefinition<boolean | ComparisonOptions> = {
  ...explodeSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const trigger = buildExplosionTrigger(options)
    const explosions = rolls.filter(roll => trigger(roll, parameters.sides)).map(() => rollOne())

    return { rolls: [...rolls, ...explosions] }
  }
}
