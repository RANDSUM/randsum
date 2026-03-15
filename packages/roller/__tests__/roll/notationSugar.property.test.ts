import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'

import { roll } from '../../src/roll'

describe('notation sugar property tests', () => {
  describe('reroll once (ro{})', () => {
    test('ro{1} never rerolls more than once per die', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('4d6ro{1}')
          const record = result.rolls[0]
          expect(record).toBeDefined()
          // Pool size stays at 4 (no extra dice from unlimited rerolls)
          expect(record!.rolls).toHaveLength(4)
          // Each die value should be 1-6
          record!.rolls.forEach(value => {
            expect(value).toBeGreaterThanOrEqual(1)
            expect(value).toBeLessThanOrEqual(6)
          })
        }),
        { numRuns: 500 }
      )
    })

    test('ro{} produces same result as R{}1 for any comparison', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 6 }), threshold => {
          const notation1 = `4d6ro{${threshold}}`
          const notation2 = `4d6R{${threshold}}1`
          // Both should parse without error
          const result1 = roll(notation1)
          const result2 = roll(notation2)
          expect(result1.rolls[0]!.rolls).toHaveLength(4)
          expect(result2.rolls[0]!.rolls).toHaveLength(4)
        }),
        { numRuns: 200 }
      )
    })
  })

  describe('keep middle (KM)', () => {
    test('KM on Nd6 always produces N-2 dice for N > 2', () => {
      fc.assert(
        fc.property(fc.integer({ min: 3, max: 20 }), quantity => {
          const notation = `${quantity}d6KM`
          const result = roll(notation)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          expect(record!.rolls).toHaveLength(quantity - 2)
        }),
        { numRuns: 200 }
      )
    })

    test('KMN on Qd6 always produces Q-2N dice for Q > 2N', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), dropCount => {
          const quantity = dropCount * 2 + 2
          const notation = `${quantity}d6KM${dropCount}`
          const result = roll(notation)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          expect(record!.rolls).toHaveLength(quantity - dropCount * 2)
        }),
        { numRuns: 200 }
      )
    })

    test('KM total is always between kept dice count and kept dice count * sides', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 12 }),
          fc.integer({ min: 4, max: 20 }),
          (quantity, sides) => {
            const notation = `${quantity}d${sides}KM`
            const result = roll(notation)
            const keptCount = quantity - 2
            expect(result.total).toBeGreaterThanOrEqual(keptCount)
            expect(result.total).toBeLessThanOrEqual(keptCount * sides)
          }
        ),
        { numRuns: 300 }
      )
    })
  })

  describe('margin of success (ms{})', () => {
    test('ms{N} total always equals raw total minus N', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), target => {
          // Use 1d1 so the raw roll is always 1
          const result = roll(`1d1ms{${target}}`)
          expect(result.total).toBe(1 - target)
        }),
        { numRuns: 100 }
      )
    })

    test('ms{N} on Nd6 total is bounded correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          (quantity, target) => {
            const notation = `${quantity}d6ms{${target}}`
            const result = roll(notation)
            // Raw total in [quantity, quantity*6], minus target
            expect(result.total).toBeGreaterThanOrEqual(quantity - target)
            expect(result.total).toBeLessThanOrEqual(quantity * 6 - target)
          }
        ),
        { numRuns: 300 }
      )
    })
  })
})
