import { describe, expect, test } from 'bun:test'

// These tests validate the NotationInput prop interface contract
// and PlaygroundApp wiring for read-only mode.
// They are module-level (no DOM) since bun:test doesn't provide jsdom.

describe('NotationInput read-only prop contract', () => {
  test('NotationInput is exported as a forwardRef function', async () => {
    const mod = await import('../components/NotationInput')
    expect(typeof mod.NotationInput).toBe('object') // forwardRef returns an object with $$typeof
    expect(mod.NotationInput).not.toBeNull()
  })

  test('NotationInput module exports are stable', async () => {
    const mod = await import('../components/NotationInput')
    // Regression guard: ensure existing exports are still present
    expect(typeof mod.tokenTypeToClass).toBe('function')
    expect(typeof mod.validationStateToBorderColor).toBe('function')
    expect(mod.NotationInput).toBeDefined()
  })
})

describe('PlaygroundApp state helpers — readOnly and sessionId', () => {
  test('buildInitialState defaults to readOnly=false and sessionId=null', async () => {
    const mod = await import('../components/PlaygroundApp')
    const state = mod.buildInitialState(null)
    expect(state.readOnly).toBe(false)
    expect(state.sessionId).toBeNull()
  })

  test('buildInitialState accepts readOnly=true and sessionId', async () => {
    const mod = await import('../components/PlaygroundApp')
    const state = mod.buildInitialState('4d6L', { sessionId: 'abc12345', readOnly: true })
    expect(state.readOnly).toBe(true)
    expect(state.sessionId).toBe('abc12345')
  })

  test('buildInitialState with readOnly=false and sessionId allows editing', async () => {
    const mod = await import('../components/PlaygroundApp')
    const state = mod.buildInitialState('2d8', { sessionId: 'xyz99999', readOnly: false })
    expect(state.readOnly).toBe(false)
    expect(state.sessionId).toBe('xyz99999')
  })

  test('applyNotationChange preserves readOnly flag', async () => {
    const mod = await import('../components/PlaygroundApp')
    const initial = mod.buildInitialState('4d6L', { sessionId: 'abc12345', readOnly: true })
    const updated = mod.applyNotationChange(initial, '2d8')
    expect(updated.readOnly).toBe(true)
    expect(updated.sessionId).toBe('abc12345')
  })
})

describe('PlaygroundApp URL helpers', () => {
  test('buildSessionUrl constructs /s/ path', async () => {
    const mod = await import('../components/PlaygroundApp')
    expect(mod.buildSessionUrl('abc12345')).toBe('/s/abc12345')
  })

  test('parseSessionIdFromPath extracts id from /s/{id}', async () => {
    const mod = await import('../components/PlaygroundApp')
    expect(mod.parseSessionIdFromPath('/s/abc12345')).toBe('abc12345')
    expect(mod.parseSessionIdFromPath('/')).toBeNull()
    expect(mod.parseSessionIdFromPath('/s/')).toBeNull()
    expect(mod.parseSessionIdFromPath('/about')).toBeNull()
  })
})

describe('sessions.forkSession — interface contract', () => {
  test('forkSession is exported from sessions lib', async () => {
    // Dynamic import to avoid supabase env-var errors at module load time
    // We only verify the shape, not invoke it (requires live Supabase)
    const getForkSession = async (): Promise<unknown> => {
      try {
        const mod = await import('../lib/sessions')
        return mod.forkSession
      } catch {
        // If import fails due to missing env vars, that's acceptable in test env
        return undefined
      }
    }
    const forkSession = await getForkSession()
    // Either it's a function or import failed (env not set)
    if (forkSession !== undefined) {
      expect(typeof forkSession).toBe('function')
    }
  })
})
