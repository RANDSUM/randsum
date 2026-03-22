import { afterEach, describe, expect, test } from 'bun:test'

import { usePoolStore } from '../lib/stores/poolStore'

// Component behavior tests for DiceGrid / DieButton via the pool store.
// Full RNTL rendering requires additional native test infrastructure;
// these tests verify the store interactions that drive the component state.

describe('DiceGrid store integration', () => {
  afterEach(() => {
    usePoolStore.getState().clear()
  })

  test('tapping D6 three times sets pool to { 6: 3 }', () => {
    const { increment } = usePoolStore.getState()
    increment(6)
    increment(6)
    increment(6)
    expect(usePoolStore.getState().pool).toEqual({ 6: 3 })
  })

  test('long-pressing D6 after three taps decrements to { 6: 2 }', () => {
    const { increment, decrement } = usePoolStore.getState()
    increment(6)
    increment(6)
    increment(6)
    decrement(6)
    expect(usePoolStore.getState().pool).toEqual({ 6: 2 })
  })

  test('long-pressing when count is 1 removes the entry', () => {
    const { increment, decrement } = usePoolStore.getState()
    increment(6)
    decrement(6)
    expect(usePoolStore.getState().pool).toEqual({})
    expect(usePoolStore.getState().isEmpty).toBe(true)
  })

  test('all six die types can be incremented independently', () => {
    const { increment } = usePoolStore.getState()
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      increment(sides)
    }
    const pool = usePoolStore.getState().pool
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      expect(pool[sides]).toBe(1)
    }
  })

  test('clear resets pool to empty', () => {
    const { increment, clear } = usePoolStore.getState()
    increment(6)
    increment(8)
    clear()
    expect(usePoolStore.getState().pool).toEqual({})
    expect(usePoolStore.getState().isEmpty).toBe(true)
  })
})
