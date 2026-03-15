import { describe, expect, test } from 'bun:test'
import { sortModifier } from '../../../src/lib/modifiers/definitions/sort'

describe('sortModifier', () => {
  describe('apply', () => {
    test('sorts rolls ascending', () => {
      const result = sortModifier.apply([5, 2, 8, 1, 4], 'asc', {})
      expect(result.rolls).toEqual([1, 2, 4, 5, 8])
    })

    test('sorts rolls descending', () => {
      const result = sortModifier.apply([5, 2, 8, 1, 4], 'desc', {})
      expect(result.rolls).toEqual([8, 5, 4, 2, 1])
    })

    test('does not produce a total transformer (display-only)', () => {
      const result = sortModifier.apply([3, 1, 2], 'asc', {})
      expect(result.transformTotal).toBeUndefined()
    })

    test('handles single element', () => {
      const result = sortModifier.apply([7], 'asc', {})
      expect(result.rolls).toEqual([7])
    })

    test('handles already sorted array', () => {
      const result = sortModifier.apply([1, 2, 3], 'asc', {})
      expect(result.rolls).toEqual([1, 2, 3])
    })

    test('handles duplicate values', () => {
      const result = sortModifier.apply([3, 1, 3, 2], 'asc', {})
      expect(result.rolls).toEqual([1, 2, 3, 3])
    })

    test('does not mutate input array', () => {
      const input = [5, 2, 8]
      sortModifier.apply(input, 'asc', {})
      expect(input).toEqual([5, 2, 8])
    })
  })

  describe('schema properties', () => {
    test('has name "sort"', () => {
      expect(sortModifier.name).toBe('sort')
    })

    test('has priority 92', () => {
      expect(sortModifier.priority).toBe(92)
    })
  })
})
