import type { ReplaceOptions } from '../notation/types'
import { replaceSchema } from '../notation/definitions/replace'
import { validateComparisonOptions } from '../lib/comparison'
import { matchesComparison } from '../lib/comparison/matchesComparison'
import type { ModifierDefinition } from './schema'

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
