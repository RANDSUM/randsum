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
  },

  docs: [
    {
      key: '#{..}',
      category: 'Counting',
      color: '#60a5fa',
      title: 'Count',
      description:
        'Count dice matching comparison conditions instead of summing values. More powerful than S{}/F{} sugar.',
      displayBase: '#{..}',
      comparisons: [
        { operator: '>=n', note: 'count dice showing n or more' },
        { operator: '>n', note: 'count dice showing more than n' },
        { operator: '<n', note: 'count dice showing less than n' },
        { operator: '<=n', note: 'count dice showing n or less' },
        { operator: '=n', note: 'count dice showing exactly n' }
      ],
      forms: [{ notation: '#{...}', note: 'Comma-separate multiple conditions' }],
      examples: [
        { notation: '5d10#{>=7}', description: 'Count dice >= 7' },
        { notation: '5d10#{>3,<1}', description: 'Count >3, deduct <1' }
      ]
    },
    {
      key: 'S{..}',
      category: 'Counting',
      color: '#3b82f6',
      title: 'Count Successes',
      description:
        'Count dice that meet a threshold instead of summing values \u2014 used in dice pool systems.',
      displayBase: 'S{..}',
      forms: [
        { notation: 'S{n}', note: 'Single success threshold' },
        { notation: 'S{n,b}', note: 'Threshold + botch threshold' }
      ],
      examples: [
        { notation: '5d10S{7}', description: 'Count dice that rolled 7 or higher' },
        { notation: '5d10S{7,1}', description: 'Successes \u2265 7, subtract botches \u2264 1' }
      ]
    },
    {
      key: 'F{..}',
      category: 'Counting',
      color: '#93c5fd',
      title: 'Count Failures',
      description:
        'Count dice at or below a threshold instead of summing values. Sugar for Count with lessThanOrEqual.',
      displayBase: 'F{..}',
      forms: [{ notation: 'F{N}', note: 'Count failures <= N' }],
      examples: [{ notation: '5d10F{3}', description: 'Count dice <= 3' }]
    },
    {
      key: 'ms{..}',
      category: 'Counting',
      color: '#6366f1',
      title: 'Margin of Success',
      description:
        'Subtract a target number from the total to get the margin of success or failure. Sugar for Minus N.',
      displayBase: 'ms{..}',
      forms: [{ notation: 'ms{N}', note: 'Subtract N from total' }],
      examples: [{ notation: '1d20ms{15}', description: 'Margin of success vs DC 15' }]
    }
  ]
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
