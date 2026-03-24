import type { KeepOptions } from '../notation/types'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import { ModifierError } from '../errors'
import type { ModifierDefinition } from './schema'
import { indicesByRank } from './poolSelection'
import type { NotationDoc } from '../docs/modifierDocs'

// keepMiddlePattern accepts an optional count argument (e.g. KM2, KM3).
// When N is given, N dice are dropped from each end (keeping pool - 2N).
// When bare KM is used, N defaults to 1 (keeping pool - 2).
// This parameterized form is intentional and documented in the `docs` array above.
// The formal spec defines bare KM; KM(n) is the extended form accepted by the code.
const keepMiddlePattern = /[Kk][Mm](\d+)?/
const keepHighestPattern = /[Kk](?![LlMm])(\d+)?/
const keepLowestPattern = /[Kk][Ll](\d+)?/i

export const keepSchema: NotationSchema<KeepOptions> = defineNotationSchema<KeepOptions>({
  name: 'keep',
  priority: 66,

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

  docs: [
    {
      key: 'K',
      category: 'Filter',
      color: '#fb923c',
      colorLight: '#c2410c',
      title: 'Keep Highest',
      description: 'Keep only the n highest-valued dice; discard the rest.',
      displayBase: 'K',
      forms: [{ notation: 'K(n)', note: 'Keep n highest (default: 1)' }],
      examples: [
        {
          description: 'Roll 2d20, keep highest (advantage)',
          notation: '2d20K',
          options: { sides: 20, quantity: 2, modifiers: { keep: { highest: 1 } } }
        },
        {
          description: 'Roll 4d6, keep highest 3',
          notation: '4d6K3',
          options: { sides: 6, quantity: 4, modifiers: { keep: { highest: 3 } } }
        }
      ]
    },
    {
      key: 'KL',
      category: 'Filter',
      color: '#f97316',
      colorLight: '#9a3412',
      title: 'Keep Lowest',
      description: 'Keep only the n lowest-valued dice; discard the rest.',
      displayBase: 'KL',
      forms: [{ notation: 'KL(n)', note: 'Keep n lowest (default: 1)' }],
      examples: [
        {
          description: 'Roll 2d20, keep lowest (disadvantage)',
          notation: '2d20KL',
          options: { sides: 20, quantity: 2, modifiers: { keep: { lowest: 1 } } }
        },
        {
          description: 'Roll 4d6, keep 2 lowest',
          notation: '4d6KL2',
          options: { sides: 6, quantity: 4, modifiers: { keep: { lowest: 2 } } }
        }
      ]
    },
    {
      key: 'KM',
      category: 'Filter',
      color: '#fdba74',
      colorLight: '#ea580c',
      title: 'Keep Middle',
      description:
        'Keep N dice closest to the middle of the pool by dropping equal numbers from both ends. Sugar for Drop lowest + Drop highest.',
      displayBase: 'KM',
      forms: [
        {
          notation: 'KM(n)',
          note: 'Keep middle n (default: pool - 2)'
        }
      ],
      examples: [
        {
          description: 'Keep 3 middle dice',
          notation: '5d6KM3'
        },
        {
          description: 'Keep middle 2',
          notation: '4d6KM',
          options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1, highest: 1 } } }
        }
      ]
    }
  ] satisfies readonly NotationDoc[],

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
