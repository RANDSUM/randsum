import type { RerollOptions } from '../../../types'
import { formatComparisonNotation, hasConditions, parseComparisonNotation } from '../../comparison'
import { formatHumanList } from '../../utils'
import { type NotationSchema, defineNotationSchema } from '../schema'

const rerollPattern = /[Rr]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}(\d+)?/g

export const rerollSchema: NotationSchema<RerollOptions> = defineNotationSchema<RerollOptions>({
  name: 'reroll',
  priority: 40,

  pattern: /[Rr]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}(\d+)?/,

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

    const maxText = max !== undefined ? ` (up to ${max} times)` : ''
    return [`Reroll ${conditions}${maxText}`]
  }
})
