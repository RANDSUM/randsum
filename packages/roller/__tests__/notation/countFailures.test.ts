import { describe, expect, test } from 'bun:test'

describe('countFailures notation', () => {
  // Tests will use the schema once implemented
  // For now, test the pattern matching and parsing

  describe('pattern matching', () => {
    test('F{3} matches the countFailures pattern', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.pattern.test('F{3}')).toBe(true)
    })

    test('f{5} matches (case-insensitive)', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.pattern.test('f{5}')).toBe(true)
    })

    test('F{10} matches with multi-digit threshold', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.pattern.test('F{10}')).toBe(true)
    })

    test('dF does not match (Fate die)', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.pattern.test('dF')).toBe(false)
    })

    test('F without braces does not match', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.pattern.test('F3')).toBe(false)
    })
  })

  describe('parse', () => {
    test('parses F{3} correctly (desugars to count)', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      const result = countFailuresSchema.parse('5d10F{3}')
      expect(result).toEqual({ count: { lessThanOrEqual: 3 } })
    })

    test('parses f{7} correctly (desugars to count)', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      const result = countFailuresSchema.parse('10d6f{7}')
      expect(result).toEqual({ count: { lessThanOrEqual: 7 } })
    })

    test('returns empty when no match', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      const result = countFailuresSchema.parse('5d10')
      expect(result).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('generates F{N} notation', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.toNotation({ lessThanOrEqual: 3 })).toBe('F{3}')
    })
  })

  describe('toDescription', () => {
    test('generates readable description', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      const desc = countFailuresSchema.toDescription({ lessThanOrEqual: 3 })
      expect(desc).toEqual(['Count failures at or below 3'])
    })
  })

  describe('priority', () => {
    test('has priority 80 (same as count, as it is an alias)', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      expect(countFailuresSchema.priority).toBe(80)
    })
  })
})
