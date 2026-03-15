import { describe, expect, test } from 'bun:test'
import { roll } from '../../src'

describe('Custom faces dice (d{...})', () => {
  describe('basic d{2,3,5,7}', () => {
    test('roll("d{2,3,5,7}") returns one of the face values', () => {
      const result = roll('d{2,3,5,7}')
      expect([2, 3, 5, 7]).toContain(result.total)
    })

    test('roll("D{2,3,5,7}") is case-insensitive', () => {
      const result = roll('D{2,3,5,7}')
      expect([2, 3, 5, 7]).toContain(result.total)
    })

    test('result has correct structure', () => {
      const result = roll('d{2,3,5,7}')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.rolls).toHaveLength(1)
    })

    test('stress test: all values are valid faces', () => {
      Array.from({ length: 9999 }, () => roll('d{2,3,5,7}')).forEach(({ total }) => {
        expect([2, 3, 5, 7]).toContain(total)
      })
    })
  })

  describe('with quantity prefix', () => {
    test('roll("3d{1,1,2,2,3,3}") returns correct range', () => {
      const result = roll('3d{1,1,2,2,3,3}')
      expect(result.total).toBeGreaterThanOrEqual(3)
      expect(result.total).toBeLessThanOrEqual(9)
    })

    test('roll("3d{1,1,2,2,3,3}") has correct quantity', () => {
      const result = roll('3d{1,1,2,2,3,3}')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.rolls).toHaveLength(3)
    })

    test('stress test: 2d{2,3,5,7} always in [4, 14]', () => {
      Array.from({ length: 9999 }, () => roll('2d{2,3,5,7}')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(4)
        expect(total).toBeLessThanOrEqual(14)
      })
    })
  })

  describe('faces with zero', () => {
    test('roll("d{0,1,2}") can return 0', () => {
      const results = Array.from({ length: 9999 }, () => roll('d{0,1,2}'))
      const totals = results.map(r => r.total)
      expect(totals).toContain(0)
      results.forEach(({ total }) => {
        expect([0, 1, 2]).toContain(total)
      })
    })
  })

  describe('faces with negative numbers', () => {
    test('roll("d{-1,0,1}") produces values in [-1, 1]', () => {
      Array.from({ length: 9999 }, () => roll('d{-1,0,1}')).forEach(({ total }) => {
        expect([-1, 0, 1]).toContain(total)
      })
    })

    test('roll("4d{-1,0,1}") is like 4 Fate dice', () => {
      Array.from({ length: 9999 }, () => roll('4d{-1,0,1}')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(-4)
        expect(total).toBeLessThanOrEqual(4)
      })
    })
  })

  describe('two-sided custom die', () => {
    test('roll("d{0,1}") is a zero-one coin', () => {
      Array.from({ length: 9999 }, () => roll('d{0,1}')).forEach(({ total }) => {
        expect([0, 1]).toContain(total)
      })
    })
  })

  describe('duplicate face values', () => {
    test('roll("d{1,1,1,2}") is weighted toward 1', () => {
      const results = Array.from({ length: 9999 }, () => roll('d{1,1,1,2}'))
      const ones = results.filter(r => r.total === 1).length
      const twos = results.filter(r => r.total === 2).length
      // With 3/4 chance of 1, ones should heavily outnumber twos
      expect(ones).toBeGreaterThan(twos * 2)
      results.forEach(({ total }) => {
        expect([1, 2]).toContain(total)
      })
    })
  })

  describe('mixed with other arguments', () => {
    test('custom faces mixed with numeric argument', () => {
      const result = roll('d{2,3,5,7}', 6)
      expect(result.rolls).toHaveLength(2)
    })

    test('custom faces mixed with notation', () => {
      const result = roll('d{2,3,5,7}', '2d6')
      expect(result.rolls).toHaveLength(2)
    })

    test('custom faces mixed with fate dice', () => {
      const result = roll('d{2,3,5,7}', 'dF')
      expect(result.rolls).toHaveLength(2)
    })

    test('custom faces mixed with zero-bias dice', () => {
      const result = roll('d{2,3,5,7}', 'z6')
      expect(result.rolls).toHaveLength(2)
    })
  })
})
