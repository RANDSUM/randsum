import React, { useCallback, useEffect, useRef, useState } from 'react'
import { roll, validateNotation } from '@randsum/roller'
import type { DiceNotation, RollerRollResult, ValidationResult } from '@randsum/roller'
import { PlaygroundHeader } from './PlaygroundHeader'
import { NotationInput } from './NotationInput'
import { NotationDescription } from './NotationDescription'
import { RollResult } from './RollResult'
import { QuickReferenceGrid } from './QuickReferenceGrid'

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

      <div
        style={{
          maxWidth: '52rem',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--pg-space-md) var(--pg-space-lg)'
        }}
      >
        <NotationInput
          value={state.notation}
          validationState={state.validationState}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        <NotationDescription validationResult={state.validationResult} />
        {state.rollResult !== null && <RollResult result={state.rollResult} />}

        <div style={{ marginTop: 'var(--pg-space-lg)' }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontFamily: 'var(--pg-font-body)',
              fontWeight: 600,
              color: 'var(--pg-color-text-muted)',
              margin: '0 0 var(--pg-space-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Notation quick reference
          </h3>
          <QuickReferenceGrid selectedEntry={state.selectedEntry} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  )
}
