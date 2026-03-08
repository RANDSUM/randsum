import type { DropOptions } from '../../../types'
import { hasConditions, parseComparisonNotation } from '../../comparison'
import { formatHumanList } from '../../utils'
import { type NotationSchema, defineNotationSchema } from '../schema'

const dropHighestPattern = /[Hh](\d+)?/g
const dropLowestPattern = /(?<![Kk])[Ll](\d+)?/g
const dropConstraintsPattern = /[Dd]\{((?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*)\}/

export const dropSchema: NotationSchema<DropOptions> = defineNotationSchema<DropOptions>({
  name: 'drop',
  priority: 20,

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
  }
})
