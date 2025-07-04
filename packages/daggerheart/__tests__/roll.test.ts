import { describe, expect, test } from 'bun:test'
import { roll } from '../src/roll'
import type { RollArgument } from '../src/types'

describe('roll', () => {
  describe('return type', () => {
    test('returns a RollResult object with proper structure', () => {
      const args: RollArgument = { modifier: 0 }
      const result = roll(args)

      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('rolls')
      expect(['hope', 'fear', 'critical hope']).toContain(result.type)
      expect(typeof result.total).toBe('number')
      expect(result.rolls).toHaveProperty('hope')
      expect(result.rolls).toHaveProperty('fear')
      expect(result.rolls).toHaveProperty('modifier')
    })
  })

  describe('basic roll mechanics', () => {
    test('handles roll with positive modifier', () => {
      const args: RollArgument = { modifier: 3 }
      const result = roll(args)

      expect(result.rolls.modifier).toBe(3)
      expect(result.total).toBeGreaterThanOrEqual(5) // 2d12 + 3 minimum
      expect(result.total).toBeLessThanOrEqual(27) // 2d12 + 3 maximum
    })

    test('handles roll with negative modifier', () => {
      const args: RollArgument = { modifier: -2 }
      const result = roll(args)

      expect(result.rolls.modifier).toBe(-2)
      expect(result.total).toBeGreaterThanOrEqual(0) // 2d12 - 2 minimum
      expect(result.total).toBeLessThanOrEqual(22) // 2d12 - 2 maximum
    })

    test('handles roll with zero modifier', () => {
      const args: RollArgument = { modifier: 0 }
      const result = roll(args)

      expect(result.rolls.modifier).toBe(0)
      expect(result.total).toBeGreaterThanOrEqual(2) // 2d12 minimum
      expect(result.total).toBeLessThanOrEqual(24) // 2d12 maximum
    })
  })

  describe('hope and fear mechanics', () => {
    test('hope and fear dice are within valid ranges', () => {
      const args: RollArgument = { modifier: 0 }
      const result = roll(args)

      expect(result.rolls.hope).toBeGreaterThanOrEqual(1)
      expect(result.rolls.hope).toBeLessThanOrEqual(12)
      expect(result.rolls.fear).toBeGreaterThanOrEqual(1)
      expect(result.rolls.fear).toBeLessThanOrEqual(12)
    })

    test('returns consistent results across multiple rolls', () => {
      const loops = 50
      const args: RollArgument = { modifier: 1 }
      const results = Array.from({ length: loops }, () => roll(args))

      results.forEach((result) => {
        expect(['hope', 'fear', 'critical hope']).toContain(result.type)
        expect(result.total).toBeGreaterThanOrEqual(3) // 2d12 + 1 minimum
        expect(result.total).toBeLessThanOrEqual(25) // 2d12 + 1 maximum
        expect(result.rolls.modifier).toBe(1)
      })
    })
  })
})
