import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'
import type { RandomFn } from '../../../src/types'

// Always returns max face: coreRandom with () => 0.99 → Math.floor(sides * 0.99) = max
const alwaysMax: RandomFn = () => 0.99

describe('S09.1 — Explosion Depth Safety Limit', () => {
  describe('basic explode (!)', () => {
    test('1d6! with always-max RNG terminates and has a finite total', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { explode: true } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('1d6! notation terminates with always-max RNG', () => {
      const result = roll('1d6!', { randomFn: alwaysMax })
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('3d6! terminates and result exists', () => {
      const result = roll(
        { sides: 6, quantity: 3, modifiers: { explode: true } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThan(0)
    })
  })

  describe('compound explode (!!)', () => {
    test('1d6!! unlimited (depth=0) terminates with always-max RNG', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { compound: 0 } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
      // Capped at DEFAULT_EXPLOSION_DEPTH (1000) iterations
      expect(result.total).toBeLessThanOrEqual(6 * 1001)
    })

    test('1d6!! with depth=5 terminates and total is bounded', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { compound: 5 } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(result.total).toBeLessThanOrEqual(6 * 6)
    })
  })

  describe('penetrate explode (!p)', () => {
    test('1d6!p unlimited (depth=0) terminates with always-max RNG', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { penetrate: 0 } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('1d6!p with depth=3 terminates and total is bounded', () => {
      const result = roll(
        { sides: 6, quantity: 1, modifiers: { penetrate: 3 } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      // 6 + (6-1) + (6-1) + (6-1) = 21 max with penetrate (each continuation -1)
      expect(result.total).toBeLessThanOrEqual(21)
    })
  })

  describe('stress: termination across many rolls', () => {
    test('200 rolls of 4d6! all terminate with finite totals', () => {
      Array.from({ length: 200 }, () => roll('4d6!')).forEach(({ total }) => {
        expect(Number.isFinite(total)).toBe(true)
        expect(total).toBeGreaterThan(0)
      })
    })
  })
})
