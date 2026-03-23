import type { SupabaseClient } from '@supabase/supabase-js'

import type { LocalStorage, RollHistoryEntry, RollTemplate } from './storage'
import { useSyncStore } from './stores/syncStore'

export interface SyncError {
  readonly entity: string
  readonly id: string
  readonly message: string
}

export interface SyncResult {
  readonly uploaded: number
  readonly downloaded: number
  readonly merged: number
  readonly errors: readonly SyncError[]
}

/**
 * Pure merge: union by id. For conflicts (same id), keep the entry with the newer createdAt.
 */
export function mergeHistoryEntries(
  local: readonly RollHistoryEntry[],
  cloud: readonly RollHistoryEntry[]
): readonly RollHistoryEntry[] {
  const map = new Map<string, RollHistoryEntry>()

  for (const entry of local) {
    map.set(entry.id, entry)
  }

  for (const entry of cloud) {
    const existing = map.get(entry.id)
    if (existing === undefined) {
      map.set(entry.id, entry)
    } else {
      const existingTime = new Date(existing.createdAt).getTime()
      const cloudTime = new Date(entry.createdAt).getTime()
      if (cloudTime > existingTime) {
        map.set(entry.id, entry)
      }
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Pure merge: union by id. For conflicts (same id), keep the template with the newer updatedAt.
 */
export function mergeTemplates(
  local: readonly RollTemplate[],
  cloud: readonly RollTemplate[]
): readonly RollTemplate[] {
  const map = new Map<string, RollTemplate>()

  for (const template of local) {
    map.set(template.id, template)
  }

  for (const template of cloud) {
    const existing = map.get(template.id)
    if (existing === undefined) {
      map.set(template.id, template)
    } else {
      const existingTime = new Date(existing.updatedAt).getTime()
      const cloudTime = new Date(template.updatedAt).getTime()
      if (cloudTime > existingTime) {
        map.set(template.id, template)
      }
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

function toSupabaseTemplate(template: RollTemplate, userId: string): Record<string, unknown> {
  return {
    id: template.id,
    user_id: userId,
    name: template.name,
    notation: template.notation,
    variables: template.variables,
    game_id: template.gameId ?? null,
    game_inputs: template.gameInputs ?? null,
    created_at: template.createdAt,
    updated_at: template.updatedAt
  }
}

function fromSupabaseTemplate(row: Record<string, unknown>): RollTemplate {
  const result: RollTemplate = {
    id: row['id'] as string,
    name: row['name'] as string,
    notation: row['notation'] as string,
    variables: (row['variables'] as RollTemplate['variables']) ?? [],
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string
  }
  if (row['game_id'] !== null && row['game_id'] !== undefined) {
    return { ...result, gameId: row['game_id'] as string }
  }
  if (row['game_inputs'] !== null && row['game_inputs'] !== undefined) {
    return { ...result, gameInputs: row['game_inputs'] as Record<string, unknown> }
  }
  return result
}

function toSupabaseHistory(entry: RollHistoryEntry, userId: string): Record<string, unknown> {
  return {
    id: entry.id,
    user_id: userId,
    notation: entry.notation,
    total: entry.total,
    rolls: JSON.stringify(entry.rolls),
    game_id: entry.gameId ?? null,
    template_id: entry.templateId ?? null,
    created_at: entry.createdAt
  }
}

function fromSupabaseHistory(row: Record<string, unknown>): RollHistoryEntry {
  const rolls =
    typeof row['rolls'] === 'string'
      ? (JSON.parse(row['rolls'] as string) as RollHistoryEntry['rolls'])
      : (row['rolls'] as RollHistoryEntry['rolls'])

  const result: RollHistoryEntry = {
    id: row['id'] as string,
    notation: row['notation'] as string,
    total: row['total'] as number,
    rolls,
    createdAt: row['created_at'] as string
  }
  if (row['game_id'] !== null && row['game_id'] !== undefined) {
    return { ...result, gameId: row['game_id'] as string }
  }
  if (row['template_id'] !== null && row['template_id'] !== undefined) {
    return { ...result, templateId: row['template_id'] as string }
  }
  return result
}

/**
 * Upload all local data to Supabase (upsert).
 */
export async function syncToCloud(
  userId: string,
  storageBackend: LocalStorage,
  supabaseClient: SupabaseClient
): Promise<SyncResult> {
  const errors: SyncError[] = []
  const uploaded = { count: 0 }

  // Upload templates
  const localTemplates = await storageBackend.getTemplates()
  if (localTemplates.length > 0) {
    const rows = localTemplates.map(t => toSupabaseTemplate(t, userId))
    const { error } = await supabaseClient.from('templates').upsert(rows, { onConflict: 'id' })

    if (error) {
      errors.push({ entity: 'templates', id: 'batch', message: error.message })
    } else {
      uploaded.count += localTemplates.length
    }
  }

  // Upload history
  const localHistory = await storageBackend.getHistory()
  if (localHistory.length > 0) {
    const rows = localHistory.map(e => toSupabaseHistory(e, userId))
    const { error } = await supabaseClient.from('roll_history').upsert(rows, { onConflict: 'id' })

    if (error) {
      errors.push({ entity: 'roll_history', id: 'batch', message: error.message })
    } else {
      uploaded.count += localHistory.length
    }
  }

  return { uploaded: uploaded.count, downloaded: 0, merged: 0, errors }
}

/**
 * Pull remote data and merge with local (last-write-wins).
 */
export async function syncFromCloud(
  userId: string,
  storageBackend: LocalStorage,
  supabaseClient: SupabaseClient
): Promise<SyncResult> {
  const errors: SyncError[] = []
  const stats = { downloaded: 0, merged: 0 }

  // Fetch cloud templates
  const { data: cloudTemplateRows, error: templateError } = await supabaseClient
    .from('templates')
    .select('*')
    .eq('user_id', userId)

  if (templateError) {
    errors.push({ entity: 'templates', id: 'fetch', message: templateError.message })
  } else if (cloudTemplateRows) {
    const cloudTemplates = (cloudTemplateRows as Record<string, unknown>[]).map(
      fromSupabaseTemplate
    )
    const localTemplates = await storageBackend.getTemplates()
    const merged = mergeTemplates([...localTemplates], cloudTemplates)

    stats.downloaded += cloudTemplates.length
    stats.merged += merged.length

    // Write merged templates to local storage (replace all)
    // Clear existing then re-save
    for (const existing of localTemplates) {
      await storageBackend.deleteTemplate(existing.id)
    }
    for (const template of merged) {
      await storageBackend.saveTemplate(template)
    }
  }

  // Fetch cloud history
  const { data: cloudHistoryRows, error: historyError } = await supabaseClient
    .from('roll_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (historyError) {
    errors.push({ entity: 'roll_history', id: 'fetch', message: historyError.message })
  } else if (cloudHistoryRows) {
    const cloudHistory = (cloudHistoryRows as Record<string, unknown>[]).map(fromSupabaseHistory)
    const localHistory = await storageBackend.getHistory()
    const merged = mergeHistoryEntries([...localHistory], cloudHistory)

    stats.downloaded += cloudHistory.length
    stats.merged += merged.length

    // Rewrite local history with merged data
    await storageBackend.clearHistory()
    // Append in reverse chronological order (appendHistory prepends)
    const reversed = [...merged].reverse()
    for (const entry of reversed) {
      await storageBackend.appendHistory(entry)
    }
  }

  return { uploaded: 0, downloaded: stats.downloaded, merged: stats.merged, errors }
}

/**
 * Full sync cycle: pull from cloud, then push to cloud.
 * Updates the sync store throughout.
 */
export async function runSync(
  userId: string,
  storageBackend: LocalStorage,
  supabaseClient: SupabaseClient
): Promise<void> {
  const store = useSyncStore.getState()
  store.setSyncing()

  try {
    const fromResult = await syncFromCloud(userId, storageBackend, supabaseClient)
    const toResult = await syncToCloud(userId, storageBackend, supabaseClient)

    const allErrors = [...fromResult.errors, ...toResult.errors]
    if (allErrors.length > 0) {
      const messages = allErrors.map(e => `${e.entity}: ${e.message}`)
      useSyncStore.getState().setSyncError(messages.join('; '))
      return
    }

    useSyncStore.getState().setSyncSuccess(new Date().toISOString())
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    useSyncStore.getState().setSyncError(message)
  }
}
