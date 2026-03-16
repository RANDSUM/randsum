import type { RerollOptions } from '../notation/types'
import { formatComparisonNotation, hasConditions, parseComparisonNotation } from '../notation/comparison'
import { formatHumanList } from '../notation/formatHumanList'
import { defineNotationSchema } from '../notation/schema'
import { ModifierError } from '../errors'
import { matchesComparison, validateComparisonOptions } from '../lib/comparison'
import { MAX_REROLL_ATTEMPTS } from '../lib/constants'
import type { ModifierDefinition } from './schema'
import { assertRollFn } from './schema'

const comparisonGroup = '((?:>=|<=|>|<|=)?\\d+(?:,(?:>=|<=|>|<|=)?\\d+)*)'
const rerollPattern = new RegExp(
  `[Rr][Oo]\\{${comparisonGroup}\\}|[Rr]\\{${comparisonGroup}\\}(\\d+)?`,
  'g'
)

export const rerollSchema = defineNotationSchema<RerollOptions>({
  name: 'reroll',
  priority: 40,

  pattern: /[Rr]([Oo])?\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}(\d+)?/,

  parse: notation => {
    const matches = Array.from(notation.matchAll(rerollPattern))
    if (matches.length === 0) return {}

    const reroll: RerollOptions = {}

    for (const match of matches) {
      const isRerollOnce = match[1] !== undefined
      const conditions = isRerollOnce ? match[1] : match[2]
      const maxCount = isRerollOnce ? 1 : match[3] ? Number(match[3]) : undefined

      if (maxCount !== undefined) {
        reroll.max = maxCount
      }

      if (conditions) {
        const parsed = parseComparisonNotation(conditions)
        if (parsed.greaterThan !== undefined) reroll.greaterThan = parsed.greaterThan
        if (parsed.greaterThanOrEqual !== undefined)
          reroll.greaterThanOrEqual = parsed.greaterThanOrEqual
        if (parsed.lessThan !== undefined) reroll.lessThan = parsed.lessThan
        if (parsed.lessThanOrEqual !== undefined) reroll.lessThanOrEqual = parsed.lessThanOrEqual
        if (parsed.exact) reroll.exact = [...(reroll.exact ?? []), ...parsed.exact]
      }
    }

    return hasConditions(reroll) || reroll.max !== undefined ? { reroll } : {}
  },

  toNotation: options => {
    const parts = formatComparisonNotation(options)
    if (!parts.length) return undefined

    if (options.max === 1) {
      return `ro{${parts.join(',')}}`
    }

    const maxSuffix = options.max ? `${options.max}` : ''
    return `R{${parts.join(',')}}${maxSuffix}`
  },

  toDescription: options => {
    const { exact, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, max } = options
    const rerollList: string[] = []

    if (exact) {
      exact.forEach(roll => rerollList.push(`${roll}`))
    }

    const greaterLessList: string[] = []
    if (greaterThanOrEqual !== undefined) {
      greaterLessList.push(`greater than or equal to ${greaterThanOrEqual}`)
    }
    if (greaterThan !== undefined) {
      greaterLessList.push(`greater than ${greaterThan}`)
    }
    if (lessThanOrEqual !== undefined) {
      greaterLessList.push(`less than or equal to ${lessThanOrEqual}`)
    }
    if (lessThan !== undefined) {
      greaterLessList.push(`less than ${lessThan}`)
    }

    const exactList = formatHumanList(rerollList.map(Number))
    const greaterLess = greaterLessList.join(' and ')

    const conditions = [exactList, greaterLess].filter(Boolean).join(', ')
    if (!conditions) return []

    if (max === 1) {
      return [`Reroll once ${conditions}`]
    }

    const maxText = max !== undefined ? ` (up to ${max} times)` : ''
    return [`Reroll ${conditions}${maxText}`]
  }
})

function rerollSingle(
  roll: number,
  options: RerollOptions,
  rollOne: () => number,
  attempt = 0
): number {
  if (attempt >= MAX_REROLL_ATTEMPTS) {
    return roll
  }

  if (matchesComparison(roll, options)) {
    return rerollSingle(rollOne(), options, rollOne, attempt + 1)
  }

  return roll
}

export const rerollModifier: ModifierDefinition<RerollOptions> = {
  ...rerollSchema,
  requiresRollFn: true,

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

    validateComparisonOptions('reroll', options)
  }
}
