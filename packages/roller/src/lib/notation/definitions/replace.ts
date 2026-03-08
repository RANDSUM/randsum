import type { ComparisonOptions, ReplaceOptions } from '../../../types'
import { formatComparisonDescription, formatComparisonNotation } from '../../comparison'
import { type NotationSchema, defineNotationSchema } from '../schema'

const replacePattern = /[Vv]\{((?:>=|<=|>|<)?\d+=\d+(?:,(?:>=|<=|>|<)?\d+=\d+)*)\}/

export const replaceSchema: NotationSchema<ReplaceOptions | ReplaceOptions[]> =
  defineNotationSchema<ReplaceOptions | ReplaceOptions[]>({
    name: 'replace',
    priority: 30,

    pattern: replacePattern,

    parse: notation => {
      const match = replacePattern.exec(notation)
      if (!match) return {}

      const content = match[1]
      if (!content) return {}
      const parts = content.split(',').map(s => s.trim())

      const replacements = parts.map(part => {
        const fromToMatch = /^((?:>=|<=|>|<)?\d+)=(\d+)$/.exec(part)
        if (!fromToMatch?.[1] || !fromToMatch[2]) return { from: 0, to: 0 }

        const [, fromStr, toStr] = fromToMatch
        const from: number | ComparisonOptions = fromStr.startsWith('>=')
          ? { greaterThanOrEqual: Number(fromStr.slice(2)) }
          : fromStr.startsWith('<=')
            ? { lessThanOrEqual: Number(fromStr.slice(2)) }
            : fromStr.startsWith('>')
              ? { greaterThan: Number(fromStr.slice(1)) }
              : fromStr.startsWith('<')
                ? { lessThan: Number(fromStr.slice(1)) }
                : Number(fromStr)

        return { from, to: Number(toStr) }
      })

      return { replace: replacements }
    },

    toNotation: options => {
      const rules = Array.isArray(options) ? options : [options]
      const notations = rules.map(({ from, to }) => {
        if (typeof from === 'object') {
          const comparisons = formatComparisonNotation(from)
          return comparisons.map(comp => `${comp}=${to}`).join(',')
        }
        return `${from}=${to}`
      })

      return notations.length ? `V{${notations.join(',')}}` : undefined
    },

    toDescription: options => {
      const rules = Array.isArray(options) ? options : [options]
      return rules.map(({ from, to }) => {
        if (typeof from === 'object') {
          const comparisons = formatComparisonDescription(from)
          return `Replace ${comparisons.join(' and ')} with ${to}`
        }
        return `Replace ${from} with ${to}`
      })
    }
  })
