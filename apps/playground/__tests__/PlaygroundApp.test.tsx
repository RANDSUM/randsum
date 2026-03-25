/**
 * Tests for PlaygroundApp state management and behavior.
 *
 * These tests focus on the state transition logic extracted from PlaygroundApp.
 * DOM-level tests are minimal since Astro + React island testing requires
 * a full browser environment not available in bun:test.
 */
import { describe, expect, test } from 'bun:test'
import type { RollResult } from '@randsum/dice-ui'
import {
  type PlaygroundState,
  applyEscape,
  buildInitialState,
  buildNotationUrl,
  resolveInitialNotation
} from '../src/components/PlaygroundApp'

function fakeRollResult(): RollResult {
  return { total: 14, records: [], notation: '2d6+1' }
}

describe('PlaygroundApp state', () => {
  describe('buildInitialState', () => {
    test('returns empty state when no notation provided', () => {
      const state = buildInitialState(null)
      expect(state.notation).toBe('')
      expect(state.rollResult).toBeNull()
      expect(state.selectedEntry).toBeNull()
    })

    test('returns empty state when empty string provided', () => {
      const state = buildInitialState('')
      expect(state.notation).toBe('')
      expect(state.rollResult).toBeNull()
    })

    test('sets notation when initial value provided', () => {
      const state = buildInitialState('4d6')
      expect(state.notation).toBe('4d6')
    })

    test('does not auto-roll on initial load', () => {
      const state = buildInitialState('4d6')
      expect(state.rollResult).toBeNull()
    })
  })

  describe('applyEscape', () => {
    test('clears rollResult and selectedEntry', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        rollResult: fakeRollResult(),
        selectedEntry: 'L',
        rolling: false,
        suggestion: null
      }
      const next = applyEscape(prev)
      expect(next.rollResult).toBeNull()
      expect(next.selectedEntry).toBeNull()
    })

    test('preserves notation', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        rollResult: fakeRollResult(),
        selectedEntry: null,
        rolling: false,
        suggestion: null
      }
      const next = applyEscape(prev)
      expect(next.notation).toBe('4d6')
    })

    test('is a no-op when rollResult is already null', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        rollResult: null,
        selectedEntry: null,
        rolling: false,
        suggestion: null
      }
      const next = applyEscape(prev)
      expect(next.rollResult).toBeNull()
    })
  })

  describe('buildNotationUrl', () => {
    test('returns ?n= query string with notation', () => {
      expect(buildNotationUrl('4d6')).toBe('?n=4d6')
    })

    test('percent-encodes special characters', () => {
      expect(buildNotationUrl('4d6L')).toBe('?n=4d6L')
      expect(buildNotationUrl('2d6+3')).toBe('?n=2d6%2B3')
      expect(buildNotationUrl('4d6R{<3}')).toBe('?n=4d6R%7B%3C3%7D')
      expect(buildNotationUrl('d%')).toBe('?n=d%25')
    })

    test('handles empty string', () => {
      expect(buildNotationUrl('')).toBe('?n=')
    })
  })

  describe('URL state contract', () => {
    test('buildInitialState does not auto-roll even for valid notation', () => {
      const state = buildInitialState('4d6')
      expect(state.rollResult).toBeNull()
    })

    test('buildInitialState treats empty string as no notation', () => {
      const state = buildInitialState('')
      expect(state.notation).toBe('')
    })

    test('buildInitialState treats null as no notation', () => {
      const state = buildInitialState(null)
      expect(state.notation).toBe('')
    })

    test('applyEscape preserves notation', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        rollResult: fakeRollResult(),
        selectedEntry: null,
        rolling: false,
        suggestion: null
      }
      const next = applyEscape(prev)
      expect(next.notation).toBe('4d6')
      expect(next.rollResult).toBeNull()
    })
  })
})

describe('resolveInitialNotation', () => {
  test('returns notation value when ?notation= param is present', () => {
    const params = new URLSearchParams('notation=4d6L')
    expect(resolveInitialNotation(params)).toBe('4d6L')
  })

  test('returns null when ?notation= param is empty string', () => {
    const params = new URLSearchParams('notation=')
    expect(resolveInitialNotation(params)).toBeNull()
  })

  test('?notation= takes precedence over ?n= when both are present', () => {
    const params = new URLSearchParams('notation=4d6L&n=2d8')
    expect(resolveInitialNotation(params)).toBe('4d6L')
  })

  test('falls back to ?n= param when ?notation= is absent', () => {
    const params = new URLSearchParams('n=2d8')
    expect(resolveInitialNotation(params)).toBe('2d8')
  })

  test('returns null when no params present', () => {
    const params = new URLSearchParams('')
    expect(resolveInitialNotation(params)).toBeNull()
  })

  test('returns null when ?n= is empty string', () => {
    const params = new URLSearchParams('n=')
    expect(resolveInitialNotation(params)).toBeNull()
  })
})
