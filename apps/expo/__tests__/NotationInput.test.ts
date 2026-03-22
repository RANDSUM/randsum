import { beforeEach, describe, expect, test } from 'bun:test'

import { useNotationStore } from '../lib/stores/notationStore'
import { usePoolStore } from '../lib/stores/poolStore'

describe('NotationInput', () => {
  beforeEach(() => {
    useNotationStore.setState({ notation: '', isValid: false, hasError: false })
    usePoolStore.getState().clear()
  })

  describe('validation states', () => {
    test('valid notation sets isValid true and hasError false', () => {
      useNotationStore.getState().setNotation('4d6L')
      const state = useNotationStore.getState()
      expect(state.isValid).toBe(true)
      expect(state.hasError).toBe(false)
    })

    test('invalid non-empty notation sets isValid false and hasError true', () => {
      useNotationStore.getState().setNotation('not-valid')
      const state = useNotationStore.getState()
      expect(state.isValid).toBe(false)
      expect(state.hasError).toBe(true)
    })

    test('empty input sets no error', () => {
      useNotationStore.getState().setNotation('')
      const state = useNotationStore.getState()
      expect(state.isValid).toBe(false)
      expect(state.hasError).toBe(false)
    })

    test('clearing after invalid resets error', () => {
      useNotationStore.getState().setNotation('bad')
      useNotationStore.getState().clear()
      const state = useNotationStore.getState()
      expect(state.hasError).toBe(false)
      expect(state.notation).toBe('')
    })
  })

  describe('notation examples', () => {
    test('"1d20+5" is valid', () => {
      useNotationStore.getState().setNotation('1d20+5')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('"4d6L" is valid', () => {
      useNotationStore.getState().setNotation('4d6L')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('"2d8+1d6" is valid', () => {
      useNotationStore.getState().setNotation('2d8+1d6')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('"d%" is valid', () => {
      useNotationStore.getState().setNotation('d%')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('"hello world" is invalid', () => {
      useNotationStore.getState().setNotation('hello world')
      expect(useNotationStore.getState().isValid).toBe(false)
      expect(useNotationStore.getState().hasError).toBe(true)
    })
  })

  describe('mode toggle preserves pool state', () => {
    test('pool state is unchanged after notation store interactions', () => {
      const { increment } = usePoolStore.getState()
      increment(6)
      increment(6)
      increment(8)

      // Simulate entering advanced mode: serialize pool to notation
      const poolNotation = usePoolStore.getState().toNotation()
      expect(poolNotation).toBe('2d6+1d8')
      useNotationStore.getState().setNotation(poolNotation!)

      // Verify notation store has the pool's notation
      expect(useNotationStore.getState().notation).toBe('2d6+1d8')
      expect(useNotationStore.getState().isValid).toBe(true)

      // Simulate returning to simple mode: pool is untouched
      expect(usePoolStore.getState().pool).toEqual({ 6: 2, 8: 1 })
      expect(usePoolStore.getState().isEmpty).toBe(false)
    })
  })
})
