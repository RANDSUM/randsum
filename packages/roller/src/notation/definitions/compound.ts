import type { ComparisonOptions } from '../types'
import { formatComparisonNotation, hasConditions, parseComparisonNotation } from '../comparison'
import { type NotationSchema, defineNotationSchema } from '../schema'

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
        const conditions = formatComparisonNotation(options)
        if (conditions.length === 0) return ['Compounding Dice']
        return [`Compounding Dice on ${conditions.join(' or ')}`]
      }
      return []
    }
  })
