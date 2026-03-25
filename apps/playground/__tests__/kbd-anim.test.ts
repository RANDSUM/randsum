/**
 * Tests for keyboard shortcut, rolling animation, and error suggestion features.
 * Tests cover pure state transition helpers exported from playgroundStateUtils.
 * suggestNotationFix is imported from roller source directly (no dist required).
 */
import { describe, expect, test } from 'bun:test'
import type { RollResult } from '@randsum/dice-ui'
import { suggestNotationFix } from '../../../packages/roller/src/notation/suggestions'
import {
  type PlaygroundState,
  applyEscape,
  applyRollResult,
  applyRolling,
  applySuggestion,
  buildInitialState,
  computeSuggestion
} from '../src/components/playgroundStateUtils'

function fakeRollResult(): RollResult {
  return { total: 10, records: [], notation: '2d6' }
}

describe('PlaygroundState shape', () => {
  test('buildInitialState includes rolling: false', () => {
    const state = buildInitialState(null)
    expect(state.rolling).toBe(false)
  })

  test('buildInitialState includes suggestion: null', () => {
    const state = buildInitialState(null)
    expect(state.suggestion).toBeNull()
  })
})

describe('applyRolling', () => {
  test('sets rolling to true', () => {
    const prev = buildInitialState('4d6')
    const next = applyRolling(prev)
    expect(next.rolling).toBe(true)
  })

  test('preserves notation', () => {
    const prev = buildInitialState('4d6')
    const next = applyRolling(prev)
    expect(next.notation).toBe('4d6')
  })

  test('does not clear rollResult', () => {
    const prev: PlaygroundState = {
      notation: '4d6',
      rollResult: fakeRollResult(),
      selectedEntry: null,
      rolling: false,
      suggestion: null
    }
    const next = applyRolling(prev)
    expect(next.rollResult).not.toBeNull()
  })
})

describe('applyRollResult', () => {
  test('sets rollResult and clears rolling', () => {
    const result = fakeRollResult()
    const prev: PlaygroundState = {
      notation: '2d6',
      rollResult: null,
      selectedEntry: null,
      rolling: true,
      suggestion: null
    }
    const next = applyRollResult(prev, result)
    expect(next.rollResult).toBe(result)
    expect(next.rolling).toBe(false)
  })

  test('preserves notation', () => {
    const prev: PlaygroundState = {
      notation: '2d6',
      rollResult: null,
      selectedEntry: null,
      rolling: true,
      suggestion: null
    }
    const next = applyRollResult(prev, fakeRollResult())
    expect(next.notation).toBe('2d6')
  })
})

describe('applyEscape', () => {
  test('clears rolling', () => {
    const prev: PlaygroundState = {
      notation: '4d6',
      rollResult: fakeRollResult(),
      selectedEntry: null,
      rolling: true,
      suggestion: null
    }
    const next = applyEscape(prev)
    expect(next.rolling).toBe(false)
  })

  test('clears suggestion', () => {
    const prev: PlaygroundState = {
      notation: '4d6',
      rollResult: null,
      selectedEntry: null,
      rolling: false,
      suggestion: '4d6'
    }
    const next = applyEscape(prev)
    expect(next.suggestion).toBeNull()
  })
})

describe('applySuggestion', () => {
  test('sets suggestion on state', () => {
    const prev = buildInitialState('d6')
    const next = applySuggestion(prev, '1d6')
    expect(next.suggestion).toBe('1d6')
  })

  test('clears suggestion when null passed', () => {
    const prev: PlaygroundState = {
      notation: '4d6',
      rollResult: null,
      selectedEntry: null,
      rolling: false,
      suggestion: '4d6'
    }
    const next = applySuggestion(prev, null)
    expect(next.suggestion).toBeNull()
  })

  test('preserves notation', () => {
    const prev = buildInitialState('d6')
    const next = applySuggestion(prev, '1d6')
    expect(next.notation).toBe('d6')
  })
})

describe('computeSuggestion', () => {
  test('returns suggestion for missing quantity (d6 -> 1d6)', () => {
    const result = computeSuggestion('d6', suggestNotationFix)
    expect(result).toBe('1d6')
  })

  test('returns suggestion for extra spaces (e.g. "4 d6" -> "4d6")', () => {
    const result = computeSuggestion('4 d6', suggestNotationFix)
    expect(result).toBe('4d6')
  })

  test('returns null when fixer returns undefined for unrecognizable input', () => {
    // suggestNotationFix returns undefined only for completely unrecognizable input
    const result = computeSuggestion('xyz', suggestNotationFix)
    expect(result).toBeNull()
  })

  test('returns null when fixer returns undefined', () => {
    const result = computeSuggestion('xyz', () => undefined)
    expect(result).toBeNull()
  })

  test('returns fix string when fixer returns a value', () => {
    const result = computeSuggestion('anything', () => '4d6')
    expect(result).toBe('4d6')
  })
})
