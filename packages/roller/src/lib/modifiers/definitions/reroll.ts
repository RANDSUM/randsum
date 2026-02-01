import type { RerollOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import {
  formatComparisonNotation,
  hasConditions,
  matchesComparison,
  parseComparisonNotation
} from '../../comparison'
import { formatHumanList } from '../../utils'
import { MAX_REROLL_ATTEMPTS } from '../../constants'
import type { TypedModifierDefinition } from '../schema'
import { assertRollFn } from '../schema'
import { defineModifier } from '../registry'

const rerollPattern = /[Rr]\{([^}]{1,50})\}(\d+)?/g

/**
 * Reroll modifier - rerolls dice matching conditions.
 *
 * Notation: R{conditions}N where N is optional max reroll count
 * Examples:
 *   - R{1} - Reroll 1s
 *   - R{1,2} - Reroll 1s and 2s
 *   - R{<3} - Reroll values less than 3
 *   - R{1}2 - Reroll 1s, max 2 rerolls total
 */
export const rerollModifier: TypedModifierDefinition<'reroll'> = defineModifier<'reroll'>({
  name: 'reroll',
  priority: 40,
  requiresRollFn: true,

  pattern: /[Rr]\{([^}]{1,50})\}(\d+)?/,

  parse: notation => {
    const matches = Array.from(notation.matchAll(rerollPattern))
    if (matches.length === 0) return {}

    const reroll: RerollOptions = {}

    for (const match of matches) {
      const conditions = match[1]
      const maxCount = match[2] ? Number(match[2]) : undefined

      if (maxCount) {
        reroll.max = maxCount
      }

      if (conditions) {
        const parsed = parseComparisonNotation(conditions)
        if (parsed.greaterThan !== undefined) reroll.greaterThan = parsed.greaterThan
        if (parsed.lessThan !== undefined) reroll.lessThan = parsed.lessThan
        if (parsed.exact) reroll.exact = [...(reroll.exact ?? []), ...parsed.exact]
      }
    }

    return hasConditions(reroll) || reroll.max !== undefined ? { reroll } : {}
  },

  toNotation: options => {
    const parts = formatComparisonNotation(options)
    if (!parts.length) return undefined

    const maxSuffix = options.max ? `${options.max}` : ''
    return `R{${parts.join(',')}}${maxSuffix}`
  },

  toDescription: options => {
    const { exact, greaterThan, lessThan, max } = options
    const rerollList: string[] = []

    if (exact) {
      exact.forEach(roll => rerollList.push(`${roll}`))
    }

    const greaterLessList: string[] = []
    if (greaterThan !== undefined) {
      greaterLessList.push(`greater than [${greaterThan}]`)
    }
    if (lessThan !== undefined) {
      greaterLessList.push(`less than [${lessThan}]`)
    }

    const exactList = formatHumanList(rerollList.map(Number))
    const greaterLess = greaterLessList.join(' and ')

    const conditions = [exactList, greaterLess].filter(Boolean).join(', ')
    if (!conditions) return []

    const maxText = max !== undefined ? ` (up to ${max} times)` : ''
    return [`Reroll ${conditions}${maxText}`]
  },

  apply: (rolls, options, ctx) => {
    const { rollOne } = assertRollFn(ctx)
    const { max } = options

    const { result } = rolls.reduce<{ result: number[]; rerollCount: number }>(
      (acc, roll) => {
        if (max !== undefined && acc.rerollCount >= max) {
          return { result: [...acc.result, roll], rerollCount: acc.rerollCount }
        }

        const newRoll = rerollSingle(roll, options, rollOne)
        const didReroll = newRoll !== roll
        return {
          result: [...acc.result, newRoll],
          rerollCount: didReroll ? acc.rerollCount + 1 : acc.rerollCount
        }
      },
      { result: [], rerollCount: 0 }
    )

    return { rolls: result }
  },

  validate: (options, { sides }) => {
    if (options.exact) {
      for (const value of options.exact) {
        if (value < 1 || value > sides) {
          throw new ModifierError(
            'reroll',
            `Reroll value ${value} is outside valid range [1, ${sides}]`
          )
        }
      }
    }
  }
})

/**
 * Recursively reroll a single die until it doesn't match conditions.
 */
function rerollSingle(
  roll: number,
  options: RerollOptions,
  rollOne: () => number,
  attempt = 0
): number {
  if (attempt >= MAX_REROLL_ATTEMPTS) {
    return roll // Safety limit
  }

  if (matchesComparison(roll, options)) {
    return rerollSingle(rollOne(), options, rollOne, attempt + 1)
  }

  return roll
}
