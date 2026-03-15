import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

describe('notation sugar', () => {
  describe('reroll once (ro{})', () => {
    test('ro{1} parses and applies reroll with max 1', () => {
      const seeded = createSeededRandom(42)
      const result = roll('4d6ro{1}', { randomFn: seeded })

      expect(result.rolls).toHaveLength(1)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      expect(record!.rolls).toHaveLength(4)
    })

    test('ro{1} is equivalent to R{1}1 with same seed', () => {
      const seeded1 = createSeededRandom(42)
      const result1 = roll('4d6ro{1}', { randomFn: seeded1 })

      const seeded2 = createSeededRandom(42)
      const result2 = roll('4d6R{1}1', { randomFn: seeded2 })

      expect(result1.total).toBe(result2.total)
      expect(result1.rolls[0]!.rolls).toEqual(result2.rolls[0]!.rolls)
    })

    test('ro{<3} rerolls values under 3 at most once', () => {
      const seeded = createSeededRandom(42)
      const result = roll('4d6ro{<3}', { randomFn: seeded })

      const seededEquiv = createSeededRandom(42)
      const resultEquiv = roll('4d6R{<3}1', { randomFn: seededEquiv })

      expect(result.total).toBe(resultEquiv.total)
    })

    test('ro{<=2} rerolls values at or under 2 at most once', () => {
      const seeded = createSeededRandom(42)
      const result = roll('4d6ro{<=2}', { randomFn: seeded })

      const seededEquiv = createSeededRandom(42)
      const resultEquiv = roll('4d6R{<=2}1', { randomFn: seededEquiv })

      expect(result.total).toBe(resultEquiv.total)
    })

    test('RO{1} is case-insensitive', () => {
      const seeded1 = createSeededRandom(42)
      const result1 = roll('4d6RO{1}', { randomFn: seeded1 })

      const seeded2 = createSeededRandom(42)
      const result2 = roll('4d6ro{1}', { randomFn: seeded2 })

      expect(result1.total).toBe(result2.total)
    })

    test('ro{1} combined with drop lowest: 4d6ro{1}L', () => {
      const seeded = createSeededRandom(42)
      const result = roll('4d6ro{1}L', { randomFn: seeded })

      expect(result.rolls).toHaveLength(1)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      // Drop lowest removes 1, so 3 dice remain
      expect(record!.rolls).toHaveLength(3)
    })

    test('stress test: ro{1} always produces valid results', () => {
      const results = Array.from({ length: 9999 }, () => roll('4d6ro{1}'))
      results.forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(4)
        expect(total).toBeLessThanOrEqual(24)
      })
    })
  })

  describe('keep middle (KM)', () => {
    test('6d6KM keeps 4 dice (drops 1 lowest and 1 highest)', () => {
      const seeded = createSeededRandom(42)
      const result = roll('6d6KM', { randomFn: seeded })

      expect(result.rolls).toHaveLength(1)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      expect(record!.rolls).toHaveLength(4)
    })

    test('6d6KM2 keeps 2 dice (drops 2 lowest and 2 highest)', () => {
      const seeded = createSeededRandom(42)
      const result = roll('6d6KM2', { randomFn: seeded })

      expect(result.rolls).toHaveLength(1)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      expect(record!.rolls).toHaveLength(2)
    })

    test('KM is equivalent to LH with same seed', () => {
      const seeded1 = createSeededRandom(42)
      const result1 = roll('6d6KM', { randomFn: seeded1 })

      const seeded2 = createSeededRandom(42)
      const result2 = roll('6d6LH', { randomFn: seeded2 })

      expect(result1.total).toBe(result2.total)
      expect(result1.rolls[0]!.rolls).toEqual(result2.rolls[0]!.rolls)
    })

    test('KM2 is equivalent to L2H2 with same seed', () => {
      const seeded1 = createSeededRandom(42)
      const result1 = roll('6d6KM2', { randomFn: seeded1 })

      const seeded2 = createSeededRandom(42)
      const result2 = roll('6d6L2H2', { randomFn: seeded2 })

      expect(result1.total).toBe(result2.total)
      expect(result1.rolls[0]!.rolls).toEqual(result2.rolls[0]!.rolls)
    })

    test('km is case-insensitive', () => {
      const seeded1 = createSeededRandom(42)
      const result1 = roll('6d6km', { randomFn: seeded1 })

      const seeded2 = createSeededRandom(42)
      const result2 = roll('6d6KM', { randomFn: seeded2 })

      expect(result1.total).toBe(result2.total)
    })

    test('KM combined with plus: 6d6KM+2', () => {
      const seeded = createSeededRandom(42)
      const result = roll('6d6KM+2', { randomFn: seeded })

      const seeded2 = createSeededRandom(42)
      const resultEquiv = roll('6d6LH+2', { randomFn: seeded2 })

      expect(result.total).toBe(resultEquiv.total)
    })

    test('stress test: 6d6KM always produces total in valid range', () => {
      const results = Array.from({ length: 9999 }, () => roll('6d6KM'))
      results.forEach(({ total, rolls }) => {
        // 4 dice kept, each 1-6
        expect(total).toBeGreaterThanOrEqual(4)
        expect(total).toBeLessThanOrEqual(24)
        expect(rolls[0]!.rolls).toHaveLength(4)
      })
    })
  })

  describe('margin of success (ms{})', () => {
    test('1d20ms{15} subtracts 15 from total', () => {
      const seeded = createSeededRandom(42)
      const result = roll('1d20ms{15}', { randomFn: seeded })

      const seeded2 = createSeededRandom(42)
      const resultEquiv = roll('1d20-15', { randomFn: seeded2 })

      expect(result.total).toBe(resultEquiv.total)
    })

    test('1d20ms{10} subtracts 10 from total', () => {
      const seeded = createSeededRandom(42)
      const result = roll('1d20ms{10}', { randomFn: seeded })

      const seeded2 = createSeededRandom(42)
      const resultEquiv = roll('1d20-10', { randomFn: seeded2 })

      expect(result.total).toBe(resultEquiv.total)
    })

    test('MS{15} is case-insensitive', () => {
      const seeded1 = createSeededRandom(42)
      const result1 = roll('1d20MS{15}', { randomFn: seeded1 })

      const seeded2 = createSeededRandom(42)
      const result2 = roll('1d20ms{15}', { randomFn: seeded2 })

      expect(result1.total).toBe(result2.total)
    })

    test('ms{} can produce negative results', () => {
      // Roll 1d1 (always 1) with ms{10} => 1 - 10 = -9
      const result = roll('1d1ms{10}')
      expect(result.total).toBe(-9)
    })

    test('ms{} combined with drop lowest: 4d6Lms{10}', () => {
      const seeded = createSeededRandom(42)
      const result = roll('4d6Lms{10}', { randomFn: seeded })

      const seeded2 = createSeededRandom(42)
      const resultEquiv = roll('4d6L-10', { randomFn: seeded2 })

      expect(result.total).toBe(resultEquiv.total)
    })

    test('stress test: 1d20ms{15} always produces total in valid range', () => {
      const results = Array.from({ length: 9999 }, () => roll('1d20ms{15}'))
      results.forEach(({ total }) => {
        // 1d20 produces 1-20, minus 15 => -14 to 5
        expect(total).toBeGreaterThanOrEqual(-14)
        expect(total).toBeLessThanOrEqual(5)
      })
    })
  })
})
