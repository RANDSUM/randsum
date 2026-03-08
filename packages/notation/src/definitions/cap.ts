import type { ComparisonOptions } from '../types'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation
} from '../comparison'
import { type NotationSchema, defineNotationSchema } from '../schema'
import { registerNotationSchema } from '../registry'

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

registerNotationSchema(capSchema)
