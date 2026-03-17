/**
 * Tests for PlaygroundApp state management and behavior.
 *
 * These tests focus on the state transition logic extracted from PlaygroundApp.
 * DOM-level tests are minimal since Astro + React island testing requires
 * a full browser environment not available in bun:test.
 */
import { describe, expect, test } from 'bun:test'
import type { RollerRollResult } from '@randsum/roller'
import {
  type PlaygroundState,
  type ValidationState,
  applyEscape,
  applyNotationChange,
  applySubmit,
  buildInitialState
} from '../src/components/PlaygroundApp'

function fakeRollResult(): RollerRollResult {
  return { total: 14, rolls: [], values: [] } as RollerRollResult
}

describe('PlaygroundApp state', () => {
  describe('buildInitialState', () => {
    test('returns empty state when no notation provided', () => {
      const state = buildInitialState(null)
      expect(state.notation).toBe('')
      expect(state.validationState).toBe<ValidationState>('empty')
      expect(state.validationResult).toBeNull()
      expect(state.rollResult).toBeNull()
      expect(state.selectedEntry).toBeNull()
    })

    test('returns empty state when empty string provided', () => {
      const state = buildInitialState('')
      expect(state.notation).toBe('')
      expect(state.validationState).toBe<ValidationState>('empty')
      expect(state.validationResult).toBeNull()
    })

    test('validates notation when initial value provided', () => {
      const state = buildInitialState('4d6')
      expect(state.notation).toBe('4d6')
      expect(state.validationState).toBe<ValidationState>('valid')
      expect(state.validationResult).not.toBeNull()
      expect(state.validationResult?.valid).toBe(true)
    })

    test('sets invalid state for invalid initial notation', () => {
      const state = buildInitialState('not-dice')
      expect(state.notation).toBe('not-dice')
      expect(state.validationState).toBe<ValidationState>('invalid')
      expect(state.validationResult?.valid).toBe(false)
    })

    test('does not auto-roll on initial load', () => {
      const state = buildInitialState('4d6')
      expect(state.rollResult).toBeNull()
    })
  })

  describe('applyNotationChange', () => {
    test('sets validationState to empty when notation is empty', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applyNotationChange(prev, '')
      expect(next.notation).toBe('')
      expect(next.validationState).toBe<ValidationState>('empty')
      expect(next.validationResult).toBeNull()
    })

    test('validates and sets valid state for valid notation', () => {
      const prev: PlaygroundState = {
        notation: '',
        validationState: 'empty',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applyNotationChange(prev, '2d6')
      expect(next.notation).toBe('2d6')
      expect(next.validationState).toBe<ValidationState>('valid')
      expect(next.validationResult?.valid).toBe(true)
    })

    test('validates and sets invalid state for invalid notation', () => {
      const prev: PlaygroundState = {
        notation: '',
        validationState: 'empty',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applyNotationChange(prev, 'xyz123')
      expect(next.notation).toBe('xyz123')
      expect(next.validationState).toBe<ValidationState>('invalid')
      expect(next.validationResult?.valid).toBe(false)
    })

    test('clears rollResult when notation becomes invalid', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: fakeRollResult(),
        selectedEntry: null
      }
      const next = applyNotationChange(prev, 'bad!!!')
      expect(next.rollResult).toBeNull()
    })

    test('preserves rollResult when notation remains valid', () => {
      const fakeResult = fakeRollResult()
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: fakeResult,
        selectedEntry: null
      }
      const next = applyNotationChange(prev, '2d6')
      expect(next.rollResult).toBe(fakeResult)
    })
  })

  describe('applySubmit', () => {
    test('returns state with rollResult set on valid notation', () => {
      const prev: PlaygroundState = {
        notation: '1d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applySubmit(prev)
      expect(next.rollResult).not.toBeNull()
      expect(typeof next.rollResult?.total).toBe('number')
    })

    test('does nothing when validationState is not valid', () => {
      const prev: PlaygroundState = {
        notation: 'invalid',
        validationState: 'invalid',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applySubmit(prev)
      expect(next.rollResult).toBeNull()
    })

    test('does nothing when validationState is empty', () => {
      const prev: PlaygroundState = {
        notation: '',
        validationState: 'empty',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applySubmit(prev)
      expect(next.rollResult).toBeNull()
    })

    test('replaces previous rollResult on repeat submit', () => {
      const first: PlaygroundState = {
        notation: '1d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const afterFirst = applySubmit(first)
      const afterSecond = applySubmit(afterFirst)
      expect(afterSecond.rollResult).not.toBeNull()
    })
  })

  describe('applyEscape', () => {
    test('clears rollResult', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: fakeRollResult(),
        selectedEntry: null
      }
      const next = applyEscape(prev)
      expect(next.rollResult).toBeNull()
    })

    test('preserves notation and validationState', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: fakeRollResult(),
        selectedEntry: null
      }
      const next = applyEscape(prev)
      expect(next.notation).toBe('4d6')
      expect(next.validationState).toBe<ValidationState>('valid')
    })

    test('is a no-op when rollResult is already null', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: null,
        selectedEntry: null
      }
      const next = applyEscape(prev)
      expect(next.rollResult).toBeNull()
    })
  })
})
