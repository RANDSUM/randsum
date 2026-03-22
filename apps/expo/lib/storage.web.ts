import AsyncStorage from '@react-native-async-storage/async-storage'

import type { LocalStorage, Preferences, RollHistoryEntry, RollTemplate } from './storage'

const KEYS = {
  templates: 'randsum/templates',
  history: 'randsum/history',
  preferences: 'randsum/preferences'
} as const

const HISTORY_CAP = 500

export const DEFAULT_PREFERENCES: Omit<Preferences, 'lastGameId'> = {
  theme: 'dark',
  haptics: true,
  defaultMode: 'simple',
  updatedAt: new Date(0).toISOString()
}

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null) return null
  return JSON.parse(raw) as T
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

class AsyncStorageBackend implements LocalStorage {
  async getTemplates(): Promise<readonly RollTemplate[]> {
    return (await readJSON<RollTemplate[]>(KEYS.templates)) ?? []
  }

  async saveTemplate(template: RollTemplate): Promise<void> {
    const templates = await this.getTemplates()
    await writeJSON(KEYS.templates, [...templates, template])
  }

  async updateTemplate(template: RollTemplate): Promise<void> {
    const templates = await this.getTemplates()
    const idx = templates.findIndex(t => t.id === template.id)
    if (idx === -1) {
      throw new Error(`Template with id "${template.id}" not found`)
    }
    const updated = [...templates]
    updated[idx] = template
    await writeJSON(KEYS.templates, updated)
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates()
    await writeJSON(
      KEYS.templates,
      templates.filter(t => t.id !== id)
    )
  }

  async getHistory(limit?: number): Promise<readonly RollHistoryEntry[]> {
    const entries = (await readJSON<RollHistoryEntry[]>(KEYS.history)) ?? []
    // Already stored most-recent-first
    const cap = limit ?? entries.length
    return entries.slice(0, cap)
  }

  async appendHistory(entry: RollHistoryEntry): Promise<void> {
    const entries = (await readJSON<RollHistoryEntry[]>(KEYS.history)) ?? []
    // Prepend new entry (most-recent-first), then cap at 500
    const updated = [entry, ...entries].slice(0, HISTORY_CAP)
    await writeJSON(KEYS.history, updated)
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    const entries = await this.getHistory()
    await writeJSON(
      KEYS.history,
      entries.filter(e => e.id !== id)
    )
  }

  async clearHistory(): Promise<void> {
    await writeJSON(KEYS.history, [])
  }

  async getPreferences(): Promise<Preferences> {
    const saved = await readJSON<Preferences>(KEYS.preferences)
    if (saved === null) {
      return { ...DEFAULT_PREFERENCES }
    }
    return saved
  }

  async savePreferences(prefs: Preferences): Promise<void> {
    await writeJSON(KEYS.preferences, prefs)
  }
}

export function createAsyncStorageBackend(): LocalStorage {
  return new AsyncStorageBackend()
}

// Exported as `storage` singleton — Metro picks up storage.web.ts on web
export const storage: LocalStorage = new AsyncStorageBackend()
