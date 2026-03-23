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
