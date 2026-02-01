import type { ComparisonOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation
} from '../../comparison'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const capPattern = /[Cc]\{([^}]{1,50})\}/

/**
 * Cap modifier - constrains roll values to a range.
 *
 * Notation: C{>N} or C{<N} or C{>N,<M}
 * Examples:
 *   - C{>5} - Cap values greater than 5 to 5
 *   - C{<2} - Cap values less than 2 to 2
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
    if (parsed.lessThan !== undefined) cap.lessThan = parsed.lessThan

    return Object.keys(cap).length > 0 ? { cap } : {}
  },

  toNotation: options => {
    const capList = formatComparisonNotation(options)
    return capList.length ? `C{${capList.join(',')}}` : undefined
  },

  toDescription: options => {
    return formatComparisonDescription(options).map(str => `No Rolls ${str}`)
  },

  apply: (rolls, options) => {
    const { greaterThan, lessThan } = options
    const newRolls = rolls.map(roll => {
      const cappedHigh = greaterThan !== undefined && roll > greaterThan ? greaterThan : roll
      const cappedBoth = lessThan !== undefined && cappedHigh < lessThan ? lessThan : cappedHigh
      return cappedBoth
    })

    return { rolls: newRolls }
  },

  validate: (options, { sides: _sides }) => {
    const { greaterThan, lessThan } = options

    if (lessThan !== undefined && greaterThan !== undefined && lessThan >= greaterThan) {
      throw new ModifierError(
        'cap',
        `Invalid cap range: lessThan (${lessThan}) must be less than greaterThan (${greaterThan})`
      )
    }
  }
})
