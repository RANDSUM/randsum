import type { ModifierOptions } from '../../../types'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

/**
 * Configuration for creating an arithmetic modifier.
 */
interface ArithmeticModifierConfig {
  /** Modifier name (must be a key in ModifierOptions) */
  name: 'plus' | 'minus'
  /** Execution priority (lower = earlier) */
  priority: number
  /** The operator character ('+' or '-') */
  operator: '+' | '-'
  /** Description verb ('Add' or 'Subtract') */
  verb: string
}

/**
 * Factory function to create arithmetic modifiers (plus/minus).
 *
 * These modifiers share identical structure:
 * - Pattern matches operator followed by digits
 * - Parse accumulates all matches
 * - Apply transforms the total via addition/subtraction
 *
 * @param config - Configuration for the arithmetic modifier
 * @returns A registered modifier definition
 */
export function createArithmeticModifier<K extends 'plus' | 'minus'>(
  config: ArithmeticModifierConfig & { name: K }
): TypedModifierDefinition<K> {
  const { name, priority, operator, verb } = config

  const escapedOperator = operator === '+' ? '\\+' : '-'
  const pattern = new RegExp(`${escapedOperator}(\\d+)`)
  const globalPattern = new RegExp(`${escapedOperator}(\\d+)`, 'g')

  return defineModifier<K>({
    name,
    priority,

    pattern,

    parse: notation => {
      const matches = Array.from(notation.matchAll(globalPattern))
      if (matches.length === 0) return {}

      const total = matches.reduce((sum, match) => sum + Number(match[1]), 0)
      const result: Pick<ModifierOptions, K> = { [name]: total } as Pick<ModifierOptions, K>
      return result
    },

    toNotation: options => {
      if (name === 'plus' && options < 0) {
        return `-${Math.abs(options)}`
      }
      return `${operator}${options}`
    },

    toDescription: options => {
      return [`${verb} ${options}`]
    },

    apply: (rolls, options) => {
      return {
        rolls,
        transformTotal: total => (operator === '+' ? total + options : total - options)
      }
    }
  })
}
