import type { ModifierOptions } from '../../../types'
import { defineNotationSchema } from '../schema'

type ArithmeticKey = 'plus' | 'minus'

interface ArithmeticNotationConfig {
  name: ArithmeticKey
  priority: number
  operator: '+' | '-'
  verb: string
}

export function createArithmeticNotation(
  config: ArithmeticNotationConfig
): ReturnType<typeof defineNotationSchema<number>> {
  const { name, priority, operator, verb } = config

  const escapedOperator = operator === '+' ? '\\+' : '-'
  const pattern = new RegExp(`${escapedOperator}(\\d+)`)
  const globalPattern = new RegExp(`${escapedOperator}(\\d+)`, 'g')

  return defineNotationSchema<number>({
    name,
    priority,

    pattern,

    parse: notation => {
      const matches = Array.from(notation.matchAll(globalPattern))
      if (matches.length === 0) return {}

      const total = matches.reduce((sum, match) => sum + Number(match[1]), 0)
      const result: Pick<ModifierOptions, ArithmeticKey> = {
        [name]: total
      } as Pick<ModifierOptions, ArithmeticKey>
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
    }
  })
}
