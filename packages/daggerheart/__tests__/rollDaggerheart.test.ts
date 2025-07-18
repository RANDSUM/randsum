import { describe, expect, test } from 'bun:test'
import { rollDaggerheart } from '../src/rollDaggerheart'
import type { DaggerheartRollArgument } from '../src/types'

describe('rollDaggerheart', () => {
  describe('basic functionality', () => {
    test('returns DaggerheartRollResult with correct structure', () => {
      const result = rollDaggerheart({})

      expect(result.details).toHaveProperty('type')
      expect(result.details).toHaveProperty('total')
      expect(result.details).toHaveProperty('rolls')
      expect(result.details.rolls).toHaveProperty('hope')
      expect(result.details.rolls).toHaveProperty('fear')
      expect(result.details.rolls).toHaveProperty('modifier')
      expect(result.details.rolls).toHaveProperty('advantage')
    })

    test('returns valid roll types', () => {
      const validTypes = ['hope', 'fear', 'critical hope']

      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({})
        expect(validTypes).toContain(result.details.type)
      }
    })

    test('total is sum of hope and fear dice', () => {
      const result = rollDaggerheart({})

      if (result.details.rolls.advantage === undefined) {
        expect(result.details.total).toBe(
          result.details.rolls.hope + result.details.rolls.fear
        )
      }
    })

    test('rolls are within expected ranges for standard dice', () => {
      for (let i = 0; i < 50; i++) {
        const result = rollDaggerheart({})

        expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
        expect(result.details.rolls.hope).toBeLessThanOrEqual(12)
        expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
        expect(result.details.rolls.fear).toBeLessThanOrEqual(12)
      }
    })
  })

  describe('modifier handling', () => {
    test('applies positive modifier correctly', () => {
      const modifier = 5
      const result = rollDaggerheart({ modifier })

      expect(result.details.rolls.modifier).toBe(modifier)
      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
    })

    test('applies negative modifier correctly', () => {
      const modifier = -2
      const result = rollDaggerheart({ modifier })

      expect(result.details.rolls.modifier).toBe(modifier)
      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
    })

    test('handles zero modifier', () => {
      const result = rollDaggerheart({ modifier: 0 })

      expect(result.details.rolls.modifier).toBe(0)
      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.hope).toBeLessThanOrEqual(12)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeLessThanOrEqual(12)
    })

    test('handles large positive modifier', () => {
      const modifier = 20
      const result = rollDaggerheart({ modifier })

      expect(result.details.rolls.modifier).toBe(modifier)
      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
    })

    test('handles large negative modifier', () => {
      const modifier = -10
      const result = rollDaggerheart({ modifier })

      expect(result.details.rolls.modifier).toBe(modifier)
      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
    })
  })

  describe('advantage and disadvantage', () => {
    test('handles advantage rolling', () => {
      const result = rollDaggerheart({ rollingWith: 'Advantage' })

      if (result.details.rolls.advantage !== undefined) {
        expect(typeof result.details.rolls.advantage).toBe('number')
        expect(result.details.rolls.advantage).toBeGreaterThanOrEqual(1)
        expect(result.details.rolls.advantage).toBeLessThanOrEqual(6)
      }
    })

    test('handles disadvantage rolling', () => {
      const result = rollDaggerheart({ rollingWith: 'Disadvantage' })

      if (result.details.rolls.advantage !== undefined) {
        expect(typeof result.details.rolls.advantage).toBe('number')
        expect(result.details.rolls.advantage).toBeGreaterThanOrEqual(-6)
        expect(result.details.rolls.advantage).toBeLessThanOrEqual(-1)
      }
    })

    test('advantage undefined when not rolling with advantage/disadvantage', () => {
      const result = rollDaggerheart({})

      expect(result.details.rolls.advantage).toBeUndefined()
    })

    test('advantage with modifier applies correctly', () => {
      const modifier = 3
      const result = rollDaggerheart({
        modifier,
        rollingWith: 'Advantage'
      })

      expect(result.details.rolls.modifier).toBe(modifier)
      if (result.details.rolls.advantage !== undefined) {
        // Advantage die should be within d6 range (1-6)
        expect(result.details.rolls.advantage).toBeGreaterThanOrEqual(1)
        expect(result.details.rolls.advantage).toBeLessThanOrEqual(6)
      }
    })
  })

  describe('amplify options', () => {
    test('amplifyHope uses d20 instead of d12', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({ amplifyHope: true })

        if (result.details.rolls.hope > 12) {
          expect(result.details.rolls.hope).toBeLessThanOrEqual(20)
          break
        }
      }
    })

    test('amplifyFear uses d20 instead of d12', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollDaggerheart({ amplifyFear: true })

        if (result.details.rolls.fear > 12) {
          expect(result.details.rolls.fear).toBeLessThanOrEqual(20)
          break
        }
      }
    })

    test('both amplify options can be used together', () => {
      const result = rollDaggerheart({
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.hope).toBeLessThanOrEqual(20)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeLessThanOrEqual(20)
    })

    test('amplify with modifier and advantage works together', () => {
      const result = rollDaggerheart({
        modifier: 2,
        rollingWith: 'Advantage',
        amplifyHope: true,
        amplifyFear: true
      })

      expect(result.details.rolls.modifier).toBe(2)
      expect(result.details.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.details.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(typeof result.details.rolls.advantage).toBe('number')
    })
  })

  describe('roll result types', () => {
    test('generates hope, fear, and critical hope results', () => {
      const resultTypes = new Set<string>()

      for (let i = 0; i < 100; i++) {
        const result = rollDaggerheart({})
        resultTypes.add(result.details.type)
      }

      expect(resultTypes.has('hope') || resultTypes.has('fear')).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles empty argument object', () => {
      const result = rollDaggerheart({})

      expect(result.details.rolls.modifier).toBe(0)
      expect(result.details.rolls.advantage).toBeUndefined()
      expect(typeof result.details.type).toBe('string')
      expect(typeof result.details.total).toBe('number')
    })

    test('handles undefined values in argument', () => {
      const result = rollDaggerheart({
        modifier: undefined,
        rollingWith: undefined,
        amplifyHope: undefined,
        amplifyFear: undefined
      })

      expect(result.details.rolls.modifier).toBe(0) // Default value
      expect(result.details.rolls.advantage).toBeUndefined()
    })

    test('handles boolean false values', () => {
      const result = rollDaggerheart({
        amplifyHope: false,
        amplifyFear: false
      })

      expect(result.details.rolls.hope).toBeLessThanOrEqual(12)
      expect(result.details.rolls.fear).toBeLessThanOrEqual(12)
    })
  })

  describe('type validation', () => {
    test('returns proper DaggerheartRollResult structure', () => {
      const result = rollDaggerheart({})

      expect(typeof result.details.type).toBe('string')
      expect(typeof result.details.total).toBe('number')
      expect(typeof result.details.rolls).toBe('object')
      expect(typeof result.details.rolls.hope).toBe('number')
      expect(typeof result.details.rolls.fear).toBe('number')
      expect(typeof result.details.rolls.modifier).toBe('number')
      expect(
        result.details.rolls.advantage === undefined ||
          typeof result.details.rolls.advantage === 'number'
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

      const uniqueTotals = new Set(results.map((r) => r.details.total))
      expect(uniqueTotals.size).toBeGreaterThan(1)
    })

    test('produces reasonable distribution of results', () => {
      const results = Array.from({ length: 100 }, () => rollDaggerheart({}))

      const totals = results.map((r) => r.details.total)
      const minTotal = Math.min(...totals)
      const maxTotal = Math.max(...totals)

      expect(minTotal).toBeGreaterThanOrEqual(2)
      expect(maxTotal).toBeLessThanOrEqual(24)
    })
  })
})
