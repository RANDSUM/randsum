import type { CountOptions } from '../types'
import { type NotationSchema, defineNotationSchema } from '../schema'
import { parseComparisonNotation } from '../comparison'

export const countPattern = /#\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const countSchema: NotationSchema<CountOptions> = defineNotationSchema<CountOptions>({
  name: 'count',
  priority: 80,

  pattern: countPattern,

  parse: notation => {
    const match = countPattern.exec(notation)
    if (!match) return {}

    const comparison = parseComparisonNotation(match[1] ?? '')
    const hasAbove =
      comparison.greaterThan !== undefined || comparison.greaterThanOrEqual !== undefined
    const hasBelow = comparison.lessThan !== undefined || comparison.lessThanOrEqual !== undefined

    const result: CountOptions = { ...comparison }

    if (hasAbove && hasBelow) {
      result.deduct = true
    }

    return { count: result }
  },

  toNotation: options => {
    const parts: string[] = []

    if (options.exact?.length) {
      parts.push(...options.exact.map(n => `=${n}`))
    }
    if (options.greaterThanOrEqual !== undefined) {
      parts.push(`>=${options.greaterThanOrEqual}`)
    }
    if (options.greaterThan !== undefined) {
      parts.push(`>${options.greaterThan}`)
    }
    if (options.lessThanOrEqual !== undefined) {
      parts.push(`<=${options.lessThanOrEqual}`)
    }
    if (options.lessThan !== undefined) {
      parts.push(`<${options.lessThan}`)
    }

    if (parts.length === 0) return undefined

    return `#{${parts.join(',')}}`
  },

  toDescription: options => {
    const descriptions: string[] = []

    if (options.exact?.length) {
      descriptions.push(`Count dice equal to ${options.exact.join(', ')}`)
    }

    if (options.greaterThanOrEqual !== undefined) {
      descriptions.push(`Count dice greater than or equal to ${options.greaterThanOrEqual}`)
    }

    if (options.greaterThan !== undefined) {
      descriptions.push(`Count dice greater than ${options.greaterThan}`)
    }

    if (options.lessThanOrEqual !== undefined) {
      if (options.deduct) {
        descriptions.push(`deduct dice less than or equal to ${options.lessThanOrEqual}`)
      } else {
        descriptions.push(`Count dice less than or equal to ${options.lessThanOrEqual}`)
      }
    }

    if (options.lessThan !== undefined) {
      if (options.deduct) {
        descriptions.push(`deduct dice less than ${options.lessThan}`)
      } else {
        descriptions.push(`Count dice less than ${options.lessThan}`)
      }
    }

    if (descriptions.length === 0) return []

    if (options.deduct && descriptions.length > 1) {
      return [descriptions.join(', ')]
    }

    return descriptions
  }
})
