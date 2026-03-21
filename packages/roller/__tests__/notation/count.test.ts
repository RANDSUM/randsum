import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'

describe('count notation (#{...})', () => {
  describe('pattern matching', () => {
    test('#{>=7} matches the count pattern', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.pattern.test('#{>=7}')).toBe(true)
    })

    test('#{<=3} matches the count pattern', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.pattern.test('#{<=3}')).toBe(true)
    })

    test('#{>5} matches the count pattern', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.pattern.test('#{>5}')).toBe(true)
    })

    test('#{<2} matches the count pattern', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.pattern.test('#{<2}')).toBe(true)
    })

    test('#{=6} matches the count pattern', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.pattern.test('#{=6}')).toBe(true)
    })

    test('#{>=7,<=1} matches the count pattern', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.pattern.test('#{>=7,<=1}')).toBe(true)
    })
  })

  describe('parse', () => {
    test('parses #{>=7} correctly', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10#{>=7}')
      expect(result).toEqual({ count: { greaterThanOrEqual: 7 } })
    })

    test('parses #{<=3} correctly', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10#{<=3}')
      expect(result).toEqual({ count: { lessThanOrEqual: 3 } })
    })

    test('parses #{>5} correctly', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10#{>5}')
      expect(result).toEqual({ count: { greaterThan: 5 } })
    })

    test('parses #{<2} correctly', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10#{<2}')
      expect(result).toEqual({ count: { lessThan: 2 } })
    })

    test('parses #{=6} correctly', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10#{=6}')
      expect(result).toEqual({ count: { exact: [6] } })
    })

    test('parses #{>=7,<=1} with deduct', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10#{>=7,<=1}')
      expect(result).toEqual({
        count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true }
      })
    })

    test('returns empty when no match', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const result = countSchema.parse('5d10')
      expect(result).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats greaterThanOrEqual', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toNotation({ greaterThanOrEqual: 7 })).toBe('#{>=7}')
    })

    test('formats lessThanOrEqual', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toNotation({ lessThanOrEqual: 3 })).toBe('#{<=3}')
    })

    test('formats greaterThan', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toNotation({ greaterThan: 5 })).toBe('#{>5}')
    })

    test('formats lessThan', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toNotation({ lessThan: 2 })).toBe('#{<2}')
    })

    test('formats exact', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toNotation({ exact: [6] })).toBe('#{=6}')
    })

    test('formats combined with deduct', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(
        countSchema.toNotation({ greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true })
      ).toBe('#{>=7,<=1}')
    })

    test('returns undefined for empty options', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toNotation({})).toBeUndefined()
    })
  })

  describe('toDescription', () => {
    test('describes greaterThanOrEqual', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toDescription({ greaterThanOrEqual: 7 })).toEqual([
        'Count dice greater than or equal to 7'
      ])
    })

    test('describes lessThanOrEqual', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toDescription({ lessThanOrEqual: 3 })).toEqual([
        'Count dice less than or equal to 3'
      ])
    })

    test('describes greaterThan', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toDescription({ greaterThan: 5 })).toEqual(['Count dice greater than 5'])
    })

    test('describes lessThan', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toDescription({ lessThan: 2 })).toEqual(['Count dice less than 2'])
    })

    test('describes exact', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.toDescription({ exact: [6] })).toEqual(['Count dice equal to 6'])
    })

    test('describes combined with deduct', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      const desc = countSchema.toDescription({
        greaterThanOrEqual: 7,
        lessThanOrEqual: 1,
        deduct: true
      })
      expect(desc).toEqual([
        'Count dice greater than or equal to 7, deduct dice less than or equal to 1'
      ])
    })
  })

  describe('priority', () => {
    test('has priority 80', async () => {
      const { countSchema } = await import('../../src/notation/definitions/count')
      expect(countSchema.priority).toBe(80)
    })
  })

  describe('isDiceNotation integration', () => {
    test('5d10#{>=7} is valid notation', () => {
      expect(isDiceNotation('5d10#{>=7}')).toBe(true)
    })

    test('5d10#{<=3} is valid notation', () => {
      expect(isDiceNotation('5d10#{<=3}')).toBe(true)
    })

    test('5d10#{>=7,<=1} is valid notation', () => {
      expect(isDiceNotation('5d10#{>=7,<=1}')).toBe(true)
    })
  })

  describe('S{} sugar desugars to count', () => {
    test('S{7} parses to count with greaterThanOrEqual', async () => {
      const { countSuccessesSchema } = await import('../../src/notation/definitions/countSuccesses')
      const result = countSuccessesSchema.parse('5d10S{7}')
      expect(result).toEqual({ count: { greaterThanOrEqual: 7 } })
    })

    test('S{7,1} parses to count with deduct', async () => {
      const { countSuccessesSchema } = await import('../../src/notation/definitions/countSuccesses')
      const result = countSuccessesSchema.parse('5d10S{7,1}')
      expect(result).toEqual({
        count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true }
      })
    })
  })

  describe('F{} sugar desugars to count', () => {
    test('F{3} parses to count with lessThanOrEqual', async () => {
      const { countFailuresSchema } = await import('../../src/notation/definitions/countFailures')
      const result = countFailuresSchema.parse('5d10F{3}')
      expect(result).toEqual({ count: { lessThanOrEqual: 3 } })
    })
  })
})
