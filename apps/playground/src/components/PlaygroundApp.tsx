import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roll, validateNotation } from '@randsum/roller'
import type { DiceNotation, RollerRollResult, ValidationResult } from '@randsum/roller'
import { tokenize } from '@randsum/roller/tokenize'
import { createSessionSafe, fetchSession, forkSession, updateSession } from '../lib/sessions'
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
  readonly loading: boolean
  readonly sessionError: string | null
}

export interface BuildInitialStateOptions {
  readonly sessionId?: string
  readonly readOnly?: boolean
  readonly loading?: boolean
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
  const loading = options?.loading ?? false

  if (notation === '') {
    return {
      notation: '',
      validationState: 'empty',
      validationResult: null,
      rollResult: null,
      selectedEntry: null,
      sessionId,
      readOnly,
      loading,
      sessionError: null
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
    readOnly,
    loading,
    sessionError: null
  }
}

export function applySessionError(prev: PlaygroundState, message: string): PlaygroundState {
  return { ...prev, loading: false, sessionError: message }
}

export function applySessionLoaded(prev: PlaygroundState, notation: string): PlaygroundState {
  const updated = applyNotationChange({ ...prev, loading: false, sessionError: null }, notation)
  return updated
}

export function applySessionNotFound(prev: PlaygroundState): PlaygroundState {
  return {
    ...prev,
    loading: false,
    sessionError: 'Session not found',
    sessionId: null,
    readOnly: false
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

export interface ResolvedInitialNotation {
  readonly notation: string | null
  readonly isSessionSource: boolean
}

/**
 * Resolves the initial notation from URL query params.
 * ?notation= takes precedence over ?n= and does not trigger session creation.
 * ?n= falls back as the session-source param.
 */
export function resolveInitialNotation(params: URLSearchParams): ResolvedInitialNotation {
  const notationParam = params.get('notation')
  if (notationParam !== null) {
    return {
      notation: notationParam.length > 0 ? notationParam : null,
      isSessionSource: false
    }
  }

  const nParam = params.get('n')
  return {
    notation: nParam !== null && nParam.length > 0 ? nParam : null,
    isSessionSource: nParam !== null
  }
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
  const creatingRef = useRef(false)
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
        readOnly: claimToken === null,
        loading: true
      })
    }

    // ?notation= seeds notation without session creation (isSessionSource=false).
    // ?n= also seeds notation; session creation is gated in handleChange on first keystroke.
    // In both cases, buildInitialState with no sessionId is the correct initial state.
    const params = new URLSearchParams(window.location.search)
    const { notation } = resolveInitialNotation(params)
    return buildInitialState(notation)
  })

  // Keep stateRef in sync on every render
  stateRef.current = state

  // On mount: if sessionId in URL, fetch session and populate notation
  useEffect(() => {
    if (state.sessionId === null) return

    const controller = new AbortController()
    fetchSession(state.sessionId)
      .then(session => {
        if (controller.signal.aborted) return
        if (session === null) {
          setState(prev => applySessionNotFound(prev))
        } else {
          setState(prev => applySessionLoaded(prev, session.notation))
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState(prev => applySessionNotFound(prev))
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
    // Guard prevents duplicate INSERTs while createSession is in-flight
    if (stateRef.current.sessionId === null && notation.length > 0 && !creatingRef.current) {
      creatingRef.current = true
      void createSessionSafe(notation).then(result => {
        creatingRef.current = false
        if (result === null) {
          // All retries exhausted — continue in local-only mode, URL unchanged
          console.warn('[randsum/playground] Session creation failed, continuing local-only')
          return
        }
        const { session, claimToken } = result
        claimTokenRef.current = claimToken
        localStorage.setItem(`pg-claim:${session.id}`, claimToken)
        history.pushState({}, '', buildSessionUrl(session.id))
        setState(s => ({ ...s, sessionId: session.id }))
      })
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
          void updateSession(sid, pending, token).catch((err: unknown) => {
            console.warn('[randsum/playground] updateSession failed:', err)
          })
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

  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true)
      setTimeout(() => {
        setShareCopied(false)
      }, 2000)
    })
  }, [])

  const handleFork = useCallback(() => {
    const notation = stateRef.current.notation
    void forkSession(notation)
      .then(({ session, claimToken }) => {
        claimTokenRef.current = claimToken
        localStorage.setItem(`pg-claim:${session.id}`, claimToken)
        history.pushState({}, '', buildSessionUrl(session.id))
        setState(prev => ({ ...prev, sessionId: session.id, readOnly: false }))
        inputRef.current?.focus()
      })
      .catch((_: unknown) => {
        // Fork failed silently — user stays in read-only mode
      })
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
          readOnly={state.readOnly}
          onFork={handleFork}
          onShare={handleShare}
          shareCopied={shareCopied}
          sessionId={state.sessionId}
        />
        {state.loading && (
          <p
            style={{
              margin: 'var(--pg-space-sm) 0 0',
              fontSize: '0.85rem',
              color: 'var(--pg-color-text-muted)'
            }}
          >
            Loading session...
          </p>
        )}
        {state.sessionError !== null && !state.loading && (
          <p
            style={{
              margin: 'var(--pg-space-sm) 0 0',
              fontSize: '0.85rem',
              color: 'var(--pg-color-error)'
            }}
          >
            {state.sessionError}.{' '}
            <button
              type="button"
              onClick={() => {
                setState(prev => ({ ...prev, sessionError: null }))
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--pg-color-accent)',
                cursor: 'pointer',
                fontSize: 'inherit',
                textDecoration: 'underline'
              }}
            >
              Start fresh
            </button>
          </p>
        )}
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
