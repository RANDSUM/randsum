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
  buildInitialState,
  buildNotationUrl,
  buildSessionUrl,
  clearNotationUrl,
  parseSessionIdFromPath,
  resolveInitialNotation
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

    test('includes sessionId null and readOnly false by default', () => {
      const state = buildInitialState(null)
      expect(state.sessionId).toBeNull()
      expect(state.readOnly).toBe(false)
    })

    test('includes sessionId null when notation is provided', () => {
      const state = buildInitialState('4d6')
      expect(state.sessionId).toBeNull()
      expect(state.readOnly).toBe(false)
    })

    test('accepts sessionId option to populate session state', () => {
      const state = buildInitialState('4d6', { sessionId: 'abc123' })
      expect(state.sessionId).toBe('abc123')
      expect(state.notation).toBe('4d6')
    })

    test('sets readOnly true when sessionId provided with readOnly option', () => {
      const state = buildInitialState('4d6', {
        sessionId: 'abc123',
        readOnly: true
      })
      expect(state.sessionId).toBe('abc123')
      expect(state.readOnly).toBe(true)
    })
  })

  describe('applyNotationChange', () => {
    test('sets validationState to empty when notation is empty', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: null,
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
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
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
      }
      const next = applyEscape(prev)
      expect(next.rollResult).toBeNull()
    })
  })

  describe('parseSessionIdFromPath', () => {
    test('returns session ID from /s/{id} path', () => {
      expect(parseSessionIdFromPath('/s/abc123')).toBe('abc123')
    })

    test('returns null for bare root path', () => {
      expect(parseSessionIdFromPath('/')).toBeNull()
    })

    test('returns null for non-session path', () => {
      expect(parseSessionIdFromPath('/about')).toBeNull()
    })

    test('returns null for /s/ with no ID', () => {
      expect(parseSessionIdFromPath('/s/')).toBeNull()
    })

    test('handles URL-safe characters in session ID', () => {
      expect(parseSessionIdFromPath('/s/aB3_-xY')).toBe('aB3_-xY')
    })

    test('returns null for path with extra segments after session ID', () => {
      expect(parseSessionIdFromPath('/s/abc123/extra')).toBeNull()
    })
  })

  describe('buildSessionUrl', () => {
    test('returns /s/{id} path', () => {
      expect(buildSessionUrl('abc123')).toBe('/s/abc123')
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

  describe('clearNotationUrl', () => {
    test('returns the pathname without query string', () => {
      expect(clearNotationUrl('/playground')).toBe('/playground')
    })

    test('returns / for root pathname', () => {
      expect(clearNotationUrl('/')).toBe('/')
    })

    test('returns arbitrary pathname unchanged', () => {
      expect(clearNotationUrl('/foo/bar')).toBe('/foo/bar')
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
      expect(state.validationState).toBe<ValidationState>('empty')
    })

    test('buildInitialState treats null as no notation', () => {
      const state = buildInitialState(null)
      expect(state.notation).toBe('')
      expect(state.validationState).toBe<ValidationState>('empty')
    })

    test('applyEscape preserves notation (URL clear is a side effect in the handler)', () => {
      const prev: PlaygroundState = {
        notation: '4d6',
        validationState: 'valid',
        validationResult: null,
        rollResult: fakeRollResult(),
        selectedEntry: null,
        sessionId: null,
        readOnly: false,
        loading: false,
        sessionError: null
      }
      const next = applyEscape(prev)
      // The pure function clears rollResult — URL side effect is separate
      expect(next.notation).toBe('4d6')
      expect(next.rollResult).toBeNull()
    })
  })
})

describe('resolveInitialNotation', () => {
  test('returns notation value when ?notation= param is present', () => {
    const params = new URLSearchParams('notation=4d6L')
    expect(resolveInitialNotation(params)).toStrictEqual({
      notation: '4d6L',
      isSessionSource: false
    })
  })

  test('returns null notation when ?notation= param is empty string', () => {
    const params = new URLSearchParams('notation=')
    expect(resolveInitialNotation(params)).toStrictEqual({ notation: null, isSessionSource: false })
  })

  test('?notation= takes precedence over ?n= when both are present', () => {
    const params = new URLSearchParams('notation=4d6L&n=2d8')
    expect(resolveInitialNotation(params)).toStrictEqual({
      notation: '4d6L',
      isSessionSource: false
    })
  })

  test('returns isSessionSource false when ?notation= is the source', () => {
    const params = new URLSearchParams('notation=4d6L')
    const result = resolveInitialNotation(params)
    expect(result.isSessionSource).toBe(false)
  })

  test('falls back to ?n= param when ?notation= is absent', () => {
    const params = new URLSearchParams('n=2d8')
    expect(resolveInitialNotation(params)).toStrictEqual({ notation: '2d8', isSessionSource: true })
  })

  test('returns isSessionSource true when ?n= is the source', () => {
    const params = new URLSearchParams('n=2d8')
    const result = resolveInitialNotation(params)
    expect(result.isSessionSource).toBe(true)
  })

  test('returns null notation when no params present', () => {
    const params = new URLSearchParams('')
    expect(resolveInitialNotation(params)).toStrictEqual({ notation: null, isSessionSource: false })
  })

  test('returns null notation when ?n= is empty string', () => {
    const params = new URLSearchParams('n=')
    expect(resolveInitialNotation(params)).toStrictEqual({ notation: null, isSessionSource: true })
  })
})
