import { afterEach, describe, expect, test } from 'bun:test'

import { usePoolStore } from '../lib/stores/poolStore'

// PoolDisplay reads toNotation() from the pool store.
// These tests verify the notation logic that drives PoolDisplay's content.

describe('PoolDisplay notation logic', () => {
  afterEach(() => {
    usePoolStore.getState().clear()
  })

  test('empty pool produces null (empty state shown)', () => {
    usePoolStore.getState().clear()
    expect(usePoolStore.getState().toNotation()).toBeNull()
  })

  test('pool { 6: 3, 8: 1 } produces "3d6+1d8"', () => {
    usePoolStore.setState({ pool: { 6: 3, 8: 1 } })
    expect(usePoolStore.getState().toNotation()).toBe('3d6+1d8')
  })

  test('pool { 6: 3, 8: 2, 20: 1 } produces "3d6+2d8+1d20"', () => {
    usePoolStore.setState({ pool: { 6: 3, 8: 2, 20: 1 } })
    expect(usePoolStore.getState().toNotation()).toBe('3d6+2d8+1d20')
  })

  test('single die produces correct notation', () => {
    usePoolStore.setState({ pool: { 20: 1 } })
    expect(usePoolStore.getState().toNotation()).toBe('1d20')
  })
})
