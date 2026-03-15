import type { RerollOptions } from '../types'
import { formatComparisonNotation, hasConditions, parseComparisonNotation } from '../comparison'
import { formatHumanList } from '../formatHumanList'
import { type NotationSchema, defineNotationSchema } from '../schema'

const comparisonGroup = '((?:>=|<=|>|<|=)?\\d+(?:,(?:>=|<=|>|<|=)?\\d+)*)'
const rerollPattern = new RegExp(
  `[Rr][Oo]\\{${comparisonGroup}\\}|[Rr]\\{${comparisonGroup}\\}(\\d+)?`,
  'g'
)

export const rerollSchema: NotationSchema<RerollOptions> = defineNotationSchema<RerollOptions>({
  name: 'reroll',
  priority: 40,

  pattern: /[Rr]([Oo])?\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}(\d+)?/,

  parse: notation => {
    const matches = Array.from(notation.matchAll(rerollPattern))
    if (matches.length === 0) return {}

    const reroll: RerollOptions = {}

    for (const match of matches) {
      // match[1] = conditions from ro{...} form
      // match[2] = conditions from R{...} form
      // match[3] = max count from R{...}N form
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
