import { beforeEach, describe, expect, test } from 'bun:test'
import { mock } from 'bun:test'

import type { Preferences, RollHistoryEntry, RollTemplate } from '../lib/types'

// In-memory AsyncStorage store for tests
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

// Import after mock is set up
const { createAsyncStorageBackend, DEFAULT_PREFERENCES } = await import('../lib/storage.web')

function makeTemplate(overrides: Partial<RollTemplate> = {}): RollTemplate {
  return {
    id: 'tpl-1',
    name: 'Test Template',
    notation: '4d6L',
    variables: [],
    createdAt: '2026-03-22T00:00:00.000Z',
    updatedAt: '2026-03-22T00:00:00.000Z',
    ...overrides
  }
}

function makeHistoryEntry(overrides: Partial<RollHistoryEntry> = {}): RollHistoryEntry {
  return {
    id: 'hist-1',
    notation: '4d6L',
    total: 14,
    rolls: [],
    createdAt: '2026-03-22T00:00:00.000Z',
    ...overrides
  }
}

describe('AsyncStorageBackend', () => {
  let backend: ReturnType<typeof createAsyncStorageBackend>

  beforeEach(() => {
    // Clear in-memory store between tests
    for (const k of Object.keys(store)) {
      delete store[k]
    }
    backend = createAsyncStorageBackend()
  })

  // --- Templates ---

  describe('templates', () => {
    test('getTemplates returns empty array when no data', async () => {
      const result = await backend.getTemplates()
      expect(result).toEqual([])
    })

    test('saveTemplate + getTemplates round-trip', async () => {
      const tpl = makeTemplate()
      await backend.saveTemplate(tpl)
      const result = await backend.getTemplates()
      expect(result).toEqual([tpl])
    })

    test('saveTemplate multiple templates', async () => {
      const tpl1 = makeTemplate({ id: 'tpl-1', name: 'A' })
      const tpl2 = makeTemplate({ id: 'tpl-2', name: 'B' })
      await backend.saveTemplate(tpl1)
      await backend.saveTemplate(tpl2)
      const result = await backend.getTemplates()
      expect(result).toHaveLength(2)
    })

    test('updateTemplate modifies existing template', async () => {
      const tpl = makeTemplate()
      await backend.saveTemplate(tpl)
      const updated = { ...tpl, name: 'Updated Name', updatedAt: '2026-03-22T01:00:00.000Z' }
      await backend.updateTemplate(updated)
      const result = await backend.getTemplates()
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Updated Name')
    })

    test('updateTemplate throws when id does not exist', async () => {
      const tpl = makeTemplate()
      await expect(backend.updateTemplate(tpl)).rejects.toThrow()
    })

    test('deleteTemplate removes template', async () => {
      const tpl = makeTemplate()
      await backend.saveTemplate(tpl)
      await backend.deleteTemplate(tpl.id)
      const result = await backend.getTemplates()
      expect(result).toEqual([])
    })

    test('deleteTemplate only removes the specified template', async () => {
      const tpl1 = makeTemplate({ id: 'tpl-1' })
      const tpl2 = makeTemplate({ id: 'tpl-2' })
      await backend.saveTemplate(tpl1)
      await backend.saveTemplate(tpl2)
      await backend.deleteTemplate('tpl-1')
      const result = await backend.getTemplates()
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('tpl-2')
    })
  })

  // --- History ---

  describe('history', () => {
    test('getHistory returns empty array when no data', async () => {
      const result = await backend.getHistory()
      expect(result).toEqual([])
    })

    test('appendHistory adds entry', async () => {
      const entry = makeHistoryEntry()
      await backend.appendHistory(entry)
      const result = await backend.getHistory()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(entry)
    })

    test('getHistory returns entries in reverse chronological order', async () => {
      const older = makeHistoryEntry({ id: 'h-1', createdAt: '2026-03-22T00:00:00.000Z' })
      const newer = makeHistoryEntry({ id: 'h-2', createdAt: '2026-03-22T01:00:00.000Z' })
      await backend.appendHistory(older)
      await backend.appendHistory(newer)
      const result = await backend.getHistory()
      expect(result[0]?.id).toBe('h-2')
      expect(result[1]?.id).toBe('h-1')
    })

    test('getHistory respects limit', async () => {
      for (let i = 0; i < 10; i++) {
        await backend.appendHistory(makeHistoryEntry({ id: `h-${i}`, total: i }))
      }
      const result = await backend.getHistory(3)
      expect(result).toHaveLength(3)
    })

    test('deleteHistoryEntry removes entry', async () => {
      const entry = makeHistoryEntry()
      await backend.appendHistory(entry)
      await backend.deleteHistoryEntry(entry.id)
      const result = await backend.getHistory()
      expect(result).toEqual([])
    })

    test('deleteHistoryEntry only removes the specified entry', async () => {
      const e1 = makeHistoryEntry({ id: 'h-1' })
      const e2 = makeHistoryEntry({ id: 'h-2' })
      await backend.appendHistory(e1)
      await backend.appendHistory(e2)
      await backend.deleteHistoryEntry('h-1')
      const result = await backend.getHistory()
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('h-2')
    })

    test('clearHistory removes all entries', async () => {
      await backend.appendHistory(makeHistoryEntry({ id: 'h-1' }))
      await backend.appendHistory(makeHistoryEntry({ id: 'h-2' }))
      await backend.clearHistory()
      const result = await backend.getHistory()
      expect(result).toEqual([])
    })

    test('history is capped at 500 entries', async () => {
      for (let i = 0; i < 505; i++) {
        await backend.appendHistory(
          makeHistoryEntry({ id: `h-${i}`, createdAt: new Date(i * 1000).toISOString() })
        )
      }
      const result = await backend.getHistory()
      expect(result.length).toBe(500)
    })
  })

  // --- Preferences ---

  describe('preferences', () => {
    test('getPreferences returns defaults when no data saved', async () => {
      const result = await backend.getPreferences()
      expect(result.theme).toBe('dark')
      expect(result.haptics).toBe(true)
      expect(result.defaultMode).toBe('simple')
    })

    test('DEFAULT_PREFERENCES has correct values', () => {
      expect(DEFAULT_PREFERENCES.theme).toBe('dark')
      expect(DEFAULT_PREFERENCES.haptics).toBe(true)
      expect(DEFAULT_PREFERENCES.defaultMode).toBe('simple')
    })

    test('savePreferences + getPreferences round-trip', async () => {
      const prefs: Preferences = {
        theme: 'light',
        haptics: false,
        defaultMode: 'advanced',
        updatedAt: '2026-03-22T00:00:00.000Z'
      }
      await backend.savePreferences(prefs)
      const result = await backend.getPreferences()
      expect(result.theme).toBe('light')
      expect(result.haptics).toBe(false)
      expect(result.defaultMode).toBe('advanced')
    })

    test('savePreferences persists lastGameId', async () => {
      const prefs: Preferences = {
        theme: 'dark',
        haptics: true,
        defaultMode: 'simple',
        lastGameId: 'blades',
        updatedAt: '2026-03-22T00:00:00.000Z'
      }
      await backend.savePreferences(prefs)
      const result = await backend.getPreferences()
      expect(result.lastGameId).toBe('blades')
    })
  })
})
