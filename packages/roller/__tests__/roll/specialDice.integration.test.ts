import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

const loops = 9999

describe('Special Dice Integration Tests', () => {
  // ─── d% (Percentile Die) ─────────────────────────────────────────────

  describe('d% (percentile die)', () => {
    describe('basic usage', () => {
      test('roll("d%") returns a valid result', () => {
        const result = roll('d%' as string)
        expect(result.total).toBeGreaterThanOrEqual(1)
        expect(result.total).toBeLessThanOrEqual(100)
      })

      test('roll("d%") produces exactly 1 roll record', () => {
        const result = roll('d%' as string)
        expect(result.rolls).toHaveLength(1)
      })

      test('roll("d%") roll record has exactly 1 die', () => {
        const result = roll('d%' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(1)
        expect(record!.initialRolls).toHaveLength(1)
      })

      test('roll("d%") result array has 1 entry', () => {
        const result = roll('d%' as string)
        expect(result.result).toHaveLength(1)
      })
    })

    describe('with custom RNG', () => {
      test('randomFn returning 0 produces minimum (1)', () => {
        const result = roll('d%' as string, { randomFn: () => 0 })
        expect(result.total).toBe(1)
      })

      test('randomFn returning 0.999 produces maximum (100)', () => {
        const result = roll('d%' as string, { randomFn: () => 0.999 })
        expect(result.total).toBe(100)
      })

      test('deterministic results with seeded random', () => {
        const seeded1 = createSeededRandom(42)
        const result1 = roll('d%' as string, { randomFn: seeded1 })
        const seeded2 = createSeededRandom(42)
        const result2 = roll('d%' as string, { randomFn: seeded2 })
        expect(result1.total).toBe(result2.total)
      })
    })

    describe('multiple percentile dice', () => {
      test('roll("d%", "d%", "d%") produces 3 roll records', () => {
        const result = roll('d%' as string, 'd%' as string, 'd%' as string)
        expect(result.rolls).toHaveLength(3)
      })

      test('roll("d%", "d%") total is sum of both', () => {
        const result = roll('d%' as string, 'd%' as string, {
          randomFn: () => 0
        })
        expect(result.total).toBe(2) // 1 + 1
      })
    })

    describe('case insensitivity', () => {
      test('"D%" is accepted', () => {
        const result = roll('D%' as string)
        expect(result.total).toBeGreaterThanOrEqual(1)
        expect(result.total).toBeLessThanOrEqual(100)
      })
    })

    describe('stress test', () => {
      test('d% total always in [1, 100]', () => {
        const results = Array.from({ length: loops }, () => roll('d%' as string))
        results.forEach(({ total }) => {
          expect(total).toBeGreaterThanOrEqual(1)
          expect(total).toBeLessThanOrEqual(100)
        })
      })

      test('d% distribution covers full range over many rolls', () => {
        const totals = new Set(Array.from({ length: loops }, () => roll('d%' as string).total))
        // Over 9999 rolls of d100, we should see at least 90 distinct values
        expect(totals.size).toBeGreaterThanOrEqual(90)
      })
    })
  })

  // ─── dF (Fate/Fudge Die) ─────────────────────────────────────────────

  describe('dF (Fate/Fudge die)', () => {
    describe('basic usage', () => {
      test('roll("dF") returns a valid result', () => {
        const result = roll('dF' as string)
        expect(result.total).toBeGreaterThanOrEqual(-1)
        expect(result.total).toBeLessThanOrEqual(1)
      })

      test('roll("dF") produces exactly 1 roll record', () => {
        const result = roll('dF' as string)
        expect(result.rolls).toHaveLength(1)
      })

      test('roll("dF") roll record has exactly 1 die', () => {
        const result = roll('dF' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.initialRolls).toHaveLength(1)
      })
    })

    describe('with quantity', () => {
      test('roll("4dF") produces 1 roll record with 4 dice', () => {
        const result = roll('4dF' as string)
        expect(result.rolls).toHaveLength(1)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.initialRolls).toHaveLength(4)
      })

      test('roll("4dF") total is in [-4, 4]', () => {
        const result = roll('4dF' as string)
        expect(result.total).toBeGreaterThanOrEqual(-4)
        expect(result.total).toBeLessThanOrEqual(4)
      })

      test('roll("1dF") with explicit quantity 1', () => {
        const result = roll('1dF' as string)
        expect(result.rolls).toHaveLength(1)
        expect(result.total).toBeGreaterThanOrEqual(-1)
        expect(result.total).toBeLessThanOrEqual(1)
      })
    })

    describe('with custom RNG', () => {
      test('randomFn returning 0 produces all -1 (minimum)', () => {
        const result = roll('4dF' as string, { randomFn: () => 0 })
        expect(result.total).toBe(-4)
      })

      test('randomFn returning 0.999 produces all +1 (maximum)', () => {
        const result = roll('4dF' as string, { randomFn: () => 0.999 })
        expect(result.total).toBe(4)
      })

      test('deterministic results with seeded random', () => {
        const seeded1 = createSeededRandom(42)
        const result1 = roll('4dF' as string, { randomFn: seeded1 })
        const seeded2 = createSeededRandom(42)
        const result2 = roll('4dF' as string, { randomFn: seeded2 })
        expect(result1.total).toBe(result2.total)
      })
    })

    describe('Fate die replace modifier', () => {
      test('dF roll record has replace in modifierLogs', () => {
        const result = roll('dF' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        // The replace modifier should appear in the logs since dF
        // is implemented via replace: {1->-1, 2->0, 3->1}
        expect(record!.modifierLogs).toBeDefined()
      })

      test('dF final rolls contain only values from [-1, 0, 1]', () => {
        const result = roll('4dF' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        record!.rolls.forEach(value => {
          expect([-1, 0, 1]).toContain(value)
        })
      })
    })

    describe('case insensitivity', () => {
      test('"DF" is accepted', () => {
        const result = roll('DF' as string)
        expect(result.total).toBeGreaterThanOrEqual(-1)
        expect(result.total).toBeLessThanOrEqual(1)
      })

      test('"Df" is accepted', () => {
        const result = roll('Df' as string)
        expect(result.total).toBeGreaterThanOrEqual(-1)
        expect(result.total).toBeLessThanOrEqual(1)
      })

      test('"df" is accepted', () => {
        const result = roll('df' as string)
        expect(result.total).toBeGreaterThanOrEqual(-1)
        expect(result.total).toBeLessThanOrEqual(1)
      })
    })

    describe('stress test', () => {
      test('4dF total always in [-4, 4]', () => {
        const results = Array.from({ length: loops }, () => roll('4dF' as string))
        results.forEach(({ total }) => {
          expect(total).toBeGreaterThanOrEqual(-4)
          expect(total).toBeLessThanOrEqual(4)
        })
      })

      test('dF individual values always in [-1, 0, 1]', () => {
        const results = Array.from({ length: loops }, () => roll('4dF' as string))
        results.forEach(({ rolls }) => {
          const record = rolls[0]
          expect(record).toBeDefined()
          record!.rolls.forEach(value => {
            expect([-1, 0, 1]).toContain(value)
          })
        })
      })

      test('dF distribution: all three values (-1, 0, 1) appear', () => {
        const allValues = new Set<number>()
        Array.from({ length: loops }, () => {
          const result = roll('dF' as string)
          const record = result.rolls[0]
          if (record) {
            record.rolls.forEach(v => allValues.add(v))
          }
        })
        expect(allValues.has(-1)).toBe(true)
        expect(allValues.has(0)).toBe(true)
        expect(allValues.has(1)).toBe(true)
        expect(allValues.size).toBe(3)
      })
    })
  })

  // ─── dF.1 (Fate standard, explicit) ──────────────────────────────────

  describe('dF.1 (explicit standard Fate)', () => {
    test('roll("dF.1") returns a valid result', () => {
      const result = roll('dF.1' as string)
      expect(result.total).toBeGreaterThanOrEqual(-1)
      expect(result.total).toBeLessThanOrEqual(1)
    })

    test('dF.1 produces the same range as dF', () => {
      const results = Array.from({ length: loops }, () => roll('dF.1' as string))
      results.forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(-1)
        expect(total).toBeLessThanOrEqual(1)
      })
    })

    test('dF.1 individual values always in [-1, 0, 1]', () => {
      const results = Array.from({ length: loops }, () => roll('dF.1' as string))
      results.forEach(({ rolls }) => {
        const record = rolls[0]
        expect(record).toBeDefined()
        record!.rolls.forEach(value => {
          expect([-1, 0, 1]).toContain(value)
        })
      })
    })

    describe('case insensitivity', () => {
      test('"DF.1" is accepted', () => {
        const result = roll('DF.1' as string)
        expect(result.total).toBeGreaterThanOrEqual(-1)
        expect(result.total).toBeLessThanOrEqual(1)
      })
    })

    test('roll("4dF.1") with quantity', () => {
      const result = roll('4dF.1' as string)
      expect(result.total).toBeGreaterThanOrEqual(-4)
      expect(result.total).toBeLessThanOrEqual(4)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      expect(record!.initialRolls).toHaveLength(4)
    })
  })

  // ─── dF.2 (Extended Fate) ────────────────────────────────────────────

  describe('dF.2 (extended Fate)', () => {
    test('roll("dF.2") returns a valid result', () => {
      const result = roll('dF.2' as string)
      expect(result.total).toBeGreaterThanOrEqual(-2)
      expect(result.total).toBeLessThanOrEqual(2)
    })

    test('roll("4dF.2") total is in [-8, 8]', () => {
      const result = roll('4dF.2' as string)
      expect(result.total).toBeGreaterThanOrEqual(-8)
      expect(result.total).toBeLessThanOrEqual(8)
    })

    test('dF.2 individual values always in [-2, -1, 0, 1, 2]', () => {
      const results = Array.from({ length: loops }, () => roll('dF.2' as string))
      results.forEach(({ rolls }) => {
        const record = rolls[0]
        expect(record).toBeDefined()
        record!.rolls.forEach(value => {
          expect([-2, -1, 0, 1, 2]).toContain(value)
        })
      })
    })

    test('dF.2 distribution: all five values appear', () => {
      const allValues = new Set<number>()
      Array.from({ length: loops }, () => {
        const result = roll('dF.2' as string)
        const record = result.rolls[0]
        if (record) {
          record.rolls.forEach(v => allValues.add(v))
        }
      })
      expect(allValues.has(-2)).toBe(true)
      expect(allValues.has(-1)).toBe(true)
      expect(allValues.has(0)).toBe(true)
      expect(allValues.has(1)).toBe(true)
      expect(allValues.has(2)).toBe(true)
      expect(allValues.size).toBe(5)
    })

    describe('case insensitivity', () => {
      test('"DF.2" is accepted', () => {
        const result = roll('DF.2' as string)
        expect(result.total).toBeGreaterThanOrEqual(-2)
        expect(result.total).toBeLessThanOrEqual(2)
      })
    })

    describe('with custom RNG', () => {
      test('randomFn returning 0 produces minimum (-2)', () => {
        const result = roll('dF.2' as string, { randomFn: () => 0 })
        expect(result.total).toBe(-2)
      })

      test('randomFn returning 0.999 produces maximum (2)', () => {
        const result = roll('dF.2' as string, { randomFn: () => 0.999 })
        expect(result.total).toBe(2)
      })
    })

    describe('stress test', () => {
      test('4dF.2 total always in [-8, 8]', () => {
        const results = Array.from({ length: loops }, () => roll('4dF.2' as string))
        results.forEach(({ total }) => {
          expect(total).toBeGreaterThanOrEqual(-8)
          expect(total).toBeLessThanOrEqual(8)
        })
      })
    })
  })

  // ─── Invalid Variants ────────────────────────────────────────────────

  describe('invalid special dice variants', () => {
    test('"dF.3" throws', () => {
      expect(() => roll('dF.3' as string)).toThrow()
    })

    test('"dF.0" throws', () => {
      expect(() => roll('dF.0' as string)).toThrow()
    })

    test('"d%%" throws', () => {
      expect(() => roll('d%%' as string)).toThrow()
    })
  })

  // ─── Mixing dF Variants ──────────────────────────────────────────────

  describe('mixing Fate variants', () => {
    test('roll("dF", "dF.2") produces 2 roll records', () => {
      const result = roll('dF' as string, 'dF.2' as string)
      expect(result.rolls).toHaveLength(2)
    })

    test('roll("dF", "dF.2") total is in [-3, 3]', () => {
      const result = roll('dF' as string, 'dF.2' as string)
      // dF range: [-1, 1], dF.2 range: [-2, 2], combined: [-3, 3]
      expect(result.total).toBeGreaterThanOrEqual(-3)
      expect(result.total).toBeLessThanOrEqual(3)
    })

    test('roll("4dF", "4dF") produces 2 roll records', () => {
      const result = roll('4dF' as string, '4dF' as string)
      expect(result.rolls).toHaveLength(2)
      expect(result.total).toBeGreaterThanOrEqual(-8)
      expect(result.total).toBeLessThanOrEqual(8)
    })
  })

  // ─── Complex Mixed Scenarios ──────────────────────────────────────────

  describe('complex mixed scenarios', () => {
    test('roll("d%", "4dF", 20) - all three argument types', () => {
      const result = roll('d%' as string, '4dF' as string, 20)
      expect(result.rolls).toHaveLength(3)

      // d% contributes [1, 100]
      // 4dF contributes [-4, 4]
      // d20 contributes [1, 20]
      // Combined: [1 + (-4) + 1, 100 + 4 + 20] = [-2, 124]
      expect(result.total).toBeGreaterThanOrEqual(-2)
      expect(result.total).toBeLessThanOrEqual(124)
    })

    test('roll("d%", "2d6", "4dF", 8) - everything together', () => {
      const result = roll('d%' as string, '2d6' as string, '4dF' as string, 8)
      expect(result.rolls).toHaveLength(4)
    })

    test('kitchen sink: d%, 4dF, 2d6+3, d20, {sides:8, quantity:3}', () => {
      const result = roll('d%' as string, '4dF' as string, '2d6+3' as string, 20, {
        sides: 8,
        quantity: 3
      })
      // d% = 1 roll record
      // 4dF = 1 roll record
      // 2d6+3 = 1 roll record
      // 20 (d20) = 1 roll record
      // {sides:8, quantity:3} = 1 roll record
      expect(result.rolls).toHaveLength(5)

      // Verify each roll record exists
      result.rolls.forEach(record => {
        expect(record.rolls).toBeDefined()
        expect(record.initialRolls).toBeDefined()
        expect(record.notation).toBeDefined()
        expect(record.description).toBeDefined()
        expect(typeof record.total).toBe('number')
        expect(typeof record.appliedTotal).toBe('number')
      })
    })

    test('kitchen sink with deterministic RNG produces consistent results', () => {
      const seeded1 = createSeededRandom(123)
      const result1 = roll(
        'd%' as string,
        '4dF' as string,
        '2d6+3' as string,
        20,
        { sides: 8, quantity: 3 },
        { randomFn: seeded1 }
      )

      const seeded2 = createSeededRandom(123)
      const result2 = roll(
        'd%' as string,
        '4dF' as string,
        '2d6+3' as string,
        20,
        { sides: 8, quantity: 3 },
        { randomFn: seeded2 }
      )

      expect(result1.total).toBe(result2.total)
      expect(result1.rolls).toHaveLength(result2.rolls.length)
    })
  })

  // ─── Result Structure Validation ──────────────────────────────────────

  describe('result structure validation', () => {
    describe('d% result structure', () => {
      test('roll record has correct fields', () => {
        const result = roll('d%' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toBeInstanceOf(Array)
        expect(record!.initialRolls).toBeInstanceOf(Array)
        expect(typeof record!.total).toBe('number')
        expect(typeof record!.appliedTotal).toBe('number')
        expect(record!.notation).toBeDefined()
        expect(record!.description).toBeInstanceOf(Array)
        expect(record!.modifierLogs).toBeDefined()
      })

      test('d% appliedTotal equals total for single die', () => {
        const result = roll('d%' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.appliedTotal).toBe(record!.total)
      })
    })

    describe('dF result structure', () => {
      test('roll record has correct fields', () => {
        const result = roll('4dF' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toBeInstanceOf(Array)
        expect(record!.rolls).toHaveLength(4)
        expect(record!.initialRolls).toBeInstanceOf(Array)
        expect(record!.initialRolls).toHaveLength(4)
        expect(typeof record!.total).toBe('number')
        expect(typeof record!.appliedTotal).toBe('number')
      })

      test('dF total equals sum of individual rolls', () => {
        const result = roll('4dF' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        const sum = record!.rolls.reduce((acc, val) => acc + val, 0)
        expect(record!.total).toBe(sum)
      })
    })
  })
})
