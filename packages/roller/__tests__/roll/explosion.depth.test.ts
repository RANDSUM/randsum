import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import type { RandomFn } from '../../src/types'

// RNG that triggers max face every time: coreRandom(6, ()=>0.99) = Math.floor(5.94) = 5 + 1 = 6
const alwaysMax: RandomFn = () => 0.99

describe('explosion depth limits', () => {
  describe('compound (!!)', () => {
    test('unlimited compound (!!0) terminates without hanging', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { compound: 0 } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      if (!result.error) {
        expect(Number.isFinite(result.total)).toBe(true)
        // With always-max RNG, total = 6 * (DEFAULT_EXPLOSION_DEPTH + 1) at most
        expect(result.total).toBeLessThanOrEqual(6 * 1001)
      }
    })

    test('compound with explicit depth=3 produces at most 4x die value', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { compound: 3 } },
        { randomFn: alwaysMax }
      )
      expect(result.error).toBeNull()
      // initial(6) + 3 extra rolls(6) = 24 max
      expect(result.total).toBeLessThanOrEqual(24)
    })

    test('compound depth=true (default) triggers once', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { compound: true } },
        { randomFn: alwaysMax }
      )
      expect(result.error).toBeNull()
      expect(result.total).toBeLessThanOrEqual(12) // 6 + 6
    })
  })

  describe('penetrate (!p)', () => {
    test('unlimited penetrate (!p0) terminates without hanging', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { penetrate: 0 } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      if (!result.error) {
        expect(Number.isFinite(result.total)).toBe(true)
      }
    })

    test('penetrate depth=3 produces at most 6+(5+5+5)=21', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { penetrate: 3 } },
        { randomFn: alwaysMax }
      )
      expect(result.error).toBeNull()
      expect(result.total).toBeLessThanOrEqual(21) // 6 + (6-1) + (6-1) + (6-1)
    })
  })

  describe('explode (!)', () => {
    test('basic explode only adds one wave of extra dice (no chaining)', () => {
      const result = roll(
        { sides: 6, quantity: 3, modifiers: { explode: true } },
        { randomFn: alwaysMax }
      )
      expect(result.error).toBeNull()
      // 3 original all roll 6 → 3 extra dice. Basic explode does not chain.
      expect(result.rolls[0]?.rolls.length).toBeLessThanOrEqual(6)
    })
  })
})
