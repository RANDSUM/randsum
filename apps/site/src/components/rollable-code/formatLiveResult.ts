export interface DiceSegment {
  readonly value: number
  readonly dropped: boolean
}

/**
 * Finds the index of the last line containing a `// comment`.
 * Returns -1 if no such line exists.
 */
export function findLastCommentIndex(lines: string[]): number {
  return lines.reduceRight((found, line, i) => {
    if (found !== -1) return found
    return /\/\/\s*.+/.test(line) ? i : -1
  }, -1)
}

/**
 * Given the initial rolls and the post-modifier rolls, returns a Set
 * of indices (into `initial`) that were dropped/removed.
 *
 * Uses a greedy left-to-right matching strategy: for each value in
 * `modified`, consume the first matching index in `initial`.
 */
export function findDroppedIndices(
  initial: readonly number[],
  modified: readonly number[]
): Set<number> {
  const remaining = initial.reduce((map, val, i) => {
    const indices = map.get(val) ?? []
    return map.set(val, [...indices, i])
  }, new Map<number, number[]>())

  for (const val of modified) {
    const indices = remaining.get(val)
    if (indices && indices.length > 0) {
      indices.shift()
    }
  }

  const dropped = new Set<number>()
  for (const indices of remaining.values()) {
    for (const idx of indices) {
      dropped.add(idx)
    }
  }
  return dropped
}

/**
 * Builds the plain-text comment replacement string.
 * Dropped dice are marked with the combining long stroke overlay (U+0336).
 */
export function buildCommentText(
  segments: readonly DiceSegment[],
  total: number,
  _extraGroups: readonly { segments: readonly DiceSegment[]; bonus?: number }[]
): string {
  const formatGroup = (segs: readonly DiceSegment[]): string => {
    const parts = segs.map(s => (s.dropped ? `${s.value}\u0336` : String(s.value)))
    return `[${parts.join(', ')}]`
  }
  return `// ${formatGroup(segments)} = ${total}`
}
