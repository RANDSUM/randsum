import { useState, useCallback, useMemo } from 'react'
import { validateNotation } from '@randsum/roller'
import { describeNotation } from '../lib/describeNotation'
import { appendDie, toggleSimpleModifier, appendValueModifier } from '../lib/notationBuilder'

export type NotationState = {
  readonly raw: string
  readonly description: string
  readonly isValid: boolean
  readonly error?: string
}

export function useNotation() {
  const [raw, setRaw] = useState('')

  const state = useMemo<NotationState>(() => {
    if (!raw) return { raw: '', description: '', isValid: false }
    const result = validateNotation(raw)
    if (result.valid) {
      return { raw, description: describeNotation(raw), isValid: true }
    }
    return { raw, description: '', isValid: false, error: result.error.message }
  }, [raw])

  return {
    notation: state,
    setNotation: setRaw,
    addDie: useCallback((sides: number) => setRaw(prev => appendDie(prev, sides)), []),
    toggleModifier: useCallback((mod: string) => setRaw(prev => toggleSimpleModifier(prev, mod)), []),
    appendModifier: useCallback((suffix: string) => setRaw(prev => appendValueModifier(prev, suffix)), []),
    clear: useCallback(() => setRaw(''), []),
  }
}
