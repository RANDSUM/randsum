import { describe, expect, test } from 'bun:test'

// Test pure state helpers related to error/loading state in PlaygroundApp.
// React component rendering tests require jsdom; we keep these pure-logic only.

describe('buildInitialState with loading flag', () => {
  test('buildInitialState includes loading: false by default', async () => {
    const { buildInitialState } = await import('../components/PlaygroundApp')
    const state = buildInitialState(null)
    expect(state.loading).toBe(false)
  })

  test('buildInitialState can set loading: true', async () => {
    const { buildInitialState } = await import('../components/PlaygroundApp')
    const state = buildInitialState(null, { loading: true })
    expect(state.loading).toBe(true)
  })

  test('buildInitialState sessionError is null by default', async () => {
    const { buildInitialState } = await import('../components/PlaygroundApp')
    const state = buildInitialState(null)
    expect(state.sessionError).toBeNull()
  })
})

describe('applySessionError', () => {
  test('applySessionError sets sessionError and clears loading', async () => {
    const { applySessionError, buildInitialState } = await import('../components/PlaygroundApp')
    const initial = buildInitialState(null, { loading: true })
    const result = applySessionError(initial, 'Session not found')
    expect(result.sessionError).toBe('Session not found')
    expect(result.loading).toBe(false)
  })
})

describe('applySessionLoaded', () => {
  test('applySessionLoaded clears loading and error, sets notation', async () => {
    const { applySessionLoaded, buildInitialState } = await import('../components/PlaygroundApp')
    const initial = buildInitialState(null, { loading: true })
    const result = applySessionLoaded(initial, '4d6L')
    expect(result.loading).toBe(false)
    expect(result.sessionError).toBeNull()
    expect(result.notation).toBe('4d6L')
  })
})

describe('applySessionNotFound', () => {
  test('applySessionNotFound clears loading, sets sessionError, resets readOnly', async () => {
    const { applySessionNotFound, buildInitialState } = await import('../components/PlaygroundApp')
    const initial = buildInitialState(null, { loading: true, sessionId: 'abc123', readOnly: true })
    const result = applySessionNotFound(initial)
    expect(result.loading).toBe(false)
    expect(result.sessionError).toBe('Session not found')
    expect(result.sessionId).toBeNull()
    expect(result.readOnly).toBe(false)
  })
})
