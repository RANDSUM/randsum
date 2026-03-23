import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  readonly status: SyncStatus
  readonly pendingCount: number
  readonly lastSyncAt: string | null
  readonly errorMessage: string | null

  setSyncing(): void
  setSyncSuccess(lastSyncAt: string): void
  setSyncError(message: string): void
  setPendingCount(count: number): void
}

export const useSyncStore = create<SyncState>()(set => ({
  status: 'idle',
  pendingCount: 0,
  lastSyncAt: null,
  errorMessage: null,

  setSyncing() {
    set({ status: 'syncing', errorMessage: null })
  },
  setSyncSuccess(lastSyncAt: string) {
    set({ status: 'idle', lastSyncAt, pendingCount: 0, errorMessage: null })
  },
  setSyncError(message: string) {
    set({ status: 'error', errorMessage: message })
  },
  setPendingCount(count: number) {
    set({ pendingCount: count })
  }
}))
