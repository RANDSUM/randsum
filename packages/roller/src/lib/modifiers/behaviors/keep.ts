import type { KeepOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import type { ModifierBehavior } from '../schema'

export const keepBehavior: ModifierBehavior<KeepOptions> = {
  apply: (rolls, options) => {
    const { highest, lowest } = options
    const quantity = rolls.length

    if (highest !== undefined) {
      const toDrop = quantity - highest
      if (toDrop <= 0) return { rolls }

      const indexedRolls = rolls.map((roll, index) => ({ roll, index }))
      indexedRolls.sort((a, b) => a.roll - b.roll)

      const indicesToDrop = new Set(indexedRolls.slice(0, toDrop).map(item => item.index))

      return { rolls: rolls.filter((_, index) => !indicesToDrop.has(index)) }
    }

    if (lowest !== undefined) {
      const toDrop = quantity - lowest
      if (toDrop <= 0) return { rolls }

      const indexedRolls = rolls.map((roll, index) => ({ roll, index }))
      indexedRolls.sort((a, b) => a.roll - b.roll)

      const indicesToDrop = new Set(
        indexedRolls.slice(indexedRolls.length - toDrop).map(item => item.index)
      )

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
