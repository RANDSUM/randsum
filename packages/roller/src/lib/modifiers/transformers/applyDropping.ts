import type { DropOptions } from '../../../types'

export function applyDropping(rolls: number[], options: DropOptions): number[] {
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
      for (let i = indexedRolls.length - 1; i >= Math.max(0, indexedRolls.length - highest); i--) {
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

  return result
}
