// SYNC: apps/site/src/components/playground/hooks/useRollHistory.ts
// HistoryEntry shape is identical. TUI uses the same prepend ordering and nextId pattern.
import { useCallback, useState } from 'react'

export interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly rolls: readonly (readonly number[])[]
  readonly description: string
  readonly timestamp: number
}

interface UseRollHistoryReturn {
  readonly history: readonly HistoryEntry[]
  readonly addRoll: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  readonly clearHistory: () => void
}

export function useRollHistory(): UseRollHistoryReturn {
  const [history, setHistory] = useState<readonly HistoryEntry[]>([])
  const [nextId, setNextId] = useState(0)

  const addRoll = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void => {
      setHistory(prev => [{ ...entry, id: nextId, timestamp: Date.now() }, ...prev])
      setNextId(prev => prev + 1)
    },
    [nextId]
  )

  const clearHistory = useCallback((): void => {
    setHistory([])
  }, [])

  return { history, addRoll, clearHistory }
}
