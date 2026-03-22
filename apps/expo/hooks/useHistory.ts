import { useCallback, useEffect, useState } from 'react'

import { storage } from '../lib/storage'
import type { RollHistoryEntry } from '../lib/types'

interface UseHistoryReturn {
  readonly entries: readonly RollHistoryEntry[]
  readonly isLoading: boolean
  readonly appendEntry: (entry: RollHistoryEntry) => Promise<void>
  readonly deleteEntry: (id: string) => Promise<void>
  readonly clearHistory: () => Promise<void>
}

export function useHistory(): UseHistoryReturn {
  const [entries, setEntries] = useState<readonly RollHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    storage
      .getHistory()
      .then(loaded => {
        if (!cancelled) {
          setEntries(loaded)
        }
      })
      .catch(() => {
        // Storage read failure — leave entries empty
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const appendEntry = useCallback(async (entry: RollHistoryEntry): Promise<void> => {
    // Optimistic prepend
    setEntries(prev => [entry, ...prev])
    try {
      await storage.appendHistory(entry)
    } catch {
      // Rollback on storage failure
      setEntries(prev => prev.filter(e => e.id !== entry.id))
    }
  }, [])

  const deleteEntry = useCallback(async (id: string): Promise<void> => {
    setEntries(prev => prev.filter(e => e.id !== id))
    try {
      await storage.deleteHistoryEntry(id)
    } catch {
      // Best-effort — entry is already removed from local state
    }
  }, [])

  const clearHistory = useCallback(async (): Promise<void> => {
    setEntries([])
    try {
      await storage.clearHistory()
    } catch {
      // Best-effort
    }
  }, [])

  return { entries, isLoading, appendEntry, deleteEntry, clearHistory }
}
