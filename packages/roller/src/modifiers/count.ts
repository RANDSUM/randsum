import type { CountOptions } from '../notation/types'
import { parseComparisonNotation } from '../notation/comparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import { ModifierError } from '../errors'
import type { ModifierDefinition } from './schema'
import { matchesComparison } from '../lib/comparison/matchesComparison'

const countPattern = /#\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

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

export const countModifier: ModifierDefinition<CountOptions> = {
  ...countSchema,
  mutatesRolls: false as const,

  validate: options => {
    if (
      options.deduct &&
      options.lessThanOrEqual !== undefined &&
      options.greaterThanOrEqual !== undefined &&
      options.lessThanOrEqual >= options.greaterThanOrEqual
    ) {
      throw new ModifierError(
        'count',
        `botchThreshold (${options.lessThanOrEqual}) must be less than threshold (${options.greaterThanOrEqual})`
      )
    }
  },

  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        if (options.deduct) {
          const aboveOptions = {
            ...(options.greaterThan !== undefined ? { greaterThan: options.greaterThan } : {}),
            ...(options.greaterThanOrEqual !== undefined
              ? { greaterThanOrEqual: options.greaterThanOrEqual }
              : {}),
            ...(options.exact !== undefined ? { exact: options.exact } : {})
          }
          const belowOptions = {
            ...(options.lessThan !== undefined ? { lessThan: options.lessThan } : {}),
            ...(options.lessThanOrEqual !== undefined
              ? { lessThanOrEqual: options.lessThanOrEqual }
              : {})
          }
          const aboveCount = currentRolls.filter(r => matchesComparison(r, aboveOptions)).length
          const belowCount = currentRolls.filter(r => matchesComparison(r, belowOptions)).length
          return aboveCount - belowCount
        }
        return currentRolls.filter(r => matchesComparison(r, options)).length
      }
    }
  }
}
