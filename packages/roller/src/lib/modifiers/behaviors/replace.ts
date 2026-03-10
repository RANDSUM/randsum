import type { ReplaceOptions } from '../../../types'
import { validateComparisonOptions } from '../../comparison'
import { matchesComparison } from '../../comparison/matchesComparison'
import type { ModifierBehavior } from '../schema'

export const replaceBehavior: ModifierBehavior<ReplaceOptions | ReplaceOptions[]> = {
  apply: (rolls, options) => {
    const replaceRules = Array.isArray(options) ? options : [options]

    const applyRule = (currentRolls: number[], rule: ReplaceOptions): number[] => {
      const { from, to } = rule
      return currentRolls.map(roll => {
        if (typeof from === 'object') {
          return matchesComparison(roll, from) ? to : roll
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
}
