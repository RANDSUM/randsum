import { useEffect, useRef } from 'react'

import { storage } from '../lib/storage'
import { useSyncStore } from '../lib/stores/syncStore'
import type { SyncStatus } from '../lib/stores/syncStore'
import { supabase } from '../lib/supabase'
import { runSync } from '../lib/sync'

import { useAuth } from './useAuth'

interface UseSyncReturn {
  readonly status: SyncStatus
  readonly pendingCount: number
  readonly lastSyncAt: string | null
  readonly errorMessage: string | null
  readonly triggerSync: () => Promise<void>
}

export function useSync(): UseSyncReturn {
  const { user } = useAuth()
  const status = useSyncStore(s => s.status)
  const pendingCount = useSyncStore(s => s.pendingCount)
  const lastSyncAt = useSyncStore(s => s.lastSyncAt)
  const errorMessage = useSyncStore(s => s.errorMessage)

  const userRef = useRef(user)
  userRef.current = user

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSyncingRef = useRef(false)

  async function doSync(): Promise<void> {
    const currentUser = userRef.current
    if (!currentUser || isSyncingRef.current) return

    isSyncingRef.current = true
    try {
      await runSync(currentUser.id, storage, supabase)
    } finally {
      isSyncingRef.current = false
    }
  }

  async function triggerSync(): Promise<void> {
    if (!userRef.current || useSyncStore.getState().status === 'syncing') return

    // Debounce: cancel any pending sync and schedule a new one
    if (syncTimeoutRef.current !== null) {
      clearTimeout(syncTimeoutRef.current)
    }

    return new Promise<void>(resolve => {
      syncTimeoutRef.current = setTimeout(() => {
        syncTimeoutRef.current = null
        doSync().then(resolve, resolve)
      }, 300)
    })
  }

  // Auto-sync on sign-in (user transitions null -> non-null)
  const prevUserRef = useRef<string | null>(null)
  useEffect(() => {
    const prevUserId = prevUserRef.current
    const currentUserId = user?.id ?? null
    prevUserRef.current = currentUserId

    if (prevUserId === null && currentUserId !== null) {
      void doSync()
    }
  }, [user?.id])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current !== null) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  return { status, pendingCount, lastSyncAt, errorMessage, triggerSync }
}
