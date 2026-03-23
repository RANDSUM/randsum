import type { DropOptions } from '../notation/types'
import { hasConditions, parseComparisonNotation } from '../notation/comparison'
import { formatHumanList } from '../notation/formatHumanList'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import { ModifierError } from '../errors'
import { matchesComparison } from '../lib/comparison/matchesComparison'
import type { ModifierDefinition } from './schema'

const dropHighestPattern = /[Hh](\d+)?/g
const dropLowestPattern = /(?<![Kk])[Ll](\d+)?/g
const dropConstraintsPattern = /[Dd]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const dropSchema: NotationSchema<DropOptions> = defineNotationSchema<DropOptions>({
  name: 'drop',
  priority: 65,

  pattern:
    /([Hh](\d+)?|(?<![Kk])[Ll](\d+)?|[Dd]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\})/,

  parse: notation => {
    const drop: DropOptions = {}

    const highestMatches = Array.from(notation.matchAll(dropHighestPattern))
    if (highestMatches.length > 0) {
      drop.highest = highestMatches.reduce((sum, match) => {
        return sum + (match[1] ? Number(match[1]) : 1)
      }, 0)
    }

    const lowestMatches = Array.from(notation.matchAll(dropLowestPattern))
    if (lowestMatches.length > 0) {
      drop.lowest = lowestMatches.reduce((sum, match) => {
        return sum + (match[1] ? Number(match[1]) : 1)
      }, 0)
    }

    const constraintsMatch = dropConstraintsPattern.exec(notation)
    if (constraintsMatch?.[1]) {
      const parsed = parseComparisonNotation(constraintsMatch[1])
      if (parsed.greaterThan !== undefined) drop.greaterThan = parsed.greaterThan
      if (parsed.greaterThanOrEqual !== undefined)
        drop.greaterThanOrEqual = parsed.greaterThanOrEqual
      if (parsed.lessThan !== undefined) drop.lessThan = parsed.lessThan
      if (parsed.lessThanOrEqual !== undefined) drop.lessThanOrEqual = parsed.lessThanOrEqual
      if (parsed.exact) drop.exact = parsed.exact
    }

    return hasConditions(drop) || drop.highest !== undefined || drop.lowest !== undefined
      ? { drop }
      : {}
  },

  toNotation: options => {
    const { highest, lowest, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } =
      options
    const parts: string[] = []

    if (highest) {
      parts.push(highest === 1 ? 'H' : `H${highest}`)
    }

    if (lowest) {
      parts.push(lowest === 1 ? 'L' : `L${lowest}`)
    }

    const dropList: string[] = []

    if (greaterThanOrEqual !== undefined) dropList.push(`>=${greaterThanOrEqual}`)
    if (greaterThan !== undefined) dropList.push(`>${greaterThan}`)
    if (lessThanOrEqual !== undefined) dropList.push(`<=${lessThanOrEqual}`)
    if (lessThan !== undefined) dropList.push(`<${lessThan}`)
    if (exact) exact.forEach(roll => dropList.push(`${roll}`))

    if (dropList.length > 0) {
      parts.push(`D{${dropList.join(',')}}`)
    }

    return parts.length ? parts.join('') : undefined
  },

  toDescription: options => {
    const { highest, lowest, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } =
      options
    const descriptions: string[] = []

    if (highest) {
      descriptions.push(highest > 1 ? `Drop highest ${highest}` : 'Drop highest')
    }

    if (lowest) {
      descriptions.push(lowest > 1 ? `Drop lowest ${lowest}` : 'Drop lowest')
    }

    if (exact) {
      descriptions.push(`Drop ${formatHumanList(exact)}`)
    }

    if (greaterThanOrEqual !== undefined) {
      descriptions.push(`Drop greater than or equal to ${greaterThanOrEqual}`)
    }

    if (greaterThan !== undefined) {
      descriptions.push(`Drop greater than ${greaterThan}`)
    }

    if (lessThanOrEqual !== undefined) {
      descriptions.push(`Drop less than or equal to ${lessThanOrEqual}`)
    }

    if (lessThan !== undefined) {
      descriptions.push(`Drop less than ${lessThan}`)
    }

    return descriptions
  },

  docs: [
    {
      key: 'L',
      category: 'Filter',
      color: '#fb7185',
      colorLight: '#e11d48',
      title: 'Drop Lowest',
      description: 'Remove the lowest-valued dice from the pool before summing.',
      displayBase: 'L',
      displayOptional: 'n',
      forms: [{ notation: 'L(n)', note: 'Drop n lowest (default: 1)' }],
      examples: [
        {
          notation: '4d6L',
          description: 'Roll 4d6, drop lowest (ability scores)'
        },
        { notation: '5d6L2', description: 'Roll 5d6, drop 2 lowest' }
      ],
      optionsExamples: [
        {
          description: 'Drop lowest 1',
          options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }
        },
        {
          description: 'Drop lowest 2',
          options: { sides: 6, quantity: 5, modifiers: { drop: { lowest: 2 } } }
        }
      ]
    },
    {
      key: 'H',
      category: 'Filter',
      color: '#fb7185',
      colorLight: '#e11d48',
      title: 'Drop Highest',
      description: 'Remove the highest-valued dice from the pool before summing.',
      displayBase: 'H',
      displayOptional: 'n',
      forms: [{ notation: 'H(n)', note: 'Drop n highest (default: 1)' }],
      examples: [
        {
          notation: '2d20H',
          description: 'Roll 2d20, drop highest (disadvantage)'
        },
        { notation: '4d6H', description: 'Roll 4d6, drop highest' }
      ],
      optionsExamples: [
        {
          description: 'Drop highest 1',
          options: { sides: 20, quantity: 2, modifiers: { drop: { highest: 1 } } }
        },
        {
          description: 'Drop highest 2',
          options: { sides: 6, quantity: 5, modifiers: { drop: { highest: 2 } } }
        }
      ]
    },
    {
      key: 'D{..}',
      category: 'Filter',
      color: '#e11d48',
      colorLight: '#9f1239',
      title: 'Drop by Condition',
      description:
        'Drop any dice matching a condition \u2014 more flexible than L/H for arbitrary thresholds.',
      displayBase: 'D{..}',
      forms: [{ notation: 'D{...}', note: 'Comma-separate multiple conditions' }],
      comparisons: [
        { operator: 'n', note: 'drop dice showing exactly n' },
        { operator: '>n', note: 'drop dice showing more than n' },
        { operator: '>=n', note: 'drop dice showing n or more' },
        { operator: '<n', note: 'drop dice showing less than n' },
        { operator: '<=n', note: 'drop dice showing n or less' }
      ],
      examples: [
        { notation: '4d6D{1}', description: 'Drop all 1s' },
        { notation: '4d6D{>=5}', description: 'Drop all 5s and above' },
        {
          notation: '4d6D{<=2}',
          description: 'Drop any result of 2 or lower'
        },
        { notation: '4d6D{1,6}', description: 'Drop multiple' }
      ],
      optionsExamples: [
        {
          description: 'Drop all 1s',
          options: { sides: 6, quantity: 4, modifiers: { drop: { exact: [1] } } }
        },
        {
          description: 'Drop 5 and above',
          options: { sides: 6, quantity: 4, modifiers: { drop: { greaterThanOrEqual: 5 } } }
        }
      ]
    }
  ]
})

