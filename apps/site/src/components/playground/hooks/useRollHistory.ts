import { useCallback, useState } from 'react'

export interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly rolls: readonly (readonly number[])[]
  readonly description: string
  readonly timestamp: number
}

interface UseRollHistoryResult {
  readonly history: readonly HistoryEntry[]
  readonly addRoll: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  readonly clearHistory: () => void
}

export function useRollHistory(): UseRollHistoryResult {
  const [history, setHistory] = useState<readonly HistoryEntry[]>([])
  const [nextId, setNextId] = useState(0)

  const addRoll = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
      setHistory(prev => [{ ...entry, id: nextId, timestamp: Date.now() }, ...prev])
      setNextId(prev => prev + 1)
    },
    [nextId]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return { history, addRoll, clearHistory }
}
