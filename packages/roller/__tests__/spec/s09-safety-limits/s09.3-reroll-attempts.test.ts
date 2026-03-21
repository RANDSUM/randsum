import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'

describe('S09.3 — Reroll Attempt Cap', () => {
  describe('impossible reroll condition terminates', () => {
    // R{>0} on a d6 will always match (every result is > 0), so without a
    // per-die attempt cap this would loop forever. MAX_REROLL_ATTEMPTS = 99.
    test('1d6R{>0} terminates and returns a result', () => {
      const result = roll('1d6R{>0}')
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('1d6R{>0} total is a positive integer', () => {
      const result = roll('1d6R{>0}')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
      expect(Number.isInteger(result.total)).toBe(true)
    })

    test('4d6R{>0} terminates with 4 dice', () => {
      const result = roll('4d6R{>0}')
      expect(result).toBeDefined()
      expect(result.rolls[0]!.rolls).toHaveLength(4)
    })

    test('1d6R{>=1} (always-reroll) terminates', () => {
      const result = roll('1d6R{>=1}')
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })
  })

  describe('normal reroll conditions still work', () => {
    test('4d6R{1}: no 1s remain after reroll', () => {
      Array.from({ length: 200 }, () => roll('4d6R{1}')).forEach(({ rolls }) => {
        rolls[0]!.rolls.forEach(die => {
          expect(die).not.toBe(1)
        })
      })
    })

    test('4d6R{<3}: no values below 3 remain after reroll', () => {
      Array.from({ length: 200 }, () => roll('4d6R{<3}')).forEach(({ rolls }) => {
        rolls[0]!.rolls.forEach(die => {
          expect(die).toBeGreaterThanOrEqual(3)
        })
      })
    })
  })

  describe('stress: impossible conditions never hang', () => {
    test('200 rolls of 4d6R{>0} all terminate', () => {
      Array.from({ length: 200 }, () => roll('4d6R{>0}')).forEach(({ total }) => {
        expect(Number.isFinite(total)).toBe(true)
        expect(total).toBeGreaterThan(0)
      })
    })
  })
})
