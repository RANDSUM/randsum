import type { ComparisonOptions } from '../types'
import { formatComparisonNotation, hasConditions, parseComparisonNotation } from '../comparison'
import { type NotationSchema, defineNotationSchema } from '../schema'

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
    return ['Exploding Dice']
  }
})
