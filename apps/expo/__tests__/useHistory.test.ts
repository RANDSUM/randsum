import { beforeEach, describe, expect, test } from 'bun:test'
import { mock } from 'bun:test'

import type { RollHistoryEntry } from '../lib/types'

// In-memory store for tests
const store: Record<string, string> = {}

mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string): Promise<string | null> => store[key] ?? null,
    setItem: async (key: string, value: string): Promise<void> => {
      store[key] = value
    },
    removeItem: async (key: string): Promise<void> => {
      delete store[key]
    },
    mergeItem: async (_key: string, _value: string): Promise<void> => undefined,
    clear: async (): Promise<void> => {
      for (const k of Object.keys(store)) {
        delete store[k]
      }
    },
    getAllKeys: async (): Promise<readonly string[]> => Object.keys(store),
    multiGet: async (keys: readonly string[]): Promise<readonly [string, string | null][]> =>
      keys.map(k => [k, store[k] ?? null] as [string, string | null]),
    multiSet: async (pairs: readonly [string, string][]): Promise<void> => {
      for (const [k, v] of pairs) {
        store[k] = v
      }
    },
    multiRemove: async (keys: readonly string[]): Promise<void> => {
      for (const k of keys) {
        delete store[k]
      }
    }
  }
}))

mock.module('react-native', () => ({
  useColorScheme: () => 'dark',
  StyleSheet: {
    create: <T extends Record<string, object>>(styles: T): T => styles
  }
}))

// Import storage backend directly to pre-seed state for tests
const { createAsyncStorageBackend } = await import('../lib/storage.web')

function makeEntry(overrides: Partial<RollHistoryEntry> = {}): RollHistoryEntry {
  return {
    id: 'hist-1',
    notation: '2d6',
    total: 8,
    rolls: [],
    createdAt: '2026-03-22T10:00:00.000Z',
    ...overrides
  }
}

describe('useHistory (direct storage tests)', () => {
  let backend: ReturnType<typeof createAsyncStorageBackend>

  beforeEach(() => {
    for (const k of Object.keys(store)) {
      delete store[k]
    }
    backend = createAsyncStorageBackend()
  })

  test('getHistory returns empty array initially', async () => {
    const result = await backend.getHistory()
    expect(result).toEqual([])
  })

  test('appendHistory prepends entry (most-recent-first)', async () => {
    const older = makeEntry({ id: 'h-1', createdAt: '2026-03-22T09:00:00.000Z' })
    const newer = makeEntry({ id: 'h-2', createdAt: '2026-03-22T10:00:00.000Z' })
    await backend.appendHistory(older)
    await backend.appendHistory(newer)
    const result = await backend.getHistory()
    expect(result[0]?.id).toBe('h-2')
    expect(result[1]?.id).toBe('h-1')
  })

  test('deleteHistoryEntry removes the entry', async () => {
    const entry = makeEntry()
    await backend.appendHistory(entry)
    await backend.deleteHistoryEntry(entry.id)
    const result = await backend.getHistory()
    expect(result).toEqual([])
  })

  test('deleteHistoryEntry only removes specified entry', async () => {
    const e1 = makeEntry({ id: 'h-1' })
    const e2 = makeEntry({ id: 'h-2' })
    await backend.appendHistory(e1)
    await backend.appendHistory(e2)
    await backend.deleteHistoryEntry('h-1')
    const result = await backend.getHistory()
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('h-2')
  })

  test('clearHistory empties the list', async () => {
    await backend.appendHistory(makeEntry({ id: 'h-1' }))
    await backend.appendHistory(makeEntry({ id: 'h-2' }))
    await backend.clearHistory()
    const result = await backend.getHistory()
    expect(result).toEqual([])
  })

  test('getHistory respects limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      await backend.appendHistory(makeEntry({ id: `h-${i}`, total: i }))
    }
    const result = await backend.getHistory(3)
    expect(result).toHaveLength(3)
  })
})
