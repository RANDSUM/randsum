import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'

const loops = 9999

describe('Repeat Operator (xN)', () => {
  describe('basic usage', () => {
    test('roll("1d6x3") produces 3 roll records', () => {
      const result = roll('1d6x3' as string)
      expect(result.rolls).toHaveLength(3)
    })

    test('roll("1d6x3") total is sum of all 3 records', () => {
      const result = roll('1d6x3' as string)
      const sumOfRecords = result.rolls.reduce((acc, r) => acc + r.total, 0)
      expect(result.total).toBe(sumOfRecords)
    })
  })

  describe('with modifiers', () => {
    test('roll("4d6Lx6") produces 6 roll records', () => {
      const result = roll('4d6Lx6' as string)
      expect(result.rolls).toHaveLength(6)
    })

    test('roll("4d6Lx6") each record has 3 dice (4 rolled, 1 dropped)', () => {
      const result = roll('4d6Lx6' as string)
      result.rolls.forEach(record => {
        expect(record.initialRolls).toHaveLength(4)
        expect(record.rolls).toHaveLength(3)
      })
    })

    test('roll("2d6+3x4") produces 4 records with +3 applied to each', () => {
      const result = roll('2d6+3x4' as string, { randomFn: () => 0 })
      expect(result.rolls).toHaveLength(4)
      // With randomFn returning 0, each die rolls 1, so 2d6 = 2, +3 = 5
      result.rolls.forEach(record => {
        expect(record.total).toBe(5)
      })
    })
  })

  describe('case insensitivity', () => {
    test('roll("1d6X3") works the same as roll("1d6x3")', () => {
      const result = roll('1d6X3' as string)
      expect(result.rolls).toHaveLength(3)
    })
  })

  describe('edge case: x1', () => {
    test('roll("1d6x1") is equivalent to roll("1d6")', () => {
      const result = roll('1d6x1' as string)
      expect(result.rolls).toHaveLength(1)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })
  })

  describe('stress test', () => {
    test('roll("4d6Lx6") always produces 6 records with totals in [3, 18] each', () => {
      const results = Array.from({ length: loops }, () => roll('4d6Lx6' as string))
      results.forEach(({ rolls, total }) => {
        expect(rolls).toHaveLength(6)
        // Each record: 4d6 drop lowest = 3d6 effective, range [3, 18]
        rolls.forEach(record => {
          expect(record.total).toBeGreaterThanOrEqual(3)
          expect(record.total).toBeLessThanOrEqual(18)
        })
        // Total is sum of 6 records, each in [3, 18], so total in [18, 108]
        expect(total).toBeGreaterThanOrEqual(18)
        expect(total).toBeLessThanOrEqual(108)
      })
    })
  })
})
