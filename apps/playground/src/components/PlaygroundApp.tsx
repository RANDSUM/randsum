import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll, validateNotation } from '@randsum/roller'
import type { DiceNotation, RollerRollResult, ValidationResult } from '@randsum/roller'
import { tokenize } from '@randsum/roller/tokenize'
import { createSession, fetchSession, updateSession } from '../lib/sessions'
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
  readonly sessionId: string | null
  readonly readOnly: boolean
}

export interface BuildInitialStateOptions {
  readonly sessionId?: string
  readonly readOnly?: boolean
}

// ---- Pure state transition helpers (exported for testing) ----

function deriveValidationState(notation: string, result: ValidationResult | null): ValidationState {
  if (notation === '') return 'empty'
  if (result === null) return 'empty'
  return result.valid ? 'valid' : 'invalid'
}

export function buildInitialState(
  initialNotation: string | null,
  options?: BuildInitialStateOptions
): PlaygroundState {
  const notation = initialNotation ?? ''
  const sessionId = options?.sessionId ?? null
  const readOnly = options?.readOnly ?? false

  if (notation === '') {
    return {
      notation: '',
      validationState: 'empty',
      validationResult: null,
      rollResult: null,
      selectedEntry: null,
      sessionId,
      readOnly
    }
  }

  const validationResult = validateNotation(notation)
  return {
    notation,
    validationState: deriveValidationState(notation, validationResult),
    validationResult,
    rollResult: null,
    selectedEntry: null,
    sessionId,
    readOnly
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

export function parseSessionIdFromPath(pathname: string): string | null {
  const match = /^\/s\/([A-Za-z0-9_-]+)$/.exec(pathname)
  return match?.[1] ?? null
}

export function buildSessionUrl(sessionId: string): string {
  return `/s/${sessionId}`
}

export function buildNotationUrl(notation: string): string {
  return `?n=${encodeURIComponent(notation)}`
}

export function clearNotationUrl(pathname: string): string {
  return pathname
}

// ---- Component ----

const DEBOUNCE_MS = 500

export function PlaygroundApp(): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const claimTokenRef = useRef<string | null>(null)
  const pendingNotationRef = useRef<string | null>(null)
  const stateRef = useRef<PlaygroundState>(buildInitialState(null))

  const [state, setState] = useState<PlaygroundState>(() => {
    if (typeof window === 'undefined') return buildInitialState(null)

    // Check for session ID in URL path
    const sessionId = parseSessionIdFromPath(window.location.pathname)
    if (sessionId) {
      const claimToken = localStorage.getItem(`pg-claim:${sessionId}`)
      claimTokenRef.current = claimToken
      return buildInitialState('', {
        sessionId,
        readOnly: claimToken === null
      })
    }

    // Legacy ?n= param seeds notation but doesn't create a session
    const params = new URLSearchParams(window.location.search)
    const n = params.get('n')
    return buildInitialState(n && n.length > 0 ? n : null)
  })

  // Keep stateRef in sync on every render
  stateRef.current = state

  // On mount: if sessionId in URL, fetch session and populate notation
  useEffect(() => {
    if (state.sessionId === null) return

    const controller = new AbortController()
    fetchSession(state.sessionId)
      .then(session => {
        if (controller.signal.aborted || session === null) return
        setState(prev => applyNotationChange(prev, session.notation))
      })
      .catch(() => {
        // Session not found — clear sessionId
        if (!controller.signal.aborted) {
          setState(prev => ({ ...prev, sessionId: null, readOnly: false }))
        }
      })
    return () => {
      controller.abort()
    }
  }, [])

  const [hoveredTokenIdx, setHoveredTokenIdx] = useState<number | null>(null)

  const tokens = useMemo(() => tokenize(state.notation), [state.notation])

  const handleChange = useCallback((notation: string) => {
    // Pure state update — no async side effects inside the updater
    setState(prev => applyNotationChange(prev, notation))
    setHoveredTokenIdx(null)

    // Track pending notation for debounce flush
    pendingNotationRef.current = notation

    // No session yet — create one on first non-empty keystroke
    if (stateRef.current.sessionId === null && notation.length > 0) {
      createSession(notation)
        .then(({ session, claimToken }) => {
          claimTokenRef.current = claimToken
          localStorage.setItem(`pg-claim:${session.id}`, claimToken)
          history.pushState({}, '', buildSessionUrl(session.id))
          setState(s => ({ ...s, sessionId: session.id }))
        })
        .catch(() => undefined) // Fall back to no-session mode
      return
    }

    // Schedule debounced save — reads from refs at fire time to avoid stale closures
    if (
      stateRef.current.sessionId !== null &&
      !stateRef.current.readOnly &&
      claimTokenRef.current !== null
    ) {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        const sid = stateRef.current.sessionId
        const token = claimTokenRef.current
        const pending = pendingNotationRef.current
        if (sid !== null && token !== null && pending !== null) {
          void updateSession(sid, pending, token)
          pendingNotationRef.current = null
        }
      }, DEBOUNCE_MS)
    }
  }, [])

  const handleSubmit = useCallback(() => {
    setState(prev => applySubmit(prev))
  }, [])

  const handleEscape = useCallback(() => {
    setState(prev => applyEscape(prev))
    inputRef.current?.focus()
  }, [])

  const handleSelect = useCallback((entryKey: string) => {
    setState(prev => ({
      ...prev,
      selectedEntry: prev.selectedEntry === entryKey ? null : entryKey
    }))
  }, [])

  // Flush pending debounced save on beforeunload via sendBeacon
  useEffect(() => {
    function onBeforeUnload(): void {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      const sid = stateRef.current.sessionId
      const token = claimTokenRef.current
      const pending = pendingNotationRef.current
      if (sid === null || token === null || pending === null) return

      const url = `${String(import.meta.env.PUBLIC_SUPABASE_URL)}/rest/v1/sessions?id=eq.${encodeURIComponent(sid)}`
      const body = JSON.stringify({
        notation: pending,
        updated_at: new Date().toISOString()
      })
      const blob = new Blob([body], { type: 'application/json' })

      // sendBeacon cannot set custom headers, so we fall back to keepalive fetch
      void fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
          Authorization: `Bearer ${String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY)}`,
          'x-claim-token': token,
          Prefer: 'return=minimal'
        },
        body: blob,
        keepalive: true
      })
      pendingNotationRef.current = null
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
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
          ref={inputRef}
          value={state.notation}
          validationState={state.validationState}
          tokens={tokens}
          hoveredTokenIdx={hoveredTokenIdx}
          onHoverToken={setHoveredTokenIdx}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
        <NotationDescription
          validationResult={state.validationResult}
          tokens={tokens}
          hoveredTokenIdx={hoveredTokenIdx}
          onHoverToken={setHoveredTokenIdx}
        />
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
