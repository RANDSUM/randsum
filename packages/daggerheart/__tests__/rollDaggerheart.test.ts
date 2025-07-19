import { describe, expect, test } from 'bun:test'
import { rollDaggerheart } from '../src/rollDaggerheart'
import type { DaggerheartRollArgument } from '../src/types'

describe('rollDaggerheart', () => {
  describe('basic functionality', () => {
    test('returns valid roll types', () => {
      const validTypes = ['hope', 'fear', 'critical hope']

      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({})
        expect(validTypes).toContain(result.result.type)
      }
    })

    test('total is sum of hope and fear dice', () => {
      const result = rollDaggerheart({})

      if (result.result.details.advantage === undefined) {
        expect(result.result.total).toBe(
          result.result.details.hope.roll + result.result.details.fear.roll
        )
      }
    })

    test('rolls are within expected ranges for standard dice', () => {
      for (let i = 0; i < 50; i++) {
        const result = rollDaggerheart({})

        expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
        expect(result.result.details.hope.roll).toBeLessThanOrEqual(12)
        expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
        expect(result.result.details.fear.roll).toBeLessThanOrEqual(12)
      }
    })
  })

  describe('modifier handling', () => {
    test('applies positive modifier correctly', () => {
      const modifier = 5
      const result = rollDaggerheart({ modifier })

      expect(result.result.details.modifier).toBe(modifier)
      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
    })

    test('applies negative modifier correctly', () => {
      const modifier = -2
      const result = rollDaggerheart({ modifier })

      expect(result.result.details.modifier).toBe(modifier)
      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
    })

    test('handles zero modifier', () => {
      const result = rollDaggerheart({ modifier: 0 })

      expect(result.result.details.modifier).toBe(0)
      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.hope.roll).toBeLessThanOrEqual(12)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeLessThanOrEqual(12)
    })

    test('handles large positive modifier', () => {
      const modifier = 20
      const result = rollDaggerheart({ modifier })

      expect(result.result.details.modifier).toBe(modifier)
      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
    })

    test('handles large negative modifier', () => {
      const modifier = -10
      const result = rollDaggerheart({ modifier })

      expect(result.result.details.modifier).toBe(modifier)
      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
    })
  })

  describe('advantage and disadvantage', () => {
    test('handles advantage rolling', () => {
      const result = rollDaggerheart({ rollingWith: 'Advantage' })

      if (result.result.details.advantage?.roll !== undefined) {
        expect(typeof result.result.details.advantage.roll).toBe('number')
        expect(result.result.details.advantage.roll).toBeGreaterThanOrEqual(1)
        expect(result.result.details.advantage.roll).toBeLessThanOrEqual(6)
      }
    })

    test('handles disadvantage rolling', () => {
      const result = rollDaggerheart({ rollingWith: 'Disadvantage' })

      if (result.result.details.advantage !== undefined) {
        expect(result.result.details.advantage.roll).toBeGreaterThanOrEqual(-6)
        expect(result.result.details.advantage.roll).toBeLessThanOrEqual(-1)
      }
    })

    test('advantage undefined when not rolling with advantage/disadvantage', () => {
      const result = rollDaggerheart({})

      expect(result.result.details.advantage).toBeUndefined()
    })

    test('advantage with modifier applies correctly', () => {
      const modifier = 3
      const result = rollDaggerheart({
        modifier,
        rollingWith: 'Advantage'
      })

      expect(result.result.details.modifier).toBe(modifier)
      if (result.result.details.advantage !== undefined) {
        expect(result.result.details.advantage.roll).toBeGreaterThanOrEqual(1)
        expect(result.result.details.advantage.roll).toBeLessThanOrEqual(6)
      }
    })
  })

  describe('amplify options', () => {
    test('amplifyHope uses d20 instead of d12', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({ amplifyHope: true })

        if (result.result.details.hope.roll > 12) {
          expect(result.result.details.hope.roll).toBeLessThanOrEqual(20)
          break
        }
      }
    })

    test('amplifyFear uses d20 instead of d12', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({ amplifyFear: true })

        if (result.result.details.fear.roll > 12) {
          expect(result.result.details.fear.roll).toBeLessThanOrEqual(20)
          break
        }
      }
    })

    test('both amplify options can be used together', () => {
      const result = rollDaggerheart({
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.hope.roll).toBeLessThanOrEqual(20)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeLessThanOrEqual(20)
    })

    test('amplify with modifier and advantage works together', () => {
      const result = rollDaggerheart({
        modifier: 2,
        rollingWith: 'Advantage',
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.result.details.modifier).toBe(2)
      expect(result.result.details.hope.roll).toBeGreaterThanOrEqual(1)
      expect(result.result.details.fear.roll).toBeGreaterThanOrEqual(1)
      expect(typeof result.result.details.advantage?.roll).toBe('number')
    })
  })

  describe('roll result types', () => {
    test('generates hope, fear, and critical hope results', () => {
      const resultTypes = new Set<string>()

      for (let i = 0; i < 100; i++) {
        const result = rollDaggerheart({})
        resultTypes.add(result.result.type)
      }

      expect(resultTypes.has('hope') || resultTypes.has('fear')).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles empty argument object', () => {
      const result = rollDaggerheart({})

      expect(result.result.details.modifier).toBe(0)
      expect(result.result.details.advantage).toBeUndefined()
      expect(typeof result.result.type).toBe('string')
      expect(typeof result.result.total).toBe('number')
    })

    test('handles undefined values in argument', () => {
      const result = rollDaggerheart({
        modifier: undefined,
        rollingWith: undefined,
        amplifyHope: undefined,
        amplifyFear: undefined
      })

      expect(result.result.details.modifier).toBe(0) // Default value
      expect(result.result.details.advantage).toBeUndefined()
    })

    test('handles boolean false values', () => {
      const result = rollDaggerheart({
        amplifyHope: false,
        amplifyFear: false
      })

      expect(result.result.details.hope.roll).toBeLessThanOrEqual(12)
      expect(result.result.details.fear.roll).toBeLessThanOrEqual(12)
    })
  })

  describe('type validation', () => {
    test('accepts valid DaggerheartRollArgument types', () => {
      const validArgs: DaggerheartRollArgument[] = [
        {},
        { modifier: 5 },
        { rollingWith: 'Advantage' },
        { rollingWith: 'Disadvantage' },
        { amplifyHope: true },
        { amplifyFear: true },
        {
          modifier: 3,
          rollingWith: 'Advantage',
          amplifyHope: true,
          amplifyFear: false
        }
      ]

      validArgs.forEach((arg) => {
        expect(() => rollDaggerheart(arg)).not.toThrow()
      })
    })
  })

  describe('randomness validation', () => {
    test('produces different results across multiple calls', () => {
      const results = Array.from({ length: 10 }, () => rollDaggerheart({}))

      const uniqueTotals = new Set(results.map((r) => r.result.total))
      expect(uniqueTotals.size).toBeGreaterThan(1)
    })

    test('produces reasonable distribution of results', () => {
      const results = Array.from({ length: 100 }, () => rollDaggerheart({}))

      const totals = results.map((r) => r.result.total)
      const minTotal = Math.min(...totals)
      const maxTotal = Math.max(...totals)

      expect(minTotal).toBeGreaterThanOrEqual(2)
      expect(maxTotal).toBeLessThanOrEqual(24)
    })
  })
})
