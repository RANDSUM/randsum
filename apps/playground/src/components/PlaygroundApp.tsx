import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NotationRoller, RollResultPanel } from '@randsum/dice-ui'
import type { RollResult as RollResultData } from '@randsum/dice-ui'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { suggestNotationFix } from '@randsum/roller'
import { PlaygroundHeader } from './PlaygroundHeader'
import { QuickReferenceGrid } from '@randsum/dice-ui'
import { buildNotationUrl, resolveInitialNotation } from '../helpers/url'
import {
  type PlaygroundState,
  applyEscape,
  applyRollResult,
  applyRolling,
  applySuggestion,
  buildInitialState,
  computeSuggestion
} from './playgroundStateUtils'

// Re-export URL helpers for backward-compat with existing tests
export { buildNotationUrl, resolveInitialNotation }

// Re-export state types and helpers for backward-compat with existing tests
export type { PlaygroundState }
export { applyEscape, buildInitialState }

// ---- Component ----

export function PlaygroundApp(): React.ReactElement {
  const stateRef = useRef(buildInitialState(null))
  const rollingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [state, setState] = useState<PlaygroundState>(() => {
    if (typeof window === 'undefined') return buildInitialState(null)
    const params = new URLSearchParams(window.location.search)
    const notation = resolveInitialNotation(params)
    return buildInitialState(notation)
  })

  stateRef.current = state

  // Clean up rolling timer on unmount
  useEffect(() => {
    return () => {
      if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current)
    }
  }, [])

  const handleChange = useCallback((notation: string) => {
    setState(prev => {
      const suggestion = isDiceNotation(notation)
        ? null
        : computeSuggestion(notation, suggestNotationFix)
      return applySuggestion({ ...prev, notation }, suggestion)
    })
  }, [])

  const handleRoll = useCallback((result: RollResultData) => {
    setState(prev => applyRollResult(prev, result))
  }, [])

  const triggerRoll = useCallback(() => {
    const { notation } = stateRef.current
    if (!isDiceNotation(notation)) return
    setState(prev => applyRolling(prev))
    if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current)
    rollingTimerRef.current = setTimeout(() => {
      try {
        const result = roll(notation)
        if (result.rolls.length > 0) {
          setState(prev =>
            applyRollResult(prev, { total: result.total, records: result.rolls, notation })
          )
        } else {
          setState(prev => ({ ...prev, rolling: false }))
        }
      } catch {
        setState(prev => ({ ...prev, rolling: false }))
      }
    }, 300)
  }, [])

  const handleSelect = useCallback((entryKey: string) => {
    setState(prev => ({
      ...prev,
      selectedEntry: prev.selectedEntry === entryKey ? null : entryKey
    }))
  }, [])

  const handleAddFragment = useCallback(
    (fragment: string) => {
      const newNotation = stateRef.current.notation + fragment
      handleChange(newNotation)
      setState(prev => ({ ...prev, selectedEntry: null }))
    },
    [handleChange]
  )

  // Debounced URL sync — update ?n= as user types without a page reload.
  // When notation is empty, remove the query string entirely.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next =
        state.notation.length > 0 ? buildNotationUrl(state.notation) : window.location.pathname
      history.replaceState({}, '', next)
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [state.notation])

  // Global keyboard handler for Escape and Enter
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setState(prev => applyEscape(prev))
      } else if (e.key === 'Enter') {
        triggerRoll()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [triggerRoll])

  const handleSuggestionClick = useCallback((): void => {
    const suggested = stateRef.current.suggestion
    if (suggested === null) return
    setState(prev => applySuggestion({ ...prev, notation: suggested }, null))
  }, [])

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
        <NotationRoller notation={state.notation} onChange={handleChange} onRoll={handleRoll} />

        {state.suggestion !== null && (
          <div
            style={{
              marginTop: 'var(--pg-space-xs)',
              fontSize: '0.85rem',
              color: 'var(--pg-color-text-muted)'
            }}
          >
            {'Did you mean: '}
            <button
              onClick={handleSuggestionClick}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--pg-font-mono)',
                color: 'var(--pg-color-accent)',
                fontSize: 'inherit'
              }}
            >
              {state.suggestion}
            </button>
            {'?'}
          </div>
        )}

        <div style={{ marginTop: 'var(--pg-space-lg)', position: 'relative' }}>
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
          <QuickReferenceGrid
            notation={state.notation}
            selectedEntry={state.selectedEntry}
            onSelect={handleSelect}
            onAdd={handleAddFragment}
          />

          {state.rollResult !== null && (
            <>
              <div
                className="qrg-overlay-backdrop"
                onClick={() => {
                  setState(prev => applyEscape(prev))
                }}
              />
              <div className="qrg-overlay-panel">
                <div className="qrg-overlay-content">
                  {state.rolling ? (
                    <div
                      style={{
                        padding: 'var(--pg-space-lg)',
                        color: 'var(--pg-color-text-muted)',
                        fontFamily: 'var(--pg-font-mono)'
                      }}
                    >
                      Rolling...
                    </div>
                  ) : (
                    <RollResultPanel
                      total={state.rollResult.total}
                      records={state.rollResult.records}
                      notation={state.rollResult.notation}
                      onClose={() => {
                        setState(prev => applyEscape(prev))
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
