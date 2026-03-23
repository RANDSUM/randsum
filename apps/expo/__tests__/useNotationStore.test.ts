import { beforeEach, describe, expect, test } from 'bun:test'

import { useNotationStore } from '../lib/stores/notationStore'

describe('useNotationStore', () => {
  beforeEach(() => {
    useNotationStore.setState({ notation: '', isValid: false, hasError: false })
  })

  describe('initial state', () => {
    test('notation is empty string', () => {
      expect(useNotationStore.getState().notation).toBe('')
    })

    test('isValid is false', () => {
      expect(useNotationStore.getState().isValid).toBe(false)
    })

    test('hasError is false', () => {
      expect(useNotationStore.getState().hasError).toBe(false)
    })
  })

  describe('setNotation', () => {
    test('updates notation string', () => {
      useNotationStore.getState().setNotation('4d6L')
      expect(useNotationStore.getState().notation).toBe('4d6L')
    })

    test('valid notation sets isValid to true', () => {
      useNotationStore.getState().setNotation('4d6L')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('invalid notation sets isValid to false', () => {
      useNotationStore.getState().setNotation('not-dice')
      expect(useNotationStore.getState().isValid).toBe(false)
    })

    test('valid notation sets hasError to false', () => {
      useNotationStore.getState().setNotation('4d6L')
      expect(useNotationStore.getState().hasError).toBe(false)
    })

    test('invalid non-empty notation sets hasError to true', () => {
      useNotationStore.getState().setNotation('not-dice')
      expect(useNotationStore.getState().hasError).toBe(true)
    })

    test('empty string sets hasError to false', () => {
      useNotationStore.getState().setNotation('not-dice')
      useNotationStore.getState().setNotation('')
      expect(useNotationStore.getState().hasError).toBe(false)
    })

    test('empty string sets isValid to false', () => {
      useNotationStore.getState().setNotation('4d6')
      useNotationStore.getState().setNotation('')
      expect(useNotationStore.getState().isValid).toBe(false)
    })

    test('"1d20" is valid', () => {
      useNotationStore.getState().setNotation('1d20')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('"2d6+1d8" is valid', () => {
      useNotationStore.getState().setNotation('2d6+1d8')
      expect(useNotationStore.getState().isValid).toBe(true)
    })

    test('"hello" is invalid', () => {
      useNotationStore.getState().setNotation('hello')
      expect(useNotationStore.getState().isValid).toBe(false)
    })
  })

  describe('clear', () => {
    test('resets notation to empty string', () => {
      useNotationStore.getState().setNotation('4d6L')
      useNotationStore.getState().clear()
      expect(useNotationStore.getState().notation).toBe('')
    })

    test('resets isValid to false', () => {
      useNotationStore.getState().setNotation('4d6L')
      useNotationStore.getState().clear()
      expect(useNotationStore.getState().isValid).toBe(false)
    })

    test('resets hasError to false', () => {
      useNotationStore.getState().setNotation('not-dice')
      useNotationStore.getState().clear()
      expect(useNotationStore.getState().hasError).toBe(false)
    })
  })
})
