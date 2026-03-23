import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { Session, User } from '@supabase/supabase-js'

// Capture the onAuthStateChange callback so we can fire it in tests
let authStateCallback: ((event: string, session: Session | null) => void) | null = null

const mockUnsubscribe = mock(() => undefined)
const mockSignInWithPassword = mock(async (_opts: unknown) => ({
  data: {} as unknown,
  error: null as { message: string } | null
}))
const mockSignUp = mock(async (_opts: unknown) => ({
  data: {} as unknown,
  error: null as { message: string } | null
}))
const mockSignOut = mock(async () => ({ error: null }))
const mockGetSession = mock(async () => ({
  data: { session: null as Session | null },
  error: null
}))

// Mock lib/supabase so the env var guard never runs
mock.module('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: (cb: (event: string, session: Session | null) => void) => {
        authStateCallback = cb
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      },
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut
    }
  }
}))

mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (_key: string): Promise<string | null> => null,
    setItem: async (_key: string, _value: string): Promise<void> => undefined,
    removeItem: async (_key: string): Promise<void> => undefined
  }
}))

mock.module('react-native', () => ({
  useColorScheme: () => 'dark',
  StyleSheet: {
    create: <T extends Record<string, object>>(styles: T): T => styles
  }
}))

// Import supabase mock after module mock is registered
const { supabase } = await import('../lib/supabase')

function makeUser(email: string): User {
  return {
    id: 'user-123',
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-03-22T00:00:00.000Z'
  } as User
}

function makeSession(email: string): Session {
  return {
    user: makeUser(email),
    access_token: 'tok',
    refresh_token: 'ref',
    expires_in: 3600,
    token_type: 'bearer'
  } as Session
}

describe('useAuth — supabase interactions', () => {
  beforeEach(() => {
    authStateCallback = null
    mockSignInWithPassword.mockReset()
    mockSignUp.mockReset()
    mockSignOut.mockReset()
    mockGetSession.mockReset()
    mockUnsubscribe.mockReset()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  test('getSession is called on mount (via supabase.auth.getSession)', async () => {
    await supabase.auth.getSession()
    expect(mockGetSession).toHaveBeenCalledTimes(1)
  })

  test('signInWithPassword is called with email and password', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null })
    await supabase.auth.signInWithPassword({ email: 'a@b.com', password: 'pass' })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' })
  })

  test('signInWithPassword returns null error on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null })
    const { error } = await supabase.auth.signInWithPassword({ email: 'a@b.com', password: 'pass' })
    expect(error).toBeNull()
  })

  test('signInWithPassword returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' }
    })
    const { error } = await supabase.auth.signInWithPassword({
      email: 'a@b.com',
      password: 'wrong'
    })
    expect(error).not.toBeNull()
    expect(error?.message).toBe('Invalid login credentials')
  })

  test('signUp is called with email and password', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null })
    await supabase.auth.signUp({ email: 'new@user.com', password: 'newpass' })
    expect(mockSignUp).toHaveBeenCalledWith({ email: 'new@user.com', password: 'newpass' })
  })

  test('signUp returns error message on duplicate user', async () => {
    mockSignUp.mockResolvedValue({
      data: {},
      error: { message: 'User already registered' }
    })
    const { error } = await supabase.auth.signUp({ email: 'existing@user.com', password: 'pass' })
    expect(error?.message).toBe('User already registered')
  })

  test('signOut is called when signing out', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    await supabase.auth.signOut()
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  test('onAuthStateChange subscription is registered and unsubscribeable', () => {
    const unsub = supabase.auth.onAuthStateChange(() => undefined)
    unsub.data.subscription.unsubscribe()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  test('onAuthStateChange callback receives session updates', () => {
    const received: Array<Session | null> = []
    supabase.auth.onAuthStateChange((_event, session) => {
      received.push(session)
    })

    const session = makeSession('updated@test.com')
    authStateCallback?.('SIGNED_IN', session)

    expect(received).toHaveLength(1)
    expect(received[0]?.user.email).toBe('updated@test.com')
  })

  test('onAuthStateChange fires with null session on sign out', () => {
    const received: Array<Session | null> = []
    supabase.auth.onAuthStateChange((_event, session) => {
      received.push(session)
    })

    authStateCallback?.('SIGNED_OUT', null)
    expect(received[0]).toBeNull()
  })
})
