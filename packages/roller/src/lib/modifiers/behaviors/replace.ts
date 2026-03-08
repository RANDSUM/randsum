import type { ReplaceOptions } from '../../../types'
import { validateComparisonOptions } from '../../comparison'
import type { ModifierBehavior } from '../schema'

export const replaceBehavior: ModifierBehavior<ReplaceOptions | ReplaceOptions[]> = {
  apply: (rolls, options) => {
    const replaceRules = Array.isArray(options) ? options : [options]

    const applyRule = (currentRolls: number[], rule: ReplaceOptions): number[] => {
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
}
