import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'

import { roll } from '../../src/roll'

describe('Special dice property tests', () => {
  describe('d% (percentile)', () => {
    test('d% always produces total in [1, 100]', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('d%' as string)
          expect(result.total).toBeGreaterThanOrEqual(1)
          expect(result.total).toBeLessThanOrEqual(100)
        }),
        { numRuns: 1000 }
      )
    })

    test('d% always produces exactly 1 roll record with 1 die', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('d%' as string)
          expect(result.rolls).toHaveLength(1)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          expect(record!.rolls).toHaveLength(1)
        }),
        { numRuns: 500 }
      )
    })

    test('d% total equals the single die value', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('d%' as string)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          const dieValue = record!.rolls[0]
          expect(dieValue).toBeDefined()
          expect(result.total).toBe(dieValue)
        }),
        { numRuns: 500 }
      )
    })
  })

  describe('dF (Fate standard)', () => {
    test('dF always produces individual values in [-1, 0, 1]', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('dF' as string)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          record!.rolls.forEach(value => {
            expect([-1, 0, 1]).toContain(value)
          })
        }),
        { numRuns: 1000 }
      )
    })

    test('NdF total always in [-N, N] for various quantities', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), quantity => {
          const notation = `${quantity}dF`
          const result = roll(notation)
          expect(result.total).toBeGreaterThanOrEqual(-quantity)
          expect(result.total).toBeLessThanOrEqual(quantity)
        }),
        { numRuns: 500 }
      )
    })

    test('NdF produces correct number of dice', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), quantity => {
          const notation = `${quantity}dF`
          const result = roll(notation)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          expect(record!.initialRolls).toHaveLength(quantity)
        }),
        { numRuns: 200 }
      )
    })

    test('dF total equals sum of individual rolls', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), quantity => {
          const notation = `${quantity}dF`
          const result = roll(notation)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          const sum = record!.rolls.reduce((acc, val) => acc + val, 0)
          expect(record!.total).toBe(sum)
        }),
        { numRuns: 500 }
      )
    })
  })

  describe('dF.2 (extended Fate)', () => {
    test('dF.2 always produces individual values in [-2, -1, 0, 1, 2]', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('dF.2' as string)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          record!.rolls.forEach(value => {
            expect([-2, -1, 0, 1, 2]).toContain(value)
          })
        }),
        { numRuns: 1000 }
      )
    })

    test('NdF.2 total always in [-2N, 2N] for various quantities', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), quantity => {
          const notation = `${quantity}dF.2`
          const result = roll(notation)
          expect(result.total).toBeGreaterThanOrEqual(-2 * quantity)
          expect(result.total).toBeLessThanOrEqual(2 * quantity)
        }),
        { numRuns: 500 }
      )
    })

    test('NdF.2 produces correct number of dice', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 20 }), quantity => {
          const notation = `${quantity}dF.2`
          const result = roll(notation)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          expect(record!.initialRolls).toHaveLength(quantity)
        }),
        { numRuns: 200 }
      )
    })

    test('dF.2 total equals sum of individual rolls', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), quantity => {
          const notation = `${quantity}dF.2`
          const result = roll(notation)
          const record = result.rolls[0]
          expect(record).toBeDefined()
          const sum = record!.rolls.reduce((acc, val) => acc + val, 0)
          expect(record!.total).toBe(sum)
        }),
        { numRuns: 500 }
      )
    })
  })

  describe('mixed special dice', () => {
    test('d% + dF total is bounded correctly', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = roll('d%' as string, 'dF' as string)
          // d% in [1,100], dF in [-1,1], sum in [0, 101]
          expect(result.total).toBeGreaterThanOrEqual(0)
          expect(result.total).toBeLessThanOrEqual(101)
          expect(result.rolls).toHaveLength(2)
        }),
        { numRuns: 500 }
      )
    })

    test('d% + NdF total is bounded correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), quantity => {
          const notation = `${quantity}dF`
          const result = roll('d%' as string, notation)
          // d% in [1,100], NdF in [-N,N], sum in [1-N, 100+N]
          expect(result.total).toBeGreaterThanOrEqual(1 - quantity)
          expect(result.total).toBeLessThanOrEqual(100 + quantity)
        }),
        { numRuns: 300 }
      )
    })
  })
})
