import type { Session, User } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

import { supabase } from '../lib/supabase'

interface UseAuthReturn {
  readonly user: User | null
  readonly session: Session | null
  readonly isLoading: boolean
  readonly signIn: (email: string, password: string) => Promise<string | null>
  readonly signUp: (email: string, password: string) => Promise<string | null>
  readonly signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setUser(data.session?.user ?? null)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    unsubscribeRef.current = () => {
      listener.subscription.unsubscribe()
    }

    return () => {
      unsubscribeRef.current?.()
    }
  }, [])

  async function signIn(email: string, password: string): Promise<string | null> {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      return null
    } finally {
      setIsLoading(false)
    }
  }

  async function signUp(email: string, password: string): Promise<string | null> {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      return null
    } finally {
      setIsLoading(false)
    }
  }

  async function signOut(): Promise<void> {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setIsLoading(false)
    }
  }

  return { user, session, isLoading, signIn, signUp, signOut }
}
