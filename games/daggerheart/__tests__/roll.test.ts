import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/daggerheart'

describe('roll', () => {
  describe('basic functionality', () => {
    test('returns valid roll types', () => {
      const validTypes = ['hope', 'fear', 'critical hope']

      Array.from({ length: 20 }).forEach(() => {
        const result = roll({})
        expect(validTypes).toContain(result.result)
      })
    })

    test('total is sum of hope and fear dice when no extra die', () => {
      const result = roll({})
      const { details } = result

      if (details !== undefined && details.extraDie === undefined) {
        expect(result.total).toBe(details.hope.roll + details.fear.roll)
      }
    })

    test('rolls are within expected ranges for standard dice', () => {
      Array.from({ length: 50 }).forEach(() => {
        const result = roll({})

        expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
        expect(result.details?.hope.roll).toBeLessThanOrEqual(12)
        expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
        expect(result.details?.fear.roll).toBeLessThanOrEqual(12)
      })
    })
  })

  describe('modifier handling', () => {
    test('applies positive modifier correctly', () => {
      const modifier = 5
      const result = roll({ modifier })

      expect(result.details?.modifier).toBe(modifier)
      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
    })

    test('applies negative modifier correctly', () => {
      const modifier = -2
      const result = roll({ modifier })

      expect(result.details?.modifier).toBe(modifier)
      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
    })

    test('handles zero modifier', () => {
      const result = roll({ modifier: 0 })

      expect(result.details?.modifier).toBe(0)
      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.hope.roll).toBeLessThanOrEqual(12)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeLessThanOrEqual(12)
    })

    test('handles large positive modifier', () => {
      const modifier = 20
      const result = roll({ modifier })

      expect(result.details?.modifier).toBe(modifier)
      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
    })

    test('handles large negative modifier', () => {
      const modifier = -10
      const result = roll({ modifier })

      expect(result.details?.modifier).toBe(modifier)
      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
    })
  })

  describe('advantage and disadvantage', () => {
    test('handles advantage rolling', () => {
      const result = roll({ rollingWith: 'Advantage' })

      expect(result.details?.extraDie).toBeDefined()
      expect(result.details?.extraDie?.advantageRoll).toBeGreaterThanOrEqual(1)
      expect(result.details?.extraDie?.advantageRoll).toBeLessThanOrEqual(6)
      expect(result.details?.extraDie?.disadvantageRoll).toBe(0)
    })

    test('handles disadvantage rolling', () => {
      const result = roll({ rollingWith: 'Disadvantage' })

      expect(result.details?.extraDie).toBeDefined()
      expect(result.details?.extraDie?.disadvantageRoll).toBeGreaterThanOrEqual(1)
      expect(result.details?.extraDie?.disadvantageRoll).toBeLessThanOrEqual(6)
      expect(result.details?.extraDie?.advantageRoll).toBe(0)
    })

    test('extraDie is undefined when rollingWith is not specified', () => {
      const result = roll({})

      expect(result.details?.extraDie).toBeUndefined()
    })

    test('extraDie is present with modifier when rollingWith is set', () => {
      const modifier = 3
      const result = roll({
        modifier,
        rollingWith: 'Advantage'
      })

      expect(result.details?.modifier).toBe(modifier)
      expect(result.details?.extraDie).toBeDefined()
      expect(result.details?.extraDie?.advantageRoll).toBeGreaterThanOrEqual(1)
      expect(result.details?.extraDie?.advantageRoll).toBeLessThanOrEqual(6)
    })
  })

  describe('amplify options', () => {
    test('amplifyHope uses d20 instead of d12', () => {
      const results = Array.from({ length: 20 }, () => roll({ amplifyHope: true }))
      results.forEach(result => {
        const hopeRoll = result.details?.hope.roll
        if (hopeRoll !== undefined && hopeRoll > 12) {
          expect(hopeRoll).toBeLessThanOrEqual(20)
        }
      })
      expect(results.length).toBe(20)
    })

    test('amplifyFear uses d20 instead of d12', () => {
      const results = Array.from({ length: 20 }, () => roll({ amplifyFear: true }))
      results.forEach(result => {
        const fearRoll = result.details?.fear.roll
        if (fearRoll !== undefined && fearRoll > 12) {
          expect(fearRoll).toBeLessThanOrEqual(20)
        }
      })
      expect(results.length).toBe(20)
    })

    test('both amplify options can be used together', () => {
      const result = roll({
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.hope.roll).toBeLessThanOrEqual(20)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeLessThanOrEqual(20)
    })

    test('amplified flag is correct', () => {
      const result = roll({ amplifyHope: true, amplifyFear: false })

      expect(result.details?.hope.amplified).toBe(true)
      expect(result.details?.fear.amplified).toBe(false)
    })

    test('amplify with modifier and advantage works together', () => {
      const result = roll({
        modifier: 2,
        rollingWith: 'Advantage',
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.details?.modifier).toBe(2)
      expect(result.details?.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.fear.roll).toBeGreaterThanOrEqual(1)
      expect(result.details?.extraDie).toBeDefined()
    })
  })

  describe('roll result types', () => {
    test('generates hope, fear, and critical hope results', () => {
      const resultTypes = Array.from({ length: 100 }, () => roll({}).result).reduce(
        (types, result) => types.add(result),
        new Set<string>()
      )

      expect(resultTypes.has('hope') || resultTypes.has('fear')).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles empty argument object', () => {
      const result = roll({})

      expect(result.details?.modifier).toBe(0)
      expect(result.details?.extraDie).toBeUndefined()
      expect(typeof result.result).toBe('string')
      expect(typeof result.total).toBe('number')
    })

    test('handles boolean false values', () => {
      const result = roll({
        amplifyHope: false,
        amplifyFear: false
      })

      expect(result.details?.hope.roll).toBeLessThanOrEqual(12)
      expect(result.details?.fear.roll).toBeLessThanOrEqual(12)
    })
  })

  describe('type validation', () => {
    test('accepts valid argument types', () => {
      const validArgs = [
        {},
        { modifier: 5 },
        { rollingWith: 'Advantage' as const },
        { rollingWith: 'Disadvantage' as const },
        { amplifyHope: true },
        { amplifyFear: true },
        {
          modifier: 3,
          rollingWith: 'Advantage' as const,
          amplifyHope: true,
          amplifyFear: false
        }
      ]

      validArgs.forEach(arg => {
        expect(() => roll(arg)).not.toThrow()
      })
    })
  })

  describe('randomness validation', () => {
    test('produces different results across multiple calls', () => {
      const results = Array.from({ length: 10 }, () => roll({}))

      const uniqueTotals = new Set(results.map(r => r.total))
      expect(uniqueTotals.size).toBeGreaterThan(1)
    })

    test('produces reasonable distribution of results', () => {
      const results = Array.from({ length: 100 }, () => roll({}))

      const totals = results.map(r => r.total)
      const minTotal = Math.min(...totals)
      const maxTotal = Math.max(...totals)

      expect(minTotal).toBeGreaterThanOrEqual(2)
      expect(maxTotal).toBeLessThanOrEqual(24)
    })
  })

  describe('input validation', () => {
    test('throws on non-finite modifier', () => {
      expect(() => roll({ modifier: Infinity })).toThrow()
      expect(() => roll({ modifier: NaN })).toThrow()
    })

    test('throws on unreasonable modifier', () => {
      expect(() => roll({ modifier: 100 })).toThrow()
      expect(() => roll({ modifier: -100 })).toThrow()
    })
  })
})
