import type { CountOptions } from '../notation/types'
import { parseComparisonNotation } from '../notation/comparison'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import { ModifierError } from '../errors'
import type { ModifierDefinition } from './schema'

const countPattern = /#\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const countSchema: NotationSchema<CountOptions> = defineNotationSchema<CountOptions>({
  name: 'count',
  priority: 95,

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

function matchesAbove(roll: number, options: CountOptions): boolean {
  if (options.greaterThanOrEqual !== undefined && roll >= options.greaterThanOrEqual) return true
  if (options.greaterThan !== undefined && roll > options.greaterThan) return true
  return false
}

function matchesBelow(roll: number, options: CountOptions): boolean {
  if (options.lessThanOrEqual !== undefined && roll <= options.lessThanOrEqual) return true
  if (options.lessThan !== undefined && roll < options.lessThan) return true
  return false
}

function matchesExact(roll: number, options: CountOptions): boolean {
  if (options.exact?.includes(roll)) return true
  return false
}

export const countModifier: ModifierDefinition<CountOptions> = {
  ...countSchema,

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
        const aboveCount = currentRolls.filter(r => matchesAbove(r, options)).length
        const belowCount = currentRolls.filter(r => matchesBelow(r, options)).length
        const exactCount = currentRolls.filter(r => matchesExact(r, options)).length

        if (options.deduct) {
          return aboveCount + exactCount - belowCount
        }
        return aboveCount + belowCount + exactCount
      }
    }
  }
}
