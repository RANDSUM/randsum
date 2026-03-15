import { describe, expect, test } from 'bun:test'
import { indicesByRank } from '../../../src/lib/modifiers/behaviors/poolSelection'

describe('indicesByRank', () => {
  describe('direction: lowest', () => {
    test('returns indices of the N lowest values', () => {
      const result = indicesByRank([3, 1, 4, 1, 5], 2, 'lowest')

      // Values 1 (index 1) and 1 (index 3) are the two lowest
      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(2)
      expect(result.has(1)).toBe(true)
      expect(result.has(3)).toBe(true)
    })

    test('returns single lowest index', () => {
      const result = indicesByRank([4, 2, 6, 1], 1, 'lowest')

      expect(result.size).toBe(1)
      expect(result.has(3)).toBe(true) // index 3 has value 1 (lowest)
    })

    test('returns all indices when count equals length', () => {
      const result = indicesByRank([3, 1, 4], 3, 'lowest')

      expect(result.size).toBe(3)
      expect(result.has(0)).toBe(true)
      expect(result.has(1)).toBe(true)
      expect(result.has(2)).toBe(true)
    })

    test('returns empty set when count is 0', () => {
      const result = indicesByRank([3, 1, 4], 0, 'lowest')

      expect(result.size).toBe(0)
    })

    test('does not mutate the input array', () => {
      const rolls = [3, 1, 4, 1, 5]
      const original = [...rolls]
      indicesByRank(rolls, 2, 'lowest')

      expect(rolls).toEqual(original)
    })
  })

  describe('direction: highest', () => {
    test('returns indices of the N highest values', () => {
      const result = indicesByRank([3, 1, 4, 1, 5], 2, 'highest')

      // Values 5 (index 4) and 4 (index 2) are the two highest
      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(2)
      expect(result.has(4)).toBe(true)
      expect(result.has(2)).toBe(true)
    })

    test('returns single highest index', () => {
      const result = indicesByRank([4, 2, 6, 1], 1, 'highest')

      expect(result.size).toBe(1)
      expect(result.has(2)).toBe(true) // index 2 has value 6 (highest)
    })

    test('returns all indices when count equals length', () => {
      const result = indicesByRank([3, 1, 4], 3, 'highest')

      expect(result.size).toBe(3)
      expect(result.has(0)).toBe(true)
      expect(result.has(1)).toBe(true)
      expect(result.has(2)).toBe(true)
    })

    test('returns empty set when count is 0', () => {
      const result = indicesByRank([3, 1, 4], 0, 'highest')

      expect(result.size).toBe(0)
    })
  })

  describe('tie-breaking by original index', () => {
    test('when lowest values are tied, picks by ascending sort order (stable)', () => {
      // [5, 5, 5]: all tied — count=2 lowest picks first two by sort stability
      const result = indicesByRank([5, 5, 5], 2, 'lowest')

      expect(result.size).toBe(2)
    })

    test('when highest values are tied, picks by descending sort order (stable)', () => {
      const result = indicesByRank([5, 5, 5], 2, 'highest')

      expect(result.size).toBe(2)
    })
  })

  describe('single element', () => {
    test('lowest from single element returns that index', () => {
      const result = indicesByRank([42], 1, 'lowest')

      expect(result.size).toBe(1)
      expect(result.has(0)).toBe(true)
    })

    test('highest from single element returns that index', () => {
      const result = indicesByRank([42], 1, 'highest')

      expect(result.size).toBe(1)
      expect(result.has(0)).toBe(true)
    })
  })
})