export const dropModifier: ModifierDefinition<DropOptions> = {
  ...dropSchema,

  apply: (rolls, options) => {
    const { highest, lowest } = options

    const filteredByConditions = rolls.filter(roll => !matchesComparison(roll, options))

    if (highest === undefined && lowest === undefined) {
      return { rolls: filteredByConditions }
    }

    const indexedRolls = filteredByConditions.map((roll, index) => ({ roll, index }))
    indexedRolls.sort((a, b) => a.roll - b.roll)

    const lowestIndices =
      lowest !== undefined
        ? new Set(
            indexedRolls.slice(0, Math.min(lowest, indexedRolls.length)).map(item => item.index)
          )
        : new Set<number>()

    const highestIndices =
      highest !== undefined
        ? new Set(
            indexedRolls.slice(Math.max(0, indexedRolls.length - highest)).map(item => item.index)
          )
        : new Set<number>()

    const indicesToDrop = new Set([...lowestIndices, ...highestIndices])
    const result = filteredByConditions.filter((_, index) => !indicesToDrop.has(index))

    if (lowest !== undefined && highest === undefined) {
      return { rolls: [...result].sort((a, b) => a - b) }
    }

    return { rolls: result }
  },

  validate: (options, { quantity }) => {
    const totalDrop = (options.lowest ?? 0) + (options.highest ?? 0)
    if (totalDrop >= quantity) {
      throw new ModifierError('drop', `Cannot drop ${totalDrop} dice from a pool of ${quantity}`)
    }
  }
}
