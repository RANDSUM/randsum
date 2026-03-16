import type { ComparisonOptions } from '../notation/types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation
} from '../notation/comparison'
import { validateComparisonOptions } from '../lib/comparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const capPattern = /[Cc]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const capSchema: NotationSchema<ComparisonOptions> = defineNotationSchema<ComparisonOptions>(
  {
    name: 'cap',
    priority: 10,

    pattern: capPattern,

    parse: notation => {
      const match = capPattern.exec(notation)
      if (!match?.[1]) return {}

      const parsed = parseComparisonNotation(match[1])
      const cap: ComparisonOptions = {}

      if (parsed.greaterThan !== undefined) cap.greaterThan = parsed.greaterThan
      if (parsed.greaterThanOrEqual !== undefined)
        cap.greaterThanOrEqual = parsed.greaterThanOrEqual
      if (parsed.lessThan !== undefined) cap.lessThan = parsed.lessThan
      if (parsed.lessThanOrEqual !== undefined) cap.lessThanOrEqual = parsed.lessThanOrEqual
      if (parsed.exact?.length) cap.exact = parsed.exact

      return Object.keys(cap).length > 0 ? { cap } : {}
    },

    toNotation: options => {
      const capList = formatComparisonNotation(options)
      return capList.length ? `C{${capList.join(',')}}` : undefined
    },

    toDescription: options => {
      const { exact, ...comparisonOpts } = options
      const descriptions: string[] = []

      if (exact?.length) {
        descriptions.push(...exact.map(v => `No Rolls Greater Than ${v}`))
      }

      const comparison = formatComparisonDescription(comparisonOpts)
      descriptions.push(...comparison.map(str => `No Rolls ${str}`))

      return descriptions
    }
  }
)

export const capModifier: ModifierDefinition<ComparisonOptions> = {
  ...capSchema,

  apply: (rolls, options) => {
    const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } = options
    const newRolls = rolls.map(roll => {
      const afterHighCap =
        greaterThan !== undefined && roll > greaterThan
          ? greaterThan
          : greaterThanOrEqual !== undefined && roll >= greaterThanOrEqual
            ? greaterThanOrEqual
            : roll

      const afterExactCap = (exact ?? []).reduce((v, cap) => (v > cap ? cap : v), afterHighCap)

      const afterLowCap =
        lessThan !== undefined && afterExactCap < lessThan
          ? lessThan
          : lessThanOrEqual !== undefined && afterExactCap <= lessThanOrEqual
            ? lessThanOrEqual
            : afterExactCap

      return afterLowCap
    })

    return { rolls: newRolls }
  },

  validate: options => {
    validateComparisonOptions('cap', options)
  }
}
