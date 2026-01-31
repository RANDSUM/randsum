import type { DropOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import { formatHumanList, hasConditions, parseComparisonNotation } from '../../comparisonUtils'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

// Patterns for drop modifiers
const dropHighestPattern = /[Hh](\d+)?/g
const dropLowestPattern = /[Ll](\d+)?/g
const dropConstraintsPattern = /[Dd]\{([^}]{1,50})\}/

/**
 * Drop modifier - removes dice from the result pool.
 *
 * Notation:
 *   - H or H{N} - Drop highest (N defaults to 1)
 *   - L or L{N} - Drop lowest (N defaults to 1)
 *   - D{conditions} - Drop by condition (>N, <N, exact values)
 *
 * Examples:
 *   - 4d6L - Roll 4d6, drop lowest (D&D ability scores)
 *   - 2d20H - Roll 2d20, drop highest (disadvantage)
 *   - 4d6D{1} - Drop all 1s
 *   - 4d6LH - Drop both lowest and highest
 */
export const dropModifier: TypedModifierDefinition<'drop'> = defineModifier<'drop'>({
  name: 'drop',
  priority: 20,

  // Combined pattern matches H, L, or D{...}
  pattern: /([Hh](\d+)?|[Ll](\d+)?|[Dd]\{([^}]{1,50})\})/,

  parse: notation => {
    const drop: DropOptions = {}

    // Find all H (drop highest) occurrences
    const highestMatches = Array.from(notation.matchAll(dropHighestPattern))
    if (highestMatches.length > 0) {
      drop.highest = highestMatches.reduce((sum, match) => {
        return sum + (match[1] ? Number(match[1]) : 1)
      }, 0)
    }

    // Find all L (drop lowest) occurrences
    const lowestMatches = Array.from(notation.matchAll(dropLowestPattern))
    if (lowestMatches.length > 0) {
      drop.lowest = lowestMatches.reduce((sum, match) => {
        return sum + (match[1] ? Number(match[1]) : 1)
      }, 0)
    }

    // Check for D{...} constraints - use shared parser
    const constraintsMatch = dropConstraintsPattern.exec(notation)
    if (constraintsMatch?.[1]) {
      const parsed = parseComparisonNotation(constraintsMatch[1])
      if (parsed.greaterThan !== undefined) drop.greaterThan = parsed.greaterThan
      if (parsed.lessThan !== undefined) drop.lessThan = parsed.lessThan
      if (parsed.exact) drop.exact = parsed.exact
    }

    return hasConditions(drop) || drop.highest !== undefined || drop.lowest !== undefined
      ? { drop }
      : {}
  },

  toNotation: options => {
    const { highest, lowest, greaterThan, lessThan, exact } = options
    const parts: string[] = []

    if (highest) {
      parts.push(highest === 1 ? 'H' : `H${highest}`)
    }

    if (lowest) {
      parts.push(lowest === 1 ? 'L' : `L${lowest}`)
    }

    const dropList: string[] = []

    if (greaterThan !== undefined) {
      dropList.push(`>${greaterThan}`)
    }

    if (lessThan !== undefined) {
      dropList.push(`<${lessThan}`)
    }

    if (exact) {
      exact.forEach(roll => dropList.push(`${roll}`))
    }

    if (dropList.length > 0) {
      parts.push(`D{${dropList.join(',')}}`)
    }

    return parts.length ? parts.join('') : undefined
  },

  toDescription: options => {
    const { highest, lowest, greaterThan, lessThan, exact } = options
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

    if (greaterThan !== undefined) {
      descriptions.push(`Drop greater than [${greaterThan}]`)
    }

    if (lessThan !== undefined) {
      descriptions.push(`Drop less than [${lessThan}]`)
    }

    return descriptions
  },

  apply: (rolls, options) => {
    const { highest, lowest, greaterThan, lessThan, exact } = options

    const exactSet = exact ? new Set(exact) : null
    let result = rolls.filter(roll => {
      if (greaterThan !== undefined && roll > greaterThan) return false
      if (lessThan !== undefined && roll < lessThan) return false
      if (exactSet?.has(roll)) return false
      return true
    })

    if (highest !== undefined || lowest !== undefined) {
      const indexedRolls = result.map((roll, index) => ({ roll, index }))
      indexedRolls.sort((a, b) => a.roll - b.roll)

      const indicesToDrop = new Set<number>()

      if (lowest !== undefined) {
        for (let i = 0; i < Math.min(lowest, indexedRolls.length); i++) {
          const roll = indexedRolls[i]
          if (roll) {
            indicesToDrop.add(roll.index)
          }
        }
      }

      if (highest !== undefined) {
        for (
          let i = indexedRolls.length - 1;
          i >= Math.max(0, indexedRolls.length - highest);
          i--
        ) {
          const roll = indexedRolls[i]
          if (roll) {
            indicesToDrop.add(roll.index)
          }
        }
      }

      result = result.filter((_, index) => !indicesToDrop.has(index))

      if (lowest !== undefined && highest === undefined) {
        result.sort((a, b) => a - b)
      }
    }

    return { rolls: result }
  },

  validate: (options, { quantity }) => {
    const totalDrop = (options.lowest ?? 0) + (options.highest ?? 0)
    if (totalDrop >= quantity) {
      throw new ModifierError('drop', `Cannot drop ${totalDrop} dice from a pool of ${quantity}`)
    }
  }
})
