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
  },

  docs: [
    {
      key: '#{..}',
      category: 'Reinterpret',
      color: '#60a5fa',
      colorLight: '#2563eb',
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
      category: 'Reinterpret',
      color: '#3b82f6',
      colorLight: '#1d4ed8',
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
      category: 'Reinterpret',
      color: '#93c5fd',
      colorLight: '#3b82f6',
      title: 'Count Failures',
      description:
        'Count dice at or below a threshold instead of summing values. Sugar for Count with lessThanOrEqual.',
      displayBase: 'F{..}',
      forms: [{ notation: 'F{N}', note: 'Count failures <= N' }],
      examples: [{ notation: '5d10F{3}', description: 'Count dice <= 3' }]
    },
    {
      key: 'ms{..}',
      category: 'Scale',
      color: '#6366f1',
      colorLight: '#4338ca',
      title: 'Margin of Success',
      description:
        'Subtract a target number from the total to get the margin of success or failure. Sugar for Minus N.',
      displayBase: 'ms{..}',
      forms: [{ notation: 'ms{N}', note: 'Subtract N from total' }],
      examples: [{ notation: '1d20ms{15}', description: 'Margin of success vs DC 15' }]
    }
  ]
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
