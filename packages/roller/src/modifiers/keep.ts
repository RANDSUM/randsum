import type { KeepOptions } from '../notation/types'
import { defineNotationSchema } from '../notation/schema'
import { ModifierError } from '../errors'
import type { ModifierDefinition } from './schema'
import { indicesByRank } from './poolSelection'

const keepMiddlePattern = /[Kk][Mm](\d+)?/
const keepHighestPattern = /[Kk](?![LlMm])(\d+)?/
const keepLowestPattern = /[Kk][Ll](\d+)?/i

export const keepSchema = defineNotationSchema<KeepOptions>({
  name: 'keep',
  priority: 21,

  pattern: /[Kk]([LlMm])?(\d+)?/,

  parse: notation => {
    const middleMatch = keepMiddlePattern.exec(notation)
    if (middleMatch) {
      const count = middleMatch[1] ? Number(middleMatch[1]) : 1
      return { drop: { lowest: count, highest: count } }
    }

    const keep: KeepOptions = {}

    const lowestMatch = keepLowestPattern.exec(notation)
    if (lowestMatch) {
      keep.lowest = lowestMatch[1] ? Number(lowestMatch[1]) : 1
      return { keep }
    }

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
  }
})

export const keepModifier: ModifierDefinition<KeepOptions> = {
  ...keepSchema,

  apply: (rolls, options) => {
    const { highest, lowest } = options
    const quantity = rolls.length

    if (highest !== undefined) {
      const toDrop = quantity - highest
      if (toDrop <= 0) return { rolls }

      const indicesToDrop = indicesByRank(rolls, toDrop, 'lowest')

      return { rolls: rolls.filter((_, index) => !indicesToDrop.has(index)) }
    }

    if (lowest !== undefined) {
      const toDrop = quantity - lowest
      if (toDrop <= 0) return { rolls }

      const indicesToDrop = indicesByRank(rolls, toDrop, 'highest')

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
}
