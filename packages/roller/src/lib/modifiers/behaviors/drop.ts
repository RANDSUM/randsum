import type { DropOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import { matchesComparison } from '../../comparison/matchesComparison'
import type { ModifierBehavior } from '../schema'

export const dropBehavior: ModifierBehavior<DropOptions> = {
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
