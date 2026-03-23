import { afterEach, describe, expect, test } from 'bun:test'

import { usePoolStore } from '../lib/stores/poolStore'

// RollButton enabled state is driven by usePoolStore.isEmpty.
// These tests verify the store state that controls the button's enabled/disabled state.

describe('RollButton enabled state', () => {
  afterEach(() => {
    usePoolStore.getState().clear()
  })

  test('Roll button is disabled when pool is empty (isEmpty === true)', () => {
    usePoolStore.getState().clear()
    expect(usePoolStore.getState().isEmpty).toBe(true)
  })

  test('Roll button is enabled after adding at least one die (isEmpty === false)', () => {
    usePoolStore.getState().increment(6)
    expect(usePoolStore.getState().isEmpty).toBe(false)
  })

  test('Roll button becomes disabled again after clearing pool', () => {
    usePoolStore.getState().increment(6)
    expect(usePoolStore.getState().isEmpty).toBe(false)
    usePoolStore.getState().clear()
    expect(usePoolStore.getState().isEmpty).toBe(true)
  })

  test('notation passed to roll() is derived from pool state', () => {
    usePoolStore.getState().increment(6)
    usePoolStore.getState().increment(6)
    usePoolStore.getState().increment(20)
    const notation = usePoolStore.getState().toNotation()
    expect(notation).toBe('2d6+1d20')
  })
})
