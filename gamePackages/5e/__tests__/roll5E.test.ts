import { describe, expect, test } from 'bun:test'
import { roll5e } from '../src/roll5e'
import type { RollArgument5e } from '../src/types'

describe('roll5e', () => {
  describe('basic roll', () => {
    const args: RollArgument5e = { modifier: 5 }

    test('returns a result within valid range', () => {
      const result = roll5e(args)
      expect(result.total).toBeGreaterThanOrEqual(6) // 1 + 5
      expect(result.total).toBeLessThanOrEqual(25) // 20 + 5
    })

    test('applies modifier correctly', () => {
      const result = roll5e(args)
      const rawRoll = result.rawResult[0]
      expect(result.total).toBe(Number(rawRoll) + args.modifier)
    })

    test('returns single roll result', () => {
      const result = roll5e(args)
      expect(result.rawResult).toHaveLength(1)
    })
  })

  describe('with advantage', () => {
    const args: RollArgument5e = {
      modifier: 5,
      rollingWith: 'Advantage'
    }

    test('returns two rolls', () => {
      const result = roll5e(args)
      expect(result.rawResult).toHaveLength(2)
    })

    test('uses higher roll for total', () => {
      const result = roll5e(args)
      const [roll1, roll2] = result.rawResult
      const expectedTotal = Math.max(roll1, roll2) + args.modifier
      expect(result.total).toBe(expectedTotal)
    })
  })

  describe('with disadvantage', () => {
    const args: RollArgument5e = {
      modifier: 5,
      rollingWith: 'Disadvantage'
    }

    test('returns two rolls', () => {
      const result = roll5e(args)
      expect(result.rawResult).toHaveLength(2)
    })

    test.only('uses lower roll for total', () => {
      const result = roll5e(args)
      const [roll1, roll2] = result.rawResult
      const expectedTotal = Math.min(roll1, roll2) + args.modifier
      expect(result.total).toBe(expectedTotal)
    })
  })

  describe('with negative modifier', () => {
    const args: RollArgument5e = { modifier: -3 }

    test('returns a result within valid range', () => {
      const result = roll5e(args)
      expect(result.total).toBeGreaterThanOrEqual(-2) // 1 - 3
      expect(result.total).toBeLessThanOrEqual(17) // 20 - 3
    })

    test('applies negative modifier correctly', () => {
      const result = roll5e(args)
      const rawRoll = result.rawResult[0]
      expect(result.total).toBe(Number(rawRoll) + args.modifier)
    })
  })
})
