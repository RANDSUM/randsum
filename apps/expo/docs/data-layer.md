# Data Layer Contracts

The RANDSUM Expo app uses a local-first architecture. All reads and writes go to local storage first. Supabase is an optional sync target for authenticated users. See ADR-002 for the full architectural rationale.

---

## Core Types

These types are referenced throughout the data layer. Define them at `lib/types.ts`.

```typescript
/** A saved roll template */
export interface RollTemplate {
  /** nanoid — generated with nanoid() before saving */
  readonly id: string
  readonly name: string
  /** Notation string, may include {variable} placeholders */
  readonly notation: string
  readonly variables: readonly Variable[]
  /** Optional game reference (e.g. 'blades') */
  readonly gameId?: string
  /** Saved game-specific input values */
  readonly gameInputs?: Readonly<Record<string, unknown>>
  /** ISO 8601 */
  readonly createdAt: string
  /** ISO 8601 */
  readonly updatedAt: string
}

/** A named variable in a template */
export interface Variable {
  readonly name: string
  readonly default?: number
  readonly label?: string
}

/** A single entry in the roll history feed */
export interface RollHistoryEntry {
  /** nanoid */
  readonly id: string
  /** The notation that was rolled (e.g. "4d6L") */
  readonly notation: string
  readonly total: number
  /** Serialized RollRecord[] from @randsum/roller */
  readonly rolls: unknown
  /** Present when rolled via a game roller */
  readonly gameId?: string
  /** Present when rolled from a saved template */
  readonly templateId?: string
  /** ISO 8601 */
  readonly createdAt: string
}

/** User preferences */
export interface Preferences {
  readonly theme: 'dark' | 'light'
  /** Whether to fire haptic feedback on rolls (native only) */
  readonly haptics: boolean
  readonly defaultMode: 'simple' | 'advanced'
  /** ID of the last selected game, for restoring game tab state */
  readonly lastGameId?: string
  /** ISO 8601 — used by sync engine for last-write-wins merge */
  readonly updatedAt: string
}
```

---

## `LocalStorage` Interface

**File:** `lib/storage.ts`

Platform-agnostic interface for all local I/O. Exported as the `storage` singleton. Components and hooks never import from `expo-sqlite` or `@react-native-async-storage/async-storage` directly.

```typescript
export interface LocalStorage {
  // Templates
  getTemplates(): Promise<readonly RollTemplate[]>
  saveTemplate(template: RollTemplate): Promise<void>
  /** Replace an existing template by id. Throws if id does not exist. */
  updateTemplate(template: RollTemplate): Promise<void>
  deleteTemplate(id: string): Promise<void>

  // History
  /** Returns entries most-recent-first. `limit` defaults to 100 on native, 500 on web. */
  getHistory(limit?: number): Promise<readonly RollHistoryEntry[]>
  appendHistory(entry: RollHistoryEntry): Promise<void>
  deleteHistoryEntry(id: string): Promise<void>
  clearHistory(): Promise<void>

  // Preferences
  getPreferences(): Promise<Preferences>
  savePreferences(prefs: Preferences): Promise<void>
}
```

**Backend selection:**

```typescript
import { Platform } from 'react-native'

export const storage: LocalStorage = Platform.OS === 'web'
  ? new AsyncStorageBackend()
  : new SQLiteBackend()
```

**`updateTemplate` contract:**
- `SQLiteBackend`: `UPDATE templates SET ... WHERE id = ?`
- `AsyncStorageBackend`: find-and-replace within the JSON array
- Callers are responsible for setting `updatedAt` to `new Date().toISOString()` before calling `updateTemplate`

**Schema migrations:** Out of scope for v1. The schema is initialized once with `CREATE TABLE IF NOT EXISTS`. There is no migration runner. Changes to the schema in future versions require a dedicated migration plan.

---

## SQLite Schema (native: iOS and Android)

**Database file:** `randsum.db`, opened at app startup via `expo-sqlite` v14+.

Applied on first launch. All subsequent launches find the tables already present and proceed without error.

```sql
CREATE TABLE IF NOT EXISTS templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  notation   TEXT NOT NULL,
  variables  TEXT,          -- JSON: Variable[]
  game_id    TEXT,
  game_inputs TEXT,         -- JSON: Record<string, unknown>
  created_at TEXT NOT NULL, -- ISO 8601
  updated_at TEXT NOT NULL  -- ISO 8601
);

CREATE TABLE IF NOT EXISTS history (
  id          TEXT PRIMARY KEY,
  notation    TEXT NOT NULL,
  total       INTEGER NOT NULL,
  rolls       TEXT NOT NULL,  -- JSON: RollRecord[]
  game_id     TEXT,
  template_id TEXT,
  created_at  TEXT NOT NULL   -- ISO 8601
);

CREATE TABLE IF NOT EXISTS preferences (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL         -- JSON: scalar or object
);
```

**JSON columns:** `variables`, `game_inputs`, and `rolls` are stored as JSON strings. The `SQLiteBackend` parses them with `JSON.parse` on read and serializes with `JSON.stringify` on write. The backend is the only place in the codebase that performs this serialization — callers always work with typed objects.

**`preferences` table design:** Key-value layout rather than a single-row table. This avoids schema changes when adding preference fields. Canonical keys:

| Key | Value type |
|---|---|
| `theme` | `'dark' \| 'light'` |
| `haptics` | `boolean` |
| `defaultMode` | `'simple' \| 'advanced'` |
| `lastGameId` | `string \| undefined` |
| `updatedAt` | ISO 8601 string |

