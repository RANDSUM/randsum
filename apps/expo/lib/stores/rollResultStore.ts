import { create } from 'zustand'

import type { ParsedRollResult } from '../parseRollResult'

interface RollResultState {
  readonly pending: ParsedRollResult | null
  setPending(result: ParsedRollResult): void
  clear(): void
}

export const useRollResultStore = create<RollResultState>()(set => ({
  pending: null,
  setPending(result: ParsedRollResult) {
    set({ pending: result })
  },
  clear() {
    set({ pending: null })
  }
}))
