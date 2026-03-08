import type { ComparisonOptions } from '../../../types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  validateComparisonOptions
} from '../../comparison'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const replacePattern = /[Vv]\{((?:>=|<=|>|<)?\d+=\d+(?:,(?:>=|<=|>|<)?\d+=\d+)*)\}/

/**
 * Replace modifier - substitutes specific roll values with other values.
 *
 * Notation: V{from=to} or V{from=to,from2=to2}
 * Examples:
 *   - V{1=2} - Replace all 1s with 2s
 *   - V{>5=5} - Replace values greater than 5 with 5
 *   - V{1=6,2=5} - Replace 1s with 6s and 2s with 5s
 */
export const replaceModifier: TypedModifierDefinition<'replace'> = defineModifier<'replace'>({
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
        return `Replace ${comparisons.join(' and ')} with [${to}]`
      }
      return `Replace [${from}] with [${to}]`
    })
  },

  apply: (rolls, options) => {
    const replaceRules = Array.isArray(options) ? options : [options]

    const applyRule = (currentRolls: number[], rule: (typeof replaceRules)[number]): number[] => {
      const { from, to } = rule
      return currentRolls.map(roll => {
        if (typeof from === 'object') {
          const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual } = from
          if (greaterThan !== undefined && roll > greaterThan) return to
          if (greaterThanOrEqual !== undefined && roll >= greaterThanOrEqual) return to
          if (lessThan !== undefined && roll < lessThan) return to
          if (lessThanOrEqual !== undefined && roll <= lessThanOrEqual) return to
          return roll
        }
        return roll === from ? to : roll
      })
    }

    const result = replaceRules.reduce((currentRolls, rule) => applyRule(currentRolls, rule), rolls)

    return { rolls: result }
  },

  validate: options => {
    const rules = Array.isArray(options) ? options : [options]
    for (const { from } of rules) {
      if (typeof from === 'object') {
        validateComparisonOptions('replace', from)
      }
    }
  }
})
