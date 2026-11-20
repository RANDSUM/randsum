import type { DropOptions } from '../notation/types'
import { dropSchema } from '../notation/definitions/drop'
import { ModifierError } from '../errors'
import { matchesComparison } from '../lib/comparison/matchesComparison'
import type { ModifierDefinition } from './schema'
import { indicesByRank } from './poolSelection'

export const dropModifier: ModifierDefinition<DropOptions> = {
  ...dropSchema,

  apply: (rolls, options) => {
    const { highest, lowest } = options

    const filteredByConditions = rolls.filter(roll => !matchesComparison(roll, options))

    if (highest === undefined && lowest === undefined) {
      return { rolls: filteredByConditions }
    }

    // Positional drops leave the survivors in pool order. Among equal values the
    // earliest die goes, as it does for Keep, so an alias and its expansion agree.
    const lowestIndices = indicesByRank(filteredByConditions, lowest ?? 0, 'lowest')
    const afterLowest = filteredByConditions.map((roll, index) => ({ roll, index }))
    const candidates = afterLowest.filter(item => !lowestIndices.has(item.index))
    const highestRanks = indicesByRank(
      candidates.map(item => item.roll),
      highest ?? 0,
      'highest'
    )
    const highestIndices = new Set(
      candidates.filter((_, rank) => highestRanks.has(rank)).map(item => item.index)
    )

    return {
      rolls: filteredByConditions.filter(
        (_, index) => !lowestIndices.has(index) && !highestIndices.has(index)
      )
    }
  },

  validate: (options, { quantity }) => {
    const totalDrop = (options.lowest ?? 0) + (options.highest ?? 0)
    if (totalDrop >= quantity) {
      throw new ModifierError('drop', `Cannot drop ${totalDrop} dice from a pool of ${quantity}`, {
        path: 'modifiers.drop',
        value: options
      })
    }
  }
}
