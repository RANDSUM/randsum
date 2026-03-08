import type { ComparisonOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation,
  validateComparisonOptions
} from '../../comparison'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

// Matches C{conditions} where conditions are comparison operators and/or bare numbers
const capPattern = /[Cc]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

/**
 * Cap modifier - constrains roll values to a range.
 *
 * Notation: C{conditions} where each condition is a comparison
 * Examples:
 *   - C{>5}   - Cap values greater than 5 to 5
 *   - C{<2}   - Cap values less than 2 to 2
 *   - C{>=5}  - Cap values greater than or equal to 5 to 5
 *   - C{<=2}  - Cap values less than or equal to 2 to 2
 *   - C{4}    - Cap values above 4 to 4 (bare number = max cap)
 *   - C{=4}   - Same as C{4}
 *   - C{>5,<2} - Cap to range [2, 5]
 */
export const capModifier: TypedModifierDefinition<'cap'> = defineModifier<'cap'>({
  name: 'cap',
  priority: 10,

  pattern: capPattern,

  parse: notation => {
    const match = capPattern.exec(notation)
    if (!match?.[1]) return {}

    const parsed = parseComparisonNotation(match[1])
    const cap: ComparisonOptions = {}

    if (parsed.greaterThan !== undefined) cap.greaterThan = parsed.greaterThan
    if (parsed.greaterThanOrEqual !== undefined) cap.greaterThanOrEqual = parsed.greaterThanOrEqual
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

    // Exact values in cap act as a max cap ("cap at N")
    if (exact?.length) {
      descriptions.push(...exact.map(v => `No Rolls Greater Than [${v}]`))
    }

    const comparison = formatComparisonDescription(comparisonOpts)
    descriptions.push(...comparison.map(str => `No Rolls ${str}`))

    return descriptions
  },

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

      // Apply low caps
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

  validate: (options, { sides: _sides }) => {
    const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual } = options

    const effectiveHigh = greaterThan ?? greaterThanOrEqual
    const effectiveLow = lessThan ?? lessThanOrEqual

    if (
      effectiveLow !== undefined &&
      effectiveHigh !== undefined &&
      effectiveLow >= effectiveHigh
    ) {
      throw new ModifierError(
        'cap',
        `Invalid cap range: lessThan (${effectiveLow}) must be less than greaterThan (${effectiveHigh})`
      )
    }

    validateComparisonOptions('cap', options)
  }
})
