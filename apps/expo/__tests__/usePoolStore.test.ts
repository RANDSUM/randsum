import { beforeEach, describe, expect, test } from 'bun:test'

import { usePoolStore } from '../lib/stores/poolStore'

describe('usePoolStore', () => {
  beforeEach(() => {
    usePoolStore.setState({ pool: {} })
  })

  describe('initial state', () => {
    test('pool is empty', () => {
      expect(usePoolStore.getState().pool).toEqual({})
    })

    test('isEmpty is true', () => {
      expect(usePoolStore.getState().isEmpty).toBe(true)
    })
  })

  describe('increment', () => {
    test('adds a die of the given sides', () => {
      usePoolStore.getState().increment(6)
      expect(usePoolStore.getState().pool).toEqual({ 6: 1 })
    })

    test('multiple increments accumulate', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      expect(usePoolStore.getState().pool).toEqual({ 6: 3 })
    })

    test('increments different die types independently', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(8)
      expect(usePoolStore.getState().pool).toEqual({ 6: 1, 8: 1 })
    })

    test('isEmpty becomes false after increment', () => {
      usePoolStore.getState().increment(6)
      expect(usePoolStore.getState().isEmpty).toBe(false)
    })
  })

  describe('decrement', () => {
    test('reduces count by 1', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      usePoolStore.getState().decrement(6)
      expect(usePoolStore.getState().pool).toEqual({ 6: 1 })
    })

    test('removes key when count reaches 0', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().decrement(6)
      expect(usePoolStore.getState().pool).toEqual({})
    })

    test('increment twice then decrement twice removes entry', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      usePoolStore.getState().decrement(6)
      usePoolStore.getState().decrement(6)
      expect(usePoolStore.getState().pool).toEqual({})
    })

    test('decrement on absent key is a no-op', () => {
      usePoolStore.getState().decrement(6)
      expect(usePoolStore.getState().pool).toEqual({})
    })

    test('decrement on zero count is a no-op', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().decrement(6)
      usePoolStore.getState().decrement(6)
      expect(usePoolStore.getState().pool).toEqual({})
    })

    test('isEmpty is true when last die is removed', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().decrement(6)
      expect(usePoolStore.getState().isEmpty).toBe(true)
    })
  })

  describe('clear', () => {
    test('resets pool to empty', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(8)
      usePoolStore.getState().clear()
      expect(usePoolStore.getState().pool).toEqual({})
    })

    test('isEmpty is true after clear', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().clear()
      expect(usePoolStore.getState().isEmpty).toBe(true)
    })
  })

  describe('toNotation', () => {
    test('returns empty string for empty pool', () => {
      expect(usePoolStore.getState().toNotation()).toBe('')
    })

    test('returns correct notation for single die type', () => {
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      expect(usePoolStore.getState().toNotation()).toBe('3d6')
    })

    test('returns sorted notation for multiple die types', () => {
      usePoolStore.getState().increment(8)
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      usePoolStore.getState().increment(6)
      expect(usePoolStore.getState().toNotation()).toBe('3d6+1d8')
    })

    test('ascending side order: d4 before d6 before d8', () => {
      usePoolStore.getState().increment(8)
      usePoolStore.getState().increment(4)
      usePoolStore.getState().increment(6)
      expect(usePoolStore.getState().toNotation()).toBe('1d4+1d6+1d8')
    })

    test('{ 6: 3, 8: 1 } → "3d6+1d8"', () => {
      usePoolStore.setState({ pool: { 6: 3, 8: 1 } })
      expect(usePoolStore.getState().toNotation()).toBe('3d6+1d8')
    })

    test('complex pool: 3d6+2d8+1d20', () => {
      usePoolStore.setState({ pool: { 6: 3, 8: 2, 20: 1 } })
      expect(usePoolStore.getState().toNotation()).toBe('3d6+2d8+1d20')
    })
  })
})
