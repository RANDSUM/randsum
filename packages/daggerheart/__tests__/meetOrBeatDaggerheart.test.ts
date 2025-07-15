import { describe, expect, test } from 'bun:test'
import { meetOrBeatDaggerheart } from '../src/meetOrBeatDaggerheart'
import type {
  DaggerheartMeetOrBeatResult,
  DaggerheartRollArgument
} from '../src/types'

describe('meetOrBeatDaggerheart', () => {
  describe('basic functionality', () => {
    test('returns DaggerheartMeetOrBeatResult with correct structure', () => {
      const result = meetOrBeatDaggerheart(10)

      expect(result.result).toHaveProperty('type')
      expect(result.result).toHaveProperty('total')
      expect(result.result).toHaveProperty('rolls')
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('target')
      expect(result).toHaveProperty('description')

      expect(result.result.rolls).toHaveProperty('hope')
      expect(result.result.rolls).toHaveProperty('fear')
      expect(result.result.rolls).toHaveProperty('modifier')
      expect(result.result.rolls).toHaveProperty('advantage')
    })

    test('includes target difficulty class in result', () => {
      const difficultyClass = 15
      const result = meetOrBeatDaggerheart(difficultyClass)

      expect(result.target).toBe(difficultyClass)
    })

    test('includes formatted description', () => {
      const result = meetOrBeatDaggerheart(12)

      expect(typeof result.description).toBe('string')
      expect(result.description.length).toBeGreaterThan(0)
    })

    test('success is boolean', () => {
      const result = meetOrBeatDaggerheart(10)

      expect(typeof result.success).toBe('boolean')
    })
  })

  describe('success determination', () => {
    test('returns true when total meets difficulty class', () => {
      // Test with high modifier to ensure success
      const result = meetOrBeatDaggerheart(5, { modifier: 20 })

      expect(result.success).toBe(true)
      expect(result.result.total).toBeGreaterThanOrEqual(result.target)
    })

    test('returns false when total is below difficulty class', () => {
      // Test with very high difficulty class to ensure failure
      // Run multiple times since critical hope can still cause success
      let foundFailure = false

      for (let i = 0; i < 20; i++) {
        const result = meetOrBeatDaggerheart(50, { modifier: 0 })

        if (!result.success) {
          foundFailure = true
          expect(result.result.total).toBeLessThan(result.target)
          expect(result.result.type).not.toBe('critical hope') // Non-critical should fail
          break
        }
      }

      // Should find at least one failure with such a high DC
      expect(foundFailure).toBe(true)
    })

    test('critical hope always succeeds regardless of total', () => {
      let foundCriticalHope = false

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (!foundCriticalHope) {
        const result = meetOrBeatDaggerheart(100) // Very high DC

        if (result.result.type === 'critical hope') {
          foundCriticalHope = true
          expect(result.success).toBe(true)
          // Even if total is less than target, critical hope succeeds
          break
        }
      }

      // Note: This test may not always find a critical hope due to randomness
    })

    test('non-critical results follow normal success rules', () => {
      for (let i = 0; i < 20; i++) {
        const result = meetOrBeatDaggerheart(15, { modifier: 5 })

        if (result.result.type !== 'critical hope') {
          const expectedSuccess = result.result.total >= result.target
          expect(result.success).toBe(expectedSuccess)
        }
      }
    })
  })

  describe('difficulty class variations', () => {
    test('handles low difficulty class', () => {
      const result = meetOrBeatDaggerheart(1)

      expect(result.target).toBe(1)
      expect(result.success).toBe(true) // Should almost always succeed
    })

    test('handles medium difficulty class', () => {
      const result = meetOrBeatDaggerheart(12)

      expect(result.target).toBe(12)
      expect(typeof result.success).toBe('boolean')
    })

    test('handles high difficulty class', () => {
      const result = meetOrBeatDaggerheart(20)

      expect(result.target).toBe(20)
      expect(typeof result.success).toBe('boolean')
    })

    test('handles zero difficulty class', () => {
      const result = meetOrBeatDaggerheart(0)

      expect(result.target).toBe(0)
      expect(result.success).toBe(true) // Should always succeed
    })

    test('handles negative difficulty class', () => {
      const result = meetOrBeatDaggerheart(-5)

      expect(result.target).toBe(-5)
      expect(result.success).toBe(true) // Should always succeed
    })
  })

  describe('roll argument integration', () => {
    test('applies modifier correctly', () => {
      const modifier = 8
      const result = meetOrBeatDaggerheart(10, { modifier })

      expect(result.result.rolls.modifier).toBe(modifier)
      expect(result.result.total).toBeGreaterThanOrEqual(2 + modifier) // Min roll + modifier
    })

    test('handles advantage rolling', () => {
      const result = meetOrBeatDaggerheart(15, { rollingWith: 'Advantage' })

      if (result.result.rolls.advantage !== undefined) {
        expect(typeof result.result.rolls.advantage).toBe('number')
      }
    })

    test('handles disadvantage rolling', () => {
      const result = meetOrBeatDaggerheart(15, { rollingWith: 'Disadvantage' })

      if (result.result.rolls.advantage !== undefined) {
        expect(typeof result.result.rolls.advantage).toBe('number')
      }
    })

    test('handles amplify hope', () => {
      const result = meetOrBeatDaggerheart(15, { amplifyHope: true })

      // Hope die should potentially roll higher than 12
      expect(result.result.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.result.rolls.hope).toBeLessThanOrEqual(20)
    })

    test('handles amplify fear', () => {
      const result = meetOrBeatDaggerheart(15, { amplifyFear: true })

      // Fear die should potentially roll higher than 12
      expect(result.result.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.result.rolls.fear).toBeLessThanOrEqual(20)
    })

    test('handles complex roll arguments', () => {
      const result = meetOrBeatDaggerheart(18, {
        modifier: 3,
        rollingWith: 'Advantage',
        amplifyHope: true,
        amplifyFear: false
      })

      expect(result.result.rolls.modifier).toBe(3)
      expect(typeof result.result.rolls.advantage).toBe('number')
      expect(result.result.rolls.hope).toBeLessThanOrEqual(20 + 3) // Amplified + modifier
      expect(result.result.rolls.fear).toBeLessThanOrEqual(12 + 3) // Not amplified + modifier
    })
  })

  describe('description formatting', () => {
    test('description includes success/failure information', () => {
      const successResult = meetOrBeatDaggerheart(1, { modifier: 10 })
      const failureResult = meetOrBeatDaggerheart(50, { modifier: 0 })

      expect(typeof successResult.description).toBe('string')
      expect(typeof failureResult.description).toBe('string')
      expect(successResult.description).not.toBe(failureResult.description)
    })

    test('description includes roll type information', () => {
      for (let i = 0; i < 10; i++) {
        const result = meetOrBeatDaggerheart(12)

        // Check that description contains relevant keywords based on type
        if (result.result.type === 'critical hope') {
          expect(result.description).toContain('Critical')
          expect(result.description).toContain('Hope')
        } else {
          expect(result.description).toContain(result.result.type)
        }
      }
    })

    test('description format validation', () => {
      const result = meetOrBeatDaggerheart(15, { modifier: 2 })

      // Description should be a non-empty string
      expect(typeof result.description).toBe('string')
      expect(result.description.length).toBeGreaterThan(0)

      // Description should contain success/failure information
      expect(result.description).toMatch(/Success|Failure|Critical/i)
    })

    test('critical hope description differs from regular results', () => {
      let criticalDescription = ''
      let regularDescription = ''

      for (let i = 0; i < 100; i++) {
        const result = meetOrBeatDaggerheart(15)

        if (result.result.type === 'critical hope' && !criticalDescription) {
          criticalDescription = result.description
        } else if (
          result.result.type !== 'critical hope' &&
          !regularDescription
        ) {
          regularDescription = result.description
        }

        if (criticalDescription && regularDescription) {
          expect(criticalDescription).not.toBe(regularDescription)
          break
        }
      }
    })
  })

  describe('edge cases', () => {
    test('handles empty roll argument', () => {
      const result = meetOrBeatDaggerheart(10)

      expect(result.result.rolls.modifier).toBe(0)
      expect(result.result.rolls.advantage).toBeUndefined()
      expect(result.target).toBe(10)
    })

    test('handles very high difficulty class', () => {
      const result = meetOrBeatDaggerheart(1000)

      expect(result.target).toBe(1000)
      expect(result.success).toBe(
        result.result.type === 'critical hope' || result.result.total >= 1000
      )
    })

    test('handles fractional difficulty class', () => {
      const result = meetOrBeatDaggerheart(12.5)

      expect(result.target).toBe(12.5)
      expect(typeof result.success).toBe('boolean')
    })

    test('handles undefined roll argument properties', () => {
      const result = meetOrBeatDaggerheart(12, {
        modifier: undefined,
        rollingWith: undefined,
        amplifyHope: undefined,
        amplifyFear: undefined
      })

      expect(result.result.rolls.modifier).toBe(0)
      expect(result.result.rolls.advantage).toBeUndefined()
    })
  })

  describe('type validation', () => {
    test('returns proper DaggerheartMeetOrBeatResult structure', () => {
      const result: DaggerheartMeetOrBeatResult = meetOrBeatDaggerheart(15)

      // Inherits from DaggerheartRollResult
      expect(typeof result.result.type).toBe('string')
      expect(typeof result.result.total).toBe('number')
      expect(typeof result.result.rolls).toBe('object')

      // Additional properties
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.target).toBe('number')
      expect(typeof result.description).toBe('string')
    })

    test('accepts valid parameter types', () => {
      const validCalls = [
        () => meetOrBeatDaggerheart(10),
        () => meetOrBeatDaggerheart(15, { modifier: 5 }),
        () => meetOrBeatDaggerheart(0, { rollingWith: 'Advantage' }),
        () => meetOrBeatDaggerheart(-5, { amplifyHope: true }),
        () =>
          meetOrBeatDaggerheart(20.5, {
            modifier: 3,
            rollingWith: 'Disadvantage',
            amplifyFear: true
          })
      ]

      validCalls.forEach((call) => {
        expect(call).not.toThrow()
      })
    })
  })

  describe('consistency with rollDaggerheart', () => {
    test('roll properties match rollDaggerheart output', () => {
      const result = meetOrBeatDaggerheart(12, { modifier: 3 })

      // Should have same structure as rollDaggerheart result
      expect(result.result).toHaveProperty('type')
      expect(result.result).toHaveProperty('total')
      expect(result.result).toHaveProperty('rolls')
      expect(result.result.rolls).toHaveProperty('hope')
      expect(result.result.rolls).toHaveProperty('fear')
      expect(result.result.rolls).toHaveProperty('modifier')
      expect(result.result.rolls).toHaveProperty('advantage')

      expect(result.result.rolls.modifier).toBe(3)
    })

    test('maintains roll result integrity', () => {
      const rollArg: DaggerheartRollArgument = {
        modifier: 5,
        rollingWith: 'Advantage',
        amplifyHope: true
      }

      const result = meetOrBeatDaggerheart(15, rollArg)

      // Verify the roll was made with the correct parameters
      expect(result.result.rolls.modifier).toBe(5)
      expect(typeof result.result.rolls.advantage).toBe('number')
      expect(result.result.rolls.hope).toBeLessThanOrEqual(25) // Amplified d20 + modifier
    })
  })

  describe('performance and randomness', () => {
    test('produces varied results across multiple calls', () => {
      const results = Array.from({ length: 20 }, () =>
        meetOrBeatDaggerheart(12)
      )

      const uniqueTotals = new Set(results.map((r) => r.result.total))
      const successCount = results.filter((r) => r.success).length

      expect(uniqueTotals.size).toBeGreaterThan(1)
      expect(successCount).toBeGreaterThan(0)
      expect(successCount).toBeLessThan(20) // Some should fail
    })

    test('performs efficiently with multiple calls', () => {
      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        meetOrBeatDaggerheart(15, { modifier: i % 10 })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Should complete quickly
    })
  })
})
