import { useCallback, useState } from 'react'
import type { RollerRollResult } from '@randsum/roller'

interface HistoryEntry {
  readonly notation: string
  readonly result: RollerRollResult
}

interface UseRollHistoryReturn {
  readonly history: readonly HistoryEntry[]
  readonly addRoll: (notation: string, result: RollerRollResult) => void
}

export function useRollHistory(): UseRollHistoryReturn {
  const [history, setHistory] = useState<readonly HistoryEntry[]>([])

  const addRoll = useCallback((notation: string, result: RollerRollResult): void => {
    setHistory(prev => [...prev, { notation, result }])
  }, [])

  return { history, addRoll }
}
