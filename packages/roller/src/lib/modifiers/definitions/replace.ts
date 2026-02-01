import { formatComparisonDescription, formatComparisonNotation } from '../../comparison'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const replacePattern = /[Vv]\{([^}]{1,50})\}/

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
      const [fromPart, toPart] = part.split('=')
      if (!fromPart || !toPart) return { from: 0, to: 0 }

      const from: number | { greaterThan: number } | { lessThan: number } = fromPart.startsWith('>')
        ? { greaterThan: Number(fromPart.slice(1)) }
        : fromPart.startsWith('<')
          ? { lessThan: Number(fromPart.slice(1)) }
          : Number(fromPart)

      return { from, to: Number(toPart) }
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
          const { greaterThan, lessThan } = from
          if (greaterThan !== undefined && roll > greaterThan) return to
          if (lessThan !== undefined && roll < lessThan) return to
          return roll
        }
        return roll === from ? to : roll
      })
    }

    const result = replaceRules.reduce((currentRolls, rule) => applyRule(currentRolls, rule), rolls)

    return { rolls: result }
  }
})
