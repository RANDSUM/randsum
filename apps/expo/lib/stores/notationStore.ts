import { isDiceNotation } from '@randsum/roller'
import { create } from 'zustand'

interface NotationState {
  readonly notation: string
  readonly isValid: boolean
  readonly hasError: boolean
  setNotation(notation: string): void
  clear(): void
}

export const useNotationStore = create<NotationState>()(set => ({
  notation: '',
  isValid: false,
  hasError: false,

  setNotation(notation: string) {
    const isValid = isDiceNotation(notation)
    const hasError = notation.length > 0 && !isValid
    set({ notation, isValid, hasError })
  },

  clear() {
    set({ notation: '', isValid: false, hasError: false })
  }
}))
