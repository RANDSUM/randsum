/**
 * Get indices of dice to remove by positional rank.
 * Returns a Set of array indices for the N lowest or highest values.
 */
export function indicesByRank(
  rolls: readonly number[],
  count: number,
  direction: 'lowest' | 'highest'
): Set<number> {
  const indexed = rolls.map((value, index) => ({ value, index }))

  if (direction === 'lowest') {
    indexed.sort((a, b) => a.value - b.value)
  } else {
    indexed.sort((a, b) => b.value - a.value)
  }

  return new Set(indexed.slice(0, count).map(entry => entry.index))
}
