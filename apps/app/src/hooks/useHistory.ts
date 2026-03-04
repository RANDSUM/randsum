import { useState, useEffect, useCallback } from 'react'
import type { HistoryEntry } from '../types'
import { loadHistory, saveHistory } from '../lib/storage'

const MAX_HISTORY = 100

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => { loadHistory().then(setHistory) }, [])

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY)
      void saveHistory(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    void saveHistory([])
  }, [])

  return { history, addEntry, clearHistory }
}
