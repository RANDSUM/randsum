import { useState, useEffect, useCallback } from 'react'
import type { SavedRoll } from '../types'
import { loadSavedRolls, saveSavedRolls } from '../lib/storage'

export function useSavedRolls() {
  const [savedRolls, setSavedRolls] = useState<SavedRoll[]>([])

  useEffect(() => { loadSavedRolls().then(setSavedRolls) }, [])

  const addSavedRoll = useCallback((name: string, notation: string) => {
    const entry: SavedRoll = { id: crypto.randomUUID(), name, notation }
    setSavedRolls(prev => {
      const updated = [...prev, entry]
      void saveSavedRolls(updated)
      return updated
    })
  }, [])

  const removeSavedRoll = useCallback((id: string) => {
    setSavedRolls(prev => {
      const updated = prev.filter(r => r.id !== id)
      void saveSavedRolls(updated)
      return updated
    })
  }, [])

  return { savedRolls, addSavedRoll, removeSavedRoll }
}
