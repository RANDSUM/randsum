import React, { useCallback, useEffect, useRef, useState } from 'react'
import { roll, validateNotation } from '@randsum/roller'
import type { DiceNotation, RollerRollResult, ValidationResult } from '@randsum/roller'
import { PlaygroundHeader } from './PlaygroundHeader'

// ---- Types (exported for testing) ----

export type ValidationState = 'empty' | 'valid' | 'invalid'

export interface PlaygroundState {
  readonly notation: string
  readonly validationState: ValidationState
  readonly validationResult: ValidationResult | null
  readonly rollResult: RollerRollResult | null
  readonly selectedEntry: string | null
}

// ---- Pure state transition helpers (exported for testing) ----

function deriveValidationState(notation: string, result: ValidationResult | null): ValidationState {
  if (notation === '') return 'empty'
  if (result === null) return 'empty'
  return result.valid ? 'valid' : 'invalid'
}

export function buildInitialState(initialNotation: string | null): PlaygroundState {
  const notation = initialNotation ?? ''

  if (notation === '') {
    return {
      notation: '',
      validationState: 'empty',
      validationResult: null,
      rollResult: null,
      selectedEntry: null
    }
  }

  const validationResult = validateNotation(notation)
  return {
    notation,
    validationState: deriveValidationState(notation, validationResult),
    validationResult,
    rollResult: null,
    selectedEntry: null
  }
}

export function applyNotationChange(prev: PlaygroundState, notation: string): PlaygroundState {
  if (notation === '') {
    return {
      ...prev,
      notation: '',
      validationState: 'empty',
      validationResult: null
    }
  }

  const validationResult = validateNotation(notation)
  const validationState = deriveValidationState(notation, validationResult)

  return {
    ...prev,
    notation,
    validationState,
    validationResult,
    // Clear rollResult only when notation becomes invalid
    rollResult: validationState === 'invalid' ? null : prev.rollResult
  }
}

export function applySubmit(prev: PlaygroundState): PlaygroundState {
  if (prev.validationState !== 'valid') return prev

  try {
    const rollResult = roll(prev.notation as DiceNotation)
    return { ...prev, rollResult }
  } catch {
    return prev
  }
}

export function applyEscape(prev: PlaygroundState): PlaygroundState {
  return { ...prev, rollResult: null }
}

// ---- URL helpers (exported for testing) ----

export function buildNotationUrl(notation: string): string {
  return `?n=${encodeURIComponent(notation)}`
}

export function clearNotationUrl(pathname: string): string {
  return pathname
}

// ---- Component ----

export function PlaygroundApp(): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<PlaygroundState>(() => {
    // Read ?n= from URL on mount (safe: only runs client-side)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const n = params.get('n')
      return buildInitialState(n && n.length > 0 ? n : null)
    }
    return buildInitialState(null)
  })

  const handleChange = useCallback((notation: string) => {
    setState(prev => applyNotationChange(prev, notation))
  }, [])

  const handleSubmit = useCallback(() => {
    setState(prev => {
      if (prev.validationState !== 'valid') return prev
      const next = applySubmit(prev)
      if (next.rollResult !== null && typeof window !== 'undefined') {
        history.replaceState({}, '', buildNotationUrl(prev.notation))
      }
      return next
    })
  }, [])

  const handleEscape = useCallback(() => {
    setState(prev => applyEscape(prev))
    if (typeof window !== 'undefined') {
      history.replaceState({}, '', clearNotationUrl(window.location.pathname))
    }
    inputRef.current?.focus()
  }, [])

  const handleSelect = useCallback((entryKey: string) => {
    setState(prev => ({ ...prev, selectedEntry: entryKey }))
  }, [])

  // Global keyboard handler for Enter/Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        handleEscape()
      }
      // Enter is handled by the input's onKeyDown to avoid conflicts
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [handleEscape])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--pg-color-bg)',
        color: 'var(--pg-color-text)',
        fontFamily: 'var(--pg-font-body)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <PlaygroundHeader notation={state.notation} />

      {/* Notation input area — NotationInput component wired in later story */}
      <div data-area="notation-input" style={{ padding: 'var(--pg-space-lg)' }}>
        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={state.notation}
          placeholder="4d6L"
          onChange={e => {
            handleChange(e.target.value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && state.validationState === 'valid') {
              handleSubmit()
            } else if (e.key === 'Escape') {
              handleEscape()
            }
          }}
          style={{
            width: '100%',
            padding: 'var(--pg-space-sm) var(--pg-space-md)',
            fontFamily: 'var(--pg-font-mono)',
            fontSize: '1rem',
            backgroundColor: 'var(--pg-color-surface)',
            color: 'var(--pg-color-text)',
            border: `1px solid ${
              state.validationState === 'valid'
                ? 'var(--pg-color-accent)'
                : state.validationState === 'invalid'
                  ? 'var(--pg-color-error)'
                  : 'var(--pg-color-border)'
            }`,
            borderRadius: 'var(--pg-radius-sm)',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={state.validationState !== 'valid'}
          onClick={handleSubmit}
          style={{
            marginTop: 'var(--pg-space-sm)',
            padding: 'var(--pg-space-xs) var(--pg-space-md)',
            backgroundColor:
              state.validationState === 'valid'
                ? 'var(--pg-color-accent)'
                : 'var(--pg-color-border)',
            color: 'var(--pg-color-text)',
            border: 'none',
            borderRadius: 'var(--pg-radius-sm)',
            fontFamily: 'var(--pg-font-mono)',
            cursor: state.validationState === 'valid' ? 'pointer' : 'not-allowed'
          }}
        >
          Go
        </button>
      </div>

      {/* Description area — NotationDescription component wired in later story */}
      <div data-area="notation-description" style={{ padding: '0 var(--pg-space-lg)' }} />

      {/* Result area — RollResult component wired in later story */}
      {state.rollResult !== null && (
        <div data-area="roll-result" style={{ padding: 'var(--pg-space-lg)' }}>
          <span style={{ fontSize: '3rem', color: 'var(--pg-color-total)' }}>
            {state.rollResult.total}
          </span>
        </div>
      )}

      {/* Reference sidebar placeholder — ReferenceSidebar wired in later story */}
      <div
        data-area="reference-sidebar"
        style={{ display: 'none' }}
        aria-hidden="true"
        onClick={() => {
          handleSelect('')
        }}
      />
    </div>
  )
}
