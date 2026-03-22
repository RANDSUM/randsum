import * as SQLite from 'expo-sqlite'

import type { LocalStorage, Preferences, RollHistoryEntry, RollTemplate } from './storage'

const DEFAULT_PREFERENCES_NATIVE: Omit<Preferences, 'lastGameId'> = {
  theme: 'dark',
  haptics: true,
  defaultMode: 'simple',
  updatedAt: new Date(0).toISOString()
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS templates (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    notation   TEXT NOT NULL,
    variables  TEXT,
    game_id    TEXT,
    game_inputs TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS history (
    id          TEXT PRIMARY KEY,
    notation    TEXT NOT NULL,
    total       INTEGER NOT NULL,
    rolls       TEXT NOT NULL,
    game_id     TEXT,
    template_id TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS preferences (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`

let _db: SQLite.SQLiteDatabase | null = null

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db !== null) return _db
  _db = await SQLite.openDatabaseAsync('randsum.db')
  await _db.execAsync(SCHEMA)
  return _db
}

interface TemplateRow {
  id: string
  name: string
  notation: string
  variables: string | null
  game_id: string | null
  game_inputs: string | null
  created_at: string
  updated_at: string
}

interface HistoryRow {
  id: string
  notation: string
  total: number
  rolls: string
  game_id: string | null
  template_id: string | null
  created_at: string
}

interface PreferenceRow {
  key: string
  value: string
}

function rowToTemplate(row: TemplateRow): RollTemplate {
  return {
    id: row.id,
    name: row.name,
    notation: row.notation,
    variables: row.variables !== null ? JSON.parse(row.variables) : [],
    ...(row.game_id !== null ? { gameId: row.game_id } : {}),
    ...(row.game_inputs !== null ? { gameInputs: JSON.parse(row.game_inputs) } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToHistoryEntry(row: HistoryRow): RollHistoryEntry {
  return {
    id: row.id,
    notation: row.notation,
    total: row.total,
    rolls: JSON.parse(row.rolls),
    ...(row.game_id !== null ? { gameId: row.game_id } : {}),
    ...(row.template_id !== null ? { templateId: row.template_id } : {}),
    createdAt: row.created_at
  }
}

class SQLiteBackend implements LocalStorage {
  async getTemplates(): Promise<readonly RollTemplate[]> {
    const db = await getDb()
    const rows = await db.getAllAsync<TemplateRow>(
      'SELECT * FROM templates ORDER BY created_at ASC'
    )
    return rows.map(rowToTemplate)
  }

  async saveTemplate(template: RollTemplate): Promise<void> {
    const db = await getDb()
    await db.runAsync(
      `INSERT INTO templates (id, name, notation, variables, game_id, game_inputs, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      template.id,
      template.name,
      template.notation,
      template.variables.length > 0 ? JSON.stringify(template.variables) : null,
      template.gameId ?? null,
      template.gameInputs !== undefined ? JSON.stringify(template.gameInputs) : null,
      template.createdAt,
      template.updatedAt
    )
  }

  async updateTemplate(template: RollTemplate): Promise<void> {
    const db = await getDb()
    const result = await db.runAsync(
      `UPDATE templates
       SET name = ?, notation = ?, variables = ?, game_id = ?, game_inputs = ?, updated_at = ?
       WHERE id = ?`,
      template.name,
      template.notation,
      template.variables.length > 0 ? JSON.stringify(template.variables) : null,
      template.gameId ?? null,
      template.gameInputs !== undefined ? JSON.stringify(template.gameInputs) : null,
      template.updatedAt,
      template.id
    )
    if (result.changes === 0) {
      throw new Error(`Template with id "${template.id}" not found`)
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    const db = await getDb()
    await db.runAsync('DELETE FROM templates WHERE id = ?', id)
  }

  async getHistory(limit = 100): Promise<readonly RollHistoryEntry[]> {
    const db = await getDb()
    const rows = await db.getAllAsync<HistoryRow>(
      'SELECT * FROM history ORDER BY created_at DESC LIMIT ?',
      limit
    )
    return rows.map(rowToHistoryEntry)
  }

  async appendHistory(entry: RollHistoryEntry): Promise<void> {
    const db = await getDb()
    await db.runAsync(
      `INSERT INTO history (id, notation, total, rolls, game_id, template_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      entry.id,
      entry.notation,
      entry.total,
      JSON.stringify(entry.rolls),
      entry.gameId ?? null,
      entry.templateId ?? null,
      entry.createdAt
    )
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    const db = await getDb()
    await db.runAsync('DELETE FROM history WHERE id = ?', id)
  }

  async clearHistory(): Promise<void> {
    const db = await getDb()
    await db.runAsync('DELETE FROM history')
  }

  async getPreferences(): Promise<Preferences> {
    const db = await getDb()
    const rows = await db.getAllAsync<PreferenceRow>('SELECT key, value FROM preferences')
    const map: Record<string, string> = {}
    for (const row of rows) {
      map[row.key] = row.value
    }

    return {
      theme: (map['theme'] as Preferences['theme']) ?? DEFAULT_PREFERENCES_NATIVE.theme,
      haptics:
        map['haptics'] !== undefined
          ? map['haptics'] === 'true'
          : DEFAULT_PREFERENCES_NATIVE.haptics,
      defaultMode:
        (map['defaultMode'] as Preferences['defaultMode']) ??
        DEFAULT_PREFERENCES_NATIVE.defaultMode,
      ...(map['lastGameId'] !== undefined ? { lastGameId: map['lastGameId'] } : {}),
      updatedAt: map['updatedAt'] ?? DEFAULT_PREFERENCES_NATIVE.updatedAt
    }
  }

  async savePreferences(prefs: Preferences): Promise<void> {
    const db = await getDb()
    const entries: [string, string][] = [
      ['theme', prefs.theme],
      ['haptics', String(prefs.haptics)],
      ['defaultMode', prefs.defaultMode],
      ['updatedAt', prefs.updatedAt]
    ]
    if (prefs.lastGameId !== undefined) {
      entries.push(['lastGameId', prefs.lastGameId])
    }
    for (const [key, value] of entries) {
      await db.runAsync(
        'INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        value
      )
    }
  }
}

export const DEFAULT_PREFERENCES = DEFAULT_PREFERENCES_NATIVE

export function createSQLiteBackend(): LocalStorage {
  return new SQLiteBackend()
}

// Exported as `storage` singleton — Metro picks up storage.native.ts on iOS/Android
export const storage: LocalStorage = new SQLiteBackend()