`getPreferences()` reads all rows and assembles a `Preferences` object. Missing keys use defaults: `theme: 'dark'`, `haptics: true`, `defaultMode: 'simple'`.

---

## AsyncStorage Key Conventions (web)

**Backend:** `@react-native-async-storage/async-storage`, backed by IndexedDB on web.

All keys are namespaced under `randsum/` to avoid collisions with Zustand persist middleware keys (`zustand/`).

| Key | Value | Notes |
|---|---|---|
| `randsum/templates` | `JSON.stringify(RollTemplate[])` | Full array, replaced on every write |
| `randsum/history` | `JSON.stringify(RollHistoryEntry[])` | Most-recent-first, capped at 500 entries |
| `randsum/preferences` | `JSON.stringify(Preferences)` | Replaced on every write |
| `randsum/sync-queue` | `JSON.stringify(SyncQueueEntry[])` | Pending writes for Supabase sync |
| `randsum/last-sync-at` | ISO 8601 string | Timestamp of last successful sync |

**History cap:** The 500-entry cap is enforced in `AsyncStorageBackend.appendHistory`. After appending, if the array exceeds 500, the oldest entries are trimmed. The `SQLiteBackend` does not apply this cap (queries use `LIMIT` instead).

---

## Supabase Schema

Tables for authenticated users. All tables use Row Level Security (RLS) with policy `user_id = auth.uid()`.

**`profiles`**
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB,         -- Preferences object (subset: theme, defaultMode, lastGameId)
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**`templates`**
```sql
CREATE TABLE templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  notation    TEXT NOT NULL,
  variables   JSONB,         -- Variable[]
  game_id     TEXT,
  game_inputs JSONB,         -- Record<string, unknown>
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX templates_user_id_idx ON templates(user_id);
```

**`roll_history`**
```sql
CREATE TABLE roll_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notation    TEXT NOT NULL,
  total       INTEGER NOT NULL,
  rolls       JSONB NOT NULL,  -- RollRecord[]
  game_id     TEXT,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX roll_history_user_id_created_at_idx ON roll_history(user_id, created_at DESC);
```

**Notes:**
- Local `id` values are nanoids (strings); Supabase `id` values are UUIDs. The sync engine maps between them on upload. The local record retains its nanoid as the canonical ID — Supabase stores the same value cast to UUID.
- `profiles.preferences` includes only cross-device preferences (`theme`, `defaultMode`, `lastGameId`). The `haptics` preference is device-local and never synced.

---

## Sync Queue Mechanism

**File:** `lib/sync.ts`

The sync queue is stored locally under key `randsum/sync-queue` (AsyncStorage/SQLite). Each entry describes a pending write to Supabase.

```typescript
type SyncOperation = 'upsert' | 'delete'
type SyncEntity = 'template' | 'history' | 'preferences'

interface SyncQueueEntry {
  /** nanoid for this queue entry (not the entity ID) */
  readonly queueId: string
  readonly entity: SyncEntity
  readonly operation: SyncOperation
  /** For 'upsert': the full entity object. For 'delete': { id: string }. */
  readonly payload: unknown
  /** ISO 8601 — when this entry was enqueued */
  readonly enqueuedAt: string
  /** Number of failed upload attempts for this entry */
  readonly attempts: number
}
```

**Retry policy:** Up to 3 attempts with exponential backoff (1s, 2s, 4s). After 3 failures, the entry remains in the queue marked with `attempts: 3` and is retried on the next app launch. Entries are never automatically discarded — a permanent failure surfaces via `useSyncStore.setSyncError()`.

**Queue flush:** On app launch (if authenticated) and after each explicit `triggerSync()` call, the sync engine processes the queue serially:
1. Read all pending entries sorted by `enqueuedAt`
2. For each entry, attempt the Supabase operation
3. On success, remove the entry from the queue
4. On failure, increment `attempts` and leave in queue
5. After all entries are processed, pull remote changes since `randsum/last-sync-at`
6. On complete success, write `randsum/last-sync-at` with `new Date().toISOString()`

---

## Merge Algorithm on Sign-In

When a user signs in, the sync engine runs a full merge of local data with the user's Supabase data. Strategy: **last-write-wins by `updatedAt`**.

### Templates

```
for each local template:
  if Supabase has the same id:
    winner = whichever has later updatedAt
    write winner to both local and Supabase
  else:
    upload local template to Supabase

for each Supabase template not present locally:
  save to local storage
```

### History

History entries are append-only. Merge is a union deduplicated by `id`:

```
merged = union(localEntries, supabaseEntries) deduplicated by id
write merged to local storage (most-recent-first, respecting 500-entry web cap)
upload any local-only entries to Supabase
```

### Preferences

The entire `Preferences` object is treated as a unit. Whichever version has the later `updatedAt` wins:

```
if supabasePreferences.updatedAt > localPreferences.updatedAt:
  write supabasePreferences to local storage
  seed useThemeStore with supabasePreferences.theme
else:
  upload localPreferences to Supabase profiles table
```

### Known limitations

- Two devices editing the same template simultaneously result in one edit being silently overwritten. This is an accepted limitation for v1. CRDT-based conflict resolution is deferred.
- The merge operation can be slow for users with large local histories (hundreds of entries) joining for the first time. The Account screen should show a progress indicator while `useSyncStore.status === 'syncing'`.
