import { describe, expect, test } from 'bun:test'
import { CONFORMANCE_FILE } from '../src/conformance/vectors'

const { vectors, conformanceLevels } = CONFORMANCE_FILE
const vectorById = new Map(vectors.map(v => [v.id, v]))

describe('CONFORMANCE_FILE — top-level shape', () => {
  test('specVersion is set', () => {
    expect(CONFORMANCE_FILE.specVersion).toMatch(/^\d+\.\d+\.\d+/)
  })

  test('vectors array is non-empty', () => {
    expect(vectors.length).toBeGreaterThan(0)
  })

  test('conformanceLevels has all five buckets', () => {
    expect(Object.keys(conformanceLevels).sort()).toEqual([
      'errorCases',
      'level1_core',
      'level2_vtt',
      'level3_extended',
      'level4_full'
    ])
  })
})

describe('vector IDs are unique', () => {
  test('no duplicate ids across all vectors', () => {
    const ids = vectors.map(v => v.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('every id is a positive integer', () => {
    for (const v of vectors) {
      expect(Number.isInteger(v.id)).toBe(true)
      expect(v.id).toBeGreaterThan(0)
    }
  })
})

describe('every conformance level references real vector ids', () => {
  test.each([
    ['level1_core', conformanceLevels.level1_core],
    ['level2_vtt', conformanceLevels.level2_vtt],
    ['level3_extended', conformanceLevels.level3_extended],
    ['level4_full', conformanceLevels.level4_full],
    ['errorCases', conformanceLevels.errorCases]
  ])('%s entries all exist in vectors[]', (_, ids) => {
    for (const id of ids) {
      expect(vectorById.has(id)).toBe(true)
    }
  })

  test('each level has no duplicate ids', () => {
    for (const [name, ids] of Object.entries(conformanceLevels)) {
      const unique = new Set(ids)
      expect(unique.size, `${name} contains duplicate ids`).toBe(ids.length)
    }
  })
})

describe('conformance level subset relationships', () => {
  test('level1_core ⊆ level2_vtt (every L1 vector appears at L2)', () => {
    const l2 = new Set(conformanceLevels.level2_vtt)
    for (const id of conformanceLevels.level1_core) {
      expect(l2.has(id)).toBe(true)
    }
  })

  test('level2_vtt ⊆ level3_extended', () => {
    const l3 = new Set(conformanceLevels.level3_extended)
    for (const id of conformanceLevels.level2_vtt) {
      expect(l3.has(id)).toBe(true)
    }
  })

  test('level3_extended ⊆ level4_full', () => {
    const l4 = new Set(conformanceLevels.level4_full)
    for (const id of conformanceLevels.level3_extended) {
      expect(l4.has(id)).toBe(true)
    }
  })

  test('errorCases are disjoint from non-error levels', () => {
    const errs = new Set(conformanceLevels.errorCases)
    for (const lvl of ['level1_core', 'level2_vtt', 'level3_extended', 'level4_full'] as const) {
      for (const id of conformanceLevels[lvl]) {
        expect(errs.has(id), `vector ${id} is both ${lvl} and errorCases`).toBe(false)
      }
    }
  })
})

describe('vector fields are well-formed', () => {
  test('every vector has a non-empty notation string', () => {
    for (const v of vectors) {
      expect(typeof v.notation).toBe('string')
      expect(v.notation.length).toBeGreaterThan(0)
    }
  })

  test('every vector has a category and a section reference', () => {
    for (const v of vectors) {
      expect(typeof v.category).toBe('string')
      expect(v.category.length).toBeGreaterThan(0)
      expect(typeof v.section).toBe('string')
      expect(v.section.length).toBeGreaterThan(0)
    }
  })

  test('conformanceLevel is an integer in [1,4]', () => {
    for (const v of vectors) {
      expect(Number.isInteger(v.conformanceLevel)).toBe(true)
      expect(v.conformanceLevel).toBeGreaterThanOrEqual(1)
      expect(v.conformanceLevel).toBeLessThanOrEqual(4)
    }
  })
})

describe('non-error vectors have full rollout data', () => {
  const nonError = vectors.filter(v => v.category !== 'error_cases')

  test('seedRolls present and non-empty', () => {
    for (const v of nonError) {
      expect(Array.isArray(v.seedRolls)).toBe(true)
      expect(v.seedRolls?.length ?? 0).toBeGreaterThan(0)
    }
  })

  test('expectedPool is an array (possibly null only when indeterminate is documented via note)', () => {
    for (const v of nonError) {
      if (v.expectedPool === null) {
        expect(typeof v.note).toBe('string')
        continue
      }
      expect(Array.isArray(v.expectedPool)).toBe(true)
    }
  })

  test('expectedTotal is a finite number or explicitly null', () => {
    for (const v of nonError) {
      if (v.expectedTotal === null) continue
      expect(typeof v.expectedTotal).toBe('number')
      expect(Number.isFinite(v.expectedTotal!)).toBe(true)
    }
  })

  test('when both expectedPool and expectedTotal are numeric, total = sum of numeric pool entries', () => {
    for (const v of nonError) {
      const pool = v.expectedPool
      const total = v.expectedTotal
      if (!Array.isArray(pool) || typeof total !== 'number') continue
      const numericOnly = pool.every(x => typeof x === 'number')
      if (!numericOnly) continue
      // Sum check is opt-in: some vectors mutate via count/sum-replacement modifiers,
      // so we only sum-validate for the dice_expressions category where pool == total invariant holds.
      if (v.category !== 'dice_expressions') continue
      const sum = (pool as readonly number[]).reduce((a, b) => a + b, 0)
      expect(sum, `vector ${v.id} (${v.notation}) pool sum mismatch`).toBe(total)
    }
  })
})

describe('error_cases are well-formed', () => {
  const errVectors = vectors.filter(v => v.category === 'error_cases')

  test('every error_cases vector has expectedError: true', () => {
    for (const v of errVectors) {
      expect(v.expectedError).toBe(true)
    }
  })

  test('every error_cases vector appears in conformanceLevels.errorCases', () => {
    const errSet = new Set(conformanceLevels.errorCases)
    for (const v of errVectors) {
      expect(errSet.has(v.id)).toBe(true)
    }
  })

  test('error_cases vectors have no expectedPool / expectedTotal', () => {
    for (const v of errVectors) {
      expect(v.expectedPool).toBeUndefined()
      expect(v.expectedTotal).toBeUndefined()
    }
  })
})

describe('vector category coverage', () => {
  test('every vector category appears in the documented enum', () => {
    const knownCategories = new Set([
      'aliases',
      'case_insensitivity',
      'dice_expressions',
      'error_cases',
      'extended_coverage',
      'non_modifier_features',
      'stage1_modifiers',
      'stage2_modifiers',
      'stage3_modifiers'
    ])
    for (const v of vectors) {
      expect(knownCategories.has(v.category), `unknown category: ${v.category}`).toBe(true)
    }
  })
})
