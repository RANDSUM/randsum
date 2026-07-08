import type { KeepOptions } from '../notation/types'
import { keepSchema } from '../notation/definitions/keep'
import { ModifierError } from '../errors'
import type { ModifierDefinition } from './schema'
import { indicesByRank } from './poolSelection'

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
          `Cannot keep ${options.highest} highest dice from a pool of ${quantity}`,
          { path: 'modifiers.keep.highest', value: options.highest }
        )
      }
    }
    if (options.lowest !== undefined) {
      if (options.lowest > quantity || options.lowest < 1) {
        throw new ModifierError(
          'keep',
          `Cannot keep ${options.lowest} lowest dice from a pool of ${quantity}`,
          { path: 'modifiers.keep.lowest', value: options.lowest }
        )
      }
    }
  }
}
