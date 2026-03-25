import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NotationRoller, RollResultPanel } from '@randsum/dice-ui'
import type { RollResult as RollResultData } from '@randsum/dice-ui'
import { PlaygroundHeader } from './PlaygroundHeader'
import { QuickReferenceGrid } from '@randsum/dice-ui'
import { buildNotationUrl, resolveInitialNotation } from '../helpers/url'

// Re-export URL helpers for backward-compat with existing tests
export { buildNotationUrl, resolveInitialNotation }

// ---- Types (exported for testing) ----

export interface PlaygroundState {
  readonly notation: string
  readonly rollResult: RollResultData | null
  readonly selectedEntry: string | null
}

// ---- Pure state transition helpers (exported for testing) ----

export function buildInitialState(initialNotation: string | null): PlaygroundState {
  return {
    notation: initialNotation ?? '',
    rollResult: null,
    selectedEntry: null
  }
}

export function applyEscape(prev: PlaygroundState): PlaygroundState {
  return { ...prev, rollResult: null, selectedEntry: null }
}

// ---- Component ----

export function PlaygroundApp(): React.ReactElement {
  const stateRef = useRef(buildInitialState(null))

  const [state, setState] = useState<PlaygroundState>(() => {
    if (typeof window === 'undefined') return buildInitialState(null)
    const params = new URLSearchParams(window.location.search)
    const notation = resolveInitialNotation(params)
    return buildInitialState(notation)
  })

  stateRef.current = state

  const handleChange = useCallback((notation: string) => {
    setState(prev => ({ ...prev, notation }))
  }, [])

  const handleRoll = useCallback((result: RollResultData) => {
    setState(prev => ({ ...prev, rollResult: result }))
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

  // Global keyboard handler for Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setState(prev => applyEscape(prev))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
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
                  <RollResultPanel
                    total={state.rollResult.total}
                    records={state.rollResult.records}
                    notation={state.rollResult.notation}
                    onClose={() => {
                      setState(prev => applyEscape(prev))
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
