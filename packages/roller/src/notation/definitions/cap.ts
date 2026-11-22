import type { ComparisonOptions } from '../types'
import { formatComparisonNotation, parseComparisonNotation } from '../comparison'
import { type NotationSchema, defineNotationSchema } from '../schema'
const capPattern = /[Cc]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const capSchema: NotationSchema<ComparisonOptions> = defineNotationSchema<ComparisonOptions>(
  {
    name: 'cap',
    priority: 10,
    lexemeKey: 'C{..}',
    category: 'Clamp',

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
      // In the order Cap applies them: upper bounds, then lower bounds. `>=N`
      // clamps to N exactly as `>N` does, so both read "greater than N".
      const { exact, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual } = options
      const upper = [greaterThanOrEqual, greaterThan].filter(v => v !== undefined)
      const lower = [lessThanOrEqual, lessThan].filter(v => v !== undefined)

      return [
        ...upper.map(v => `No Rolls greater than ${v}`),
        ...(exact ?? []).map(v => `No Rolls Greater Than ${v}`),
        ...lower.map(v => `No Rolls less than ${v}`)
      ]
    }
  }
)
