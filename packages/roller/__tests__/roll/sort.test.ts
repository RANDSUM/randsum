import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

const loops = 9999

describe('Sort Modifier', () => {
  describe('ascending sort', () => {
    test('roll("6d6sa") rolls array is sorted ascending', () => {
      const result = roll('6d6sa' as string)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      const rolls = record!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(prev!)
        }
      }
    })
  })

  describe('descending sort', () => {
    test('roll("6d6sd") rolls array is sorted descending', () => {
      const result = roll('6d6sd' as string)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      const rolls = record!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeLessThanOrEqual(prev!)
        }
      }
    })
  })

  describe('bare sort defaults to ascending', () => {
    test('roll("6d6s") sorts ascending by default', () => {
      const result = roll('6d6s' as string)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      const rolls = record!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(prev!)
        }
      }
    })
  })

  describe('case insensitivity', () => {
    test('roll("6d6SA") sorts ascending', () => {
      const result = roll('6d6SA' as string)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      const rolls = record!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(prev!)
        }
      }
    })

    test('roll("6d6SD") sorts descending', () => {
      const result = roll('6d6SD' as string)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      const rolls = record!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeLessThanOrEqual(prev!)
        }
      }
    })
  })

  describe('sort does not change total', () => {
    test('sorted and unsorted rolls produce the same total with seeded random', () => {
      const seeded1 = createSeededRandom(42)
      const sortedResult = roll(
        { sides: 6, quantity: 6, modifiers: { sort: 'asc' } } as Parameters<typeof roll>[0],
        { randomFn: seeded1 }
      )

      const seeded2 = createSeededRandom(42)
      const unsortedResult = roll({ sides: 6, quantity: 6 }, { randomFn: seeded2 })

      expect(sortedResult.total).toBe(unsortedResult.total)

      // The sorted result should actually be in ascending order
      const sortedRecord = sortedResult.rolls[0]
      expect(sortedRecord).toBeDefined()
      const rolls = sortedRecord!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(prev!)
        }
      }
    })
  })

  describe('combined with other modifiers', () => {
    test('roll("4d6Lsa") drops lowest then sorts ascending', () => {
      const result = roll('4d6Lsa' as string)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      // After dropping lowest, should have 3 dice
      expect(record!.rolls).toHaveLength(3)
      // Remaining dice should be sorted ascending
      const rolls = record!.rolls
      for (const [i, value] of rolls.entries()) {
        if (i > 0) {
          const prev = rolls[i - 1]
          expect(prev).toBeDefined()
          expect(value).toBeGreaterThanOrEqual(prev!)
        }
      }
    })
  })

  describe('stress test', () => {
    test('sort ascending invariant holds across 9999 iterations', () => {
      const results = Array.from({ length: loops }, () => roll('6d6sa' as string))
      results.forEach(({ rolls: records }) => {
        const record = records[0]
        expect(record).toBeDefined()
        const rolls = record!.rolls
        for (const [i, value] of rolls.entries()) {
          if (i > 0) {
            const prev = rolls[i - 1]
            expect(prev).toBeDefined()
            expect(value).toBeGreaterThanOrEqual(prev!)
          }
        }
      })
    })

    test('sort descending invariant holds across 9999 iterations', () => {
      const results = Array.from({ length: loops }, () => roll('6d6sd' as string))
      results.forEach(({ rolls: records }) => {
        const record = records[0]
        expect(record).toBeDefined()
        const rolls = record!.rolls
        for (const [i, value] of rolls.entries()) {
          if (i > 0) {
            const prev = rolls[i - 1]
            expect(prev).toBeDefined()
            expect(value).toBeLessThanOrEqual(prev!)
          }
        }
      })
    })
  })
})
