import type { ConformanceLevels, ConformanceVector } from './types'

/** The four conformance levels (spec Section 10), each a superset of the one before. */
export const LEVELS: readonly { readonly level: 1 | 2 | 3 | 4; readonly name: string }[] = [
  { level: 1, name: 'Core' },
  { level: 2, name: 'VTT Baseline' },
  { level: 3, name: 'Extended' },
  { level: 4, name: 'Full' }
]

const LEVEL_KEYS = ['level1_core', 'level2_vtt', 'level3_extended', 'level4_full'] as const

/** The non-error vector ids a level requires, from a file's `conformanceLevels`. */
export function idsForLevel(levels: ConformanceLevels, level: number): readonly number[] {
  const key = LEVEL_KEYS[level - 1]
  if (key === undefined) throw new RangeError(`There is no conformance level ${level}`)
  return levels[key]
}

/**
 * Derive `conformanceLevels` from each vector's `conformanceLevel`: a level requires its
 * own vectors and every lower level's (Sections 10 and 11.4), and error vectors are
 * required at every level. The vectors file stores the result; this checks it.
 */
export function levelsOf(vectors: readonly ConformanceVector[]): ConformanceLevels {
  const upTo = (level: number): number[] =>
    vectors.filter(v => !v.expectedError && v.conformanceLevel <= level).map(v => v.id)
  return {
    level1_core: upTo(1),
    level2_vtt: upTo(2),
    level3_extended: upTo(3),
    level4_full: upTo(4),
    errorCases: vectors.filter(v => v.expectedError).map(v => v.id)
  }
}
