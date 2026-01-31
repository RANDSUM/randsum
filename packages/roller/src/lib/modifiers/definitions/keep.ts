import type { KeepOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

// Patterns for keep modifiers
const keepHighestPattern = /[Kk](?![Ll])(\d+)?/
const keepLowestPattern = /[Kk][Ll](\d+)?/i

/**
 * Keep modifier - keeps only specified dice from the result pool.
 * This is the complement to drop.
 *
 * Notation:
 *   - K or K{N} - Keep highest (N defaults to 1)
 *   - KL or KL{N} - Keep lowest (N defaults to 1)
 *
 * Examples:
 *   - 2d20K - Roll 2d20, keep highest (advantage)
 *   - 4d6K3 - Roll 4d6, keep highest 3
 */
export const keepModifier: TypedModifierDefinition<'keep'> = defineModifier<'keep'>({
  name: 'keep',
  priority: 21, // Just after drop

  pattern: /[Kk]([Ll])?(\d+)?/,

  parse: notation => {
    const keep: KeepOptions = {}

    // Check for KL (keep lowest) first since K alone means keep highest
    const lowestMatch = keepLowestPattern.exec(notation)
    if (lowestMatch) {
      keep.lowest = lowestMatch[1] ? Number(lowestMatch[1]) : 1
      return { keep }
    }

    // Check for K (keep highest)
    const highestMatch = keepHighestPattern.exec(notation)
    if (highestMatch) {
      keep.highest = highestMatch[1] ? Number(highestMatch[1]) : 1
      return { keep }
    }

    return {}
  },

  toNotation: options => {
    const { highest, lowest } = options
    const parts: string[] = []

    if (highest) {
      parts.push(highest === 1 ? 'K' : `K${highest}`)
    }

    if (lowest) {
      parts.push(lowest === 1 ? 'kl' : `kl${lowest}`)
    }

    return parts.length ? parts.join('') : undefined
  },

  toDescription: options => {
    const { highest, lowest } = options
    const descriptions: string[] = []

    if (highest) {
      descriptions.push(highest > 1 ? `Keep highest ${highest}` : 'Keep highest')
    }

    if (lowest) {
      descriptions.push(lowest > 1 ? `Keep lowest ${lowest}` : 'Keep lowest')
    }

    return descriptions
  },

  apply: (rolls, options) => {
    // Keep is implemented as the complement of drop
    const { highest, lowest } = options
    const quantity = rolls.length

    // Keep N highest = drop (quantity - N) lowest
    if (highest !== undefined) {
      const toDrop = quantity - highest
      if (toDrop <= 0) return { rolls }

      const indexedRolls = rolls.map((roll, index) => ({ roll, index }))
      indexedRolls.sort((a, b) => a.roll - b.roll)

      const indicesToDrop = new Set<number>()
      for (let i = 0; i < toDrop; i++) {
        const roll = indexedRolls[i]
        if (roll) indicesToDrop.add(roll.index)
      }

      return { rolls: rolls.filter((_, index) => !indicesToDrop.has(index)) }
    }

    // Keep N lowest = drop (quantity - N) highest
    if (lowest !== undefined) {
      const toDrop = quantity - lowest
      if (toDrop <= 0) return { rolls }

      const indexedRolls = rolls.map((roll, index) => ({ roll, index }))
      indexedRolls.sort((a, b) => a.roll - b.roll)

      const indicesToDrop = new Set<number>()
      for (let i = indexedRolls.length - 1; i >= indexedRolls.length - toDrop; i--) {
        const roll = indexedRolls[i]
        if (roll) indicesToDrop.add(roll.index)
      }

      return { rolls: rolls.filter((_, index) => !indicesToDrop.has(index)) }
    }

    return { rolls }
  },

  validate: (options, { quantity }) => {
    if (options.highest !== undefined) {
      if (options.highest > quantity || options.highest < 1) {
        throw new ModifierError(
          'keep',
          `Cannot keep ${options.highest} highest dice from a pool of ${quantity}`
        )
      }
    }
    if (options.lowest !== undefined) {
      if (options.lowest > quantity || options.lowest < 1) {
        throw new ModifierError(
          'keep',
          `Cannot keep ${options.lowest} lowest dice from a pool of ${quantity}`
        )
      }
    }
  }
})
