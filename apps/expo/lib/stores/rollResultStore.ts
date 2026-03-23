import { create } from 'zustand'

import type { ParsedRollResult } from '../parseRollResult'

interface RollResultState {
  readonly pending: ParsedRollResult | null
  readonly archivedAt: string | null
  setPending(result: ParsedRollResult): void
  setPendingArchived(result: ParsedRollResult, archivedAt: string): void
  clear(): void
}

export const useRollResultStore = create<RollResultState>()(set => ({
  pending: null,
  archivedAt: null,
  setPending(result: ParsedRollResult) {
    set({ pending: result, archivedAt: null })
  },
  setPendingArchived(result: ParsedRollResult, archivedAt: string) {
    set({ pending: result, archivedAt })
  },
  clear() {
    set({ pending: null, archivedAt: null })
  }
}))
