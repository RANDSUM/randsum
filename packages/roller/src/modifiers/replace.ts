import type { ComparisonOptions, ReplaceOptions } from '../notation/types'
import { formatComparisonDescription, formatComparisonNotation } from '../notation/comparison'
import { validateComparisonOptions } from '../lib/comparison'
import { matchesComparison } from '../lib/comparison/matchesComparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'

const replacePattern = /[Vv]\{((?:>=|<=|>|<)?\d+=\d+(?:,(?:>=|<=|>|<)?\d+=\d+)*)\}/

export const replaceSchema: NotationSchema<ReplaceOptions | ReplaceOptions[]> =
  defineNotationSchema<ReplaceOptions | ReplaceOptions[]>({
    name: 'replace',
    priority: 30,

    pattern: replacePattern,

    docs: [
      {
        key: 'V{..}',
        category: 'Map',
        color: '#2dd4bf',
        colorLight: '#0d9488',
        title: 'Replace',
        description: 'Replace dice showing specific values with a new value.',
        displayBase: 'V{..}',
        forms: [{ notation: 'V{...}', note: 'Comma-separate multiple rules' }],
        comparisons: [
          { operator: 'n=y', note: 'replace exact match n with y' },
          { operator: '>n=y', note: 'replace anything above n with y' },
          { operator: '>=n=y', note: 'replace n or higher with y' },
          { operator: '<n=y', note: 'replace anything below n with y' },
          { operator: '<=n=y', note: 'replace n or lower with y' }
        ],
        examples: [
          {
            description: 'Replace 1s with 2',
            notation: '4d6V{1=2}',
            options: { sides: 6, quantity: 4, modifiers: { replace: { from: 1, to: 2 } } }
          },
          {
            description: 'Cap 19s and 20s to 20',
            notation: '4d20V{>18=20}',
            options: {
              sides: 20,
              quantity: 4,
              modifiers: { replace: { from: { greaterThan: 18 }, to: 20 } }
            }
          },
          {
            description: 'Replace multiple',
            notation: '4d6V{1=2,6=5}',
            options: {
              sides: 6,
              quantity: 4,
              modifiers: {
                replace: [
                  { from: 1, to: 2 },
                  { from: 6, to: 5 }
                ]
              }
            }
          }
        ]
      }
    ] satisfies readonly NotationDoc[],

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

export const replaceModifier: ModifierDefinition<ReplaceOptions | ReplaceOptions[]> = {
  ...replaceSchema,

  apply: (rolls, options) => {
    const replaceRules = Array.isArray(options) ? options : [options]
    const replacements: { from: number; to: number }[] = []

    const applyRule = (currentRolls: number[], rule: ReplaceOptions): number[] => {
      const { from, to } = rule
      return currentRolls.map(roll => {
        const matches = typeof from === 'object' ? matchesComparison(roll, from) : roll === from
        if (matches && roll !== to) {
          replacements.push({ from: roll, to })
          return to
        }
        return roll
      })
    }

    const result = replaceRules.reduce((currentRolls, rule) => applyRule(currentRolls, rule), rolls)

    return { rolls: result, replacements }
  },

  validate: options => {
    const rules = Array.isArray(options) ? options : [options]
    for (const { from } of rules) {
      if (typeof from === 'object') {
        validateComparisonOptions('replace', from)
      }
    }
  }
}
