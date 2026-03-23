import type { Preferences, RollHistoryEntry, RollTemplate } from './types'

export type { Preferences, RollHistoryEntry, RollTemplate }

export interface LocalStorage {
  // Templates
  getTemplates(): Promise<readonly RollTemplate[]>
  saveTemplate(template: RollTemplate): Promise<void>
  /** Replace an existing template by id. Throws if id does not exist. */
  updateTemplate(template: RollTemplate): Promise<void>
  deleteTemplate(id: string): Promise<void>

  // History
  /** Returns entries most-recent-first. limit defaults to 500 on web, 100 on native. */
  getHistory(limit?: number): Promise<readonly RollHistoryEntry[]>
  appendHistory(entry: RollHistoryEntry): Promise<void>
  deleteHistoryEntry(id: string): Promise<void>
  clearHistory(): Promise<void>

  // Preferences
  getPreferences(): Promise<Preferences>
  savePreferences(prefs: Preferences): Promise<void>
}

// Metro resolves storage.native.ts on iOS/Android and storage.web.ts on web.
// This fallback re-exports the web implementation for non-Metro environments (e.g. tests).
export { storage } from './storage.web'
