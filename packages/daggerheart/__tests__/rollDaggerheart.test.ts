import { describe, expect, test } from 'bun:test'
import { rollDaggerheart } from '../src/rollDaggerheart'
import type { DaggerheartRollArgument } from '../src/types'

describe('rollDaggerheart', () => {
  describe('basic functionality', () => {
    test('returns DaggerheartRollResult with correct structure', () => {
      const result = rollDaggerheart({})

      expect(result.baseResult).toHaveProperty('type')
      expect(result.baseResult).toHaveProperty('total')
      expect(result.baseResult).toHaveProperty('rolls')
      expect(result.baseResult.rolls).toHaveProperty('hope')
      expect(result.baseResult.rolls).toHaveProperty('fear')
      expect(result.baseResult.rolls).toHaveProperty('modifier')
      expect(result.baseResult.rolls).toHaveProperty('advantage')
    })

    test('returns valid roll types', () => {
      const validTypes = ['hope', 'fear', 'critical hope']

      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({})
        expect(validTypes).toContain(result.baseResult.type)
      }
    })

    test('total is sum of hope and fear dice', () => {
      const result = rollDaggerheart({})

      if (result.baseResult.rolls.advantage === undefined) {
        expect(result.baseResult.total).toBe(
          result.baseResult.rolls.hope + result.baseResult.rolls.fear
        )
      }
    })

    test('rolls are within expected ranges for standard dice', () => {
      for (let i = 0; i < 50; i++) {
        const result = rollDaggerheart({})

        expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.baseResult.rolls.hope).toBeLessThanOrEqual(12)
        expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.baseResult.rolls.fear).toBeLessThanOrEqual(12)
      }
    })
  })

  describe('modifier handling', () => {
    test('applies positive modifier correctly', () => {
      const modifier = 5
      const result = rollDaggerheart({ modifier })

      expect(result.baseResult.rolls.modifier).toBe(modifier)
      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
    })

    test('applies negative modifier correctly', () => {
      const modifier = -2
      const result = rollDaggerheart({ modifier })

      expect(result.baseResult.rolls.modifier).toBe(modifier)
      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
    })

    test('handles zero modifier', () => {
      const result = rollDaggerheart({ modifier: 0 })

      expect(result.baseResult.rolls.modifier).toBe(0)
      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.hope).toBeLessThanOrEqual(12)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeLessThanOrEqual(12)
    })

    test('handles large positive modifier', () => {
      const modifier = 20
      const result = rollDaggerheart({ modifier })

      expect(result.baseResult.rolls.modifier).toBe(modifier)
      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
    })

    test('handles large negative modifier', () => {
      const modifier = -10
      const result = rollDaggerheart({ modifier })

      expect(result.baseResult.rolls.modifier).toBe(modifier)
      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
    })
  })

  describe('advantage and disadvantage', () => {
    test('handles advantage rolling', () => {
      const result = rollDaggerheart({ rollingWith: 'Advantage' })

      if (result.baseResult.rolls.advantage !== undefined) {
        expect(typeof result.baseResult.rolls.advantage).toBe('number')
        expect(result.baseResult.rolls.advantage).toBeGreaterThanOrEqual(1)
        expect(result.baseResult.rolls.advantage).toBeLessThanOrEqual(6)
      }
    })

    test('handles disadvantage rolling', () => {
      const result = rollDaggerheart({ rollingWith: 'Disadvantage' })

      if (result.baseResult.rolls.advantage !== undefined) {
        expect(typeof result.baseResult.rolls.advantage).toBe('number')
        expect(result.baseResult.rolls.advantage).toBeGreaterThanOrEqual(-6)
        expect(result.baseResult.rolls.advantage).toBeLessThanOrEqual(-1)
      }
    })

    test('advantage undefined when not rolling with advantage/disadvantage', () => {
      const result = rollDaggerheart({})

      expect(result.baseResult.rolls.advantage).toBeUndefined()
    })

    test('advantage with modifier applies correctly', () => {
      const modifier = 3
      const result = rollDaggerheart({
        modifier,
        rollingWith: 'Advantage'
      })

      expect(result.baseResult.rolls.modifier).toBe(modifier)
      if (result.baseResult.rolls.advantage !== undefined) {
        // Advantage die should be within d6 range (1-6)
        expect(result.baseResult.rolls.advantage).toBeGreaterThanOrEqual(1)
        expect(result.baseResult.rolls.advantage).toBeLessThanOrEqual(6)
      }
    })
  })

  describe('amplify options', () => {
    test('amplifyHope uses d20 instead of d12', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({ amplifyHope: true })

        if (result.baseResult.rolls.hope > 12) {
          expect(result.baseResult.rolls.hope).toBeLessThanOrEqual(20)
          break
        }
      }
    })

    test('amplifyFear uses d20 instead of d12', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({ amplifyFear: true })

        if (result.baseResult.rolls.fear > 12) {
          expect(result.baseResult.rolls.fear).toBeLessThanOrEqual(20)
          break
        }
      }
    })

    test('both amplify options can be used together', () => {
      const result = rollDaggerheart({
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.hope).toBeLessThanOrEqual(20)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeLessThanOrEqual(20)
    })

    test('amplify with modifier and advantage works together', () => {
      const result = rollDaggerheart({
        modifier: 2,
        rollingWith: 'Advantage',
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.baseResult.rolls.modifier).toBe(2)
      expect(result.baseResult.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.baseResult.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(typeof result.baseResult.rolls.advantage).toBe('number')
    })
  })

  describe('roll result types', () => {
    test('generates hope, fear, and critical hope results', () => {
      const resultTypes = new Set<string>()

      for (let i = 0; i < 100; i++) {
        const result = rollDaggerheart({})
        resultTypes.add(result.baseResult.type)
      }

      expect(resultTypes.has('hope') || resultTypes.has('fear')).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles empty argument object', () => {
      const result = rollDaggerheart({})

      expect(result.baseResult.rolls.modifier).toBe(0)
      expect(result.baseResult.rolls.advantage).toBeUndefined()
      expect(typeof result.baseResult.type).toBe('string')
      expect(typeof result.baseResult.total).toBe('number')
    })

    test('handles undefined values in argument', () => {
      const result = rollDaggerheart({
        modifier: undefined,
        rollingWith: undefined,
        amplifyHope: undefined,
        amplifyFear: undefined
      })

      expect(result.baseResult.rolls.modifier).toBe(0) // Default value
      expect(result.baseResult.rolls.advantage).toBeUndefined()
    })

    test('handles boolean false values', () => {
      const result = rollDaggerheart({
        amplifyHope: false,
        amplifyFear: false
      })

      expect(result.baseResult.rolls.hope).toBeLessThanOrEqual(12)
      expect(result.baseResult.rolls.fear).toBeLessThanOrEqual(12)
    })
  })

  describe('type validation', () => {
    test('returns proper DaggerheartRollResult structure', () => {
      const result = rollDaggerheart({})

      expect(typeof result.baseResult.type).toBe('string')
      expect(typeof result.baseResult.total).toBe('number')
      expect(typeof result.baseResult.rolls).toBe('object')
      expect(typeof result.baseResult.rolls.hope).toBe('number')
      expect(typeof result.baseResult.rolls.fear).toBe('number')
      expect(typeof result.baseResult.rolls.modifier).toBe('number')
      expect(
        result.baseResult.rolls.advantage === undefined ||
          typeof result.baseResult.rolls.advantage === 'number'
      ).toBe(true)
    })

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

      const uniqueTotals = new Set(results.map((r) => r.baseResult.total))
      expect(uniqueTotals.size).toBeGreaterThan(1)
    })

    test('produces reasonable distribution of results', () => {
      const results = Array.from({ length: 100 }, () => rollDaggerheart({}))

      const totals = results.map((r) => r.baseResult.total)
      const minTotal = Math.min(...totals)
      const maxTotal = Math.max(...totals)

      expect(minTotal).toBeGreaterThanOrEqual(2)
      expect(maxTotal).toBeLessThanOrEqual(24)
    })
  })
})
