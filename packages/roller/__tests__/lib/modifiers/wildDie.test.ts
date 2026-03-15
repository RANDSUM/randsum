import { describe, expect, test } from 'bun:test'
import { wildDieBehavior } from '../../../src/lib/modifiers/behaviors/wildDie'

describe('wildDie modifier behavior', () => {
  describe('normal roll (wild die is not 1 or max)', () => {
    test('returns rolls unchanged when wild die is in normal range', () => {
      const rolls = [3, 4, 5, 2, 3] // last die (3) is wild, not 1 or 6
      const rollOne = (): number => 4
      const ctx = { rollOne, parameters: { sides: 6, quantity: 5 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      expect(result.rolls).toEqual([3, 4, 5, 2, 3])
    })
  })

  describe('wild die shows max (compound explosion)', () => {
    test('compound explodes the wild die when it equals max', () => {
      // Wild die (last) is 6 (max for d6), rollOne returns 3 (no further explosion)
      const rolls = [3, 4, 5, 2, 6]
      const rollOne = (): number => 3
      const ctx = { rollOne, parameters: { sides: 6, quantity: 5 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      // Last die should be 6+3=9 (compound)
      expect(result.rolls).toEqual([3, 4, 5, 2, 9])
    })

    test('compound chains when follow-up also hits max', () => {
      const rolls = [3, 4, 5, 2, 6]
      const values = [6, 3] // first rollOne is 6 (chain), second is 3 (stop)
      // eslint-disable-next-line no-restricted-syntax
      let callIdx = 0
      const rollOne = (): number => {
        const v = values[callIdx] ?? 3
        callIdx++
        return v
      }
      const ctx = { rollOne, parameters: { sides: 6, quantity: 5 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      // 6 + 6 + 3 = 15
      expect(result.rolls).toEqual([3, 4, 5, 2, 15])
    })
  })

  describe('wild die shows 1 (penalty)', () => {
    test('removes wild die and highest non-wild die when wild is 1', () => {
      const rolls = [3, 4, 5, 2, 1] // wild die is 1, highest non-wild is 5
      const rollOne = (): number => 4
      const ctx = { rollOne, parameters: { sides: 6, quantity: 5 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      // Remove wild (1) and highest non-wild (5): [3, 4, 2]
      expect(result.rolls).toEqual([3, 4, 2])
    })

    test('removes only wild die when pool has just 1 die', () => {
      const rolls = [1] // only the wild die, and it is 1
      const rollOne = (): number => 4
      const ctx = { rollOne, parameters: { sides: 6, quantity: 1 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      // Remove wild die, nothing else to remove
      expect(result.rolls).toEqual([])
    })

    test('removes correct highest when there are ties', () => {
      const rolls = [5, 5, 3, 1] // wild is 1, two 5s tied for highest
      const rollOne = (): number => 4
      const ctx = { rollOne, parameters: { sides: 6, quantity: 4 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      // Remove wild (1) and one of the 5s: [5, 3]
      expect(result.rolls).toEqual([5, 3])
    })
  })

  describe('edge cases', () => {
    test('works with d6 (standard wild die sides)', () => {
      const rolls = [4, 3, 2]
      const rollOne = (): number => 4
      const ctx = { rollOne, parameters: { sides: 6, quantity: 3 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      expect(result.rolls).toEqual([4, 3, 2])
    })

    test('works with non-d6 sides (e.g. d8)', () => {
      // Wild die should use the actual sides for max detection
      const rolls = [4, 3, 8] // 8 is max for d8
      const rollOne = (): number => 2
      const ctx = { rollOne, parameters: { sides: 8, quantity: 3 } }
      const result = wildDieBehavior.apply(rolls, true, ctx)

      // 8 + 2 = 10 (compound)
      expect(result.rolls).toEqual([4, 3, 10])
    })
  })
})
