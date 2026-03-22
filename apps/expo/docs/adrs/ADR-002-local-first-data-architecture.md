# ADR-002: Local-First Data Architecture

## Status

Proposed

## Context

The RANDSUM app must work fully offline. A user rolling dice at a table should never hit a spinner or error state because they lack a network connection. Cloud sync is a convenience feature that requires an account — it is not a prerequisite for the core loop (build pool → roll → see result → view history).

This has direct consequences for the data layer:

1. Roll history and saved templates must be readable and writable with zero network access.
2. Supabase is an optional sync target, not the source of truth.
3. Users who never create an account must have a fully functional app for the lifetime of their device.
4. When a user does sign in, their local data must not be discarded — it must be merged with cloud data.

A naive "fetch from Supabase on mount" approach fails requirement 1 and 3. A naive "write to Supabase on every roll" approach fails 1 and 2. The solution is a local-first architecture with an explicit sync layer.

The two candidate local persistence mechanisms are **AsyncStorage** and **Expo SQLite**:
- AsyncStorage is simpler but serializes everything as JSON strings. It has no query capability, which makes filtering history by game or date require loading the entire history array.
- Expo SQLite provides a real relational store with indexed queries. It is more complex to set up but scales correctly as history grows into hundreds or thousands of entries.

The PRD identifies platform-specific storage: Expo SQLite on iOS and Android, AsyncStorage on web (backed by IndexedDB). This distinction must be hidden from the rest of the codebase.

## Decision

### Local storage as primary, Supabase as sync target

All reads and writes go to local storage first. Supabase is written to asynchronously after the local write succeeds. The local store is always consistent. The remote may be slightly behind.

The write path for a roll result:
1. `roll()` executes — pure computation, no I/O
2. Result is appended to local history synchronously (AsyncStorage/SQLite write)
3. The roll result overlay is displayed immediately — no waiting on network
4. If the user is authenticated and online, a background sync task queues the same entry for Supabase insertion
5. On failure, the sync task retries with exponential backoff (max 3 retries, then entry is marked as pending-sync and retried on next app launch)

The write path for saving a template follows the same pattern.

### `lib/storage.ts` abstraction

All local I/O goes through a single module at `lib/storage.ts`. This module exports a platform-agnostic interface:

```typescript
interface LocalStorage {
  getTemplates(): Promise<RollTemplate[]>
  saveTemplate(template: RollTemplate): Promise<void>
  updateTemplate(template: RollTemplate): Promise<void>
  deleteTemplate(id: string): Promise<void>

  getHistory(limit?: number): Promise<RollHistoryEntry[]>
  appendHistory(entry: RollHistoryEntry): Promise<void>
  deleteHistoryEntry(id: string): Promise<void>
  clearHistory(): Promise<void>

  getPreferences(): Promise<Preferences>
  savePreferences(prefs: Preferences): Promise<void>
}
```

`updateTemplate` takes a `RollTemplate` with an existing `id` and replaces the stored record. For `SQLiteBackend` this is an `UPDATE ... WHERE id = ?`; for `AsyncStorageBackend` it is a find-by-id replacement in the JSON array. Callers are responsible for updating `updated_at` before calling `updateTemplate`.

**Schema migrations are out of scope for v1.** The initial schema is created once via `CREATE TABLE IF NOT EXISTS`. There is no ALTER TABLE strategy, no migration runner, and no version table. If the schema needs to change in a future version, the migration approach is deferred to that story. This is a known constraint: schema changes in v1+ will require a dedicated migration plan.

The implementation selects the correct backend at module load time:

```typescript
import { Platform } from 'react-native'

export const storage: LocalStorage = Platform.OS === 'web'
  ? new AsyncStorageBackend()
  : new SQLiteBackend()
```

Components and hooks never import from `expo-sqlite` or `@react-native-async-storage/async-storage` directly. They call `storage.*`. This makes the platform distinction a single-file concern and makes the interface testable with a mock backend.

### Expo SQLite (native) — schema

The SQLite database (`randsum.db`) is opened at app startup. The schema is applied via a migration at first launch:

```sql
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notation TEXT NOT NULL,
  variables TEXT,        -- JSON
  game_id TEXT,
  game_inputs TEXT,      -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  notation TEXT NOT NULL,
  total INTEGER NOT NULL,
  rolls TEXT NOT NULL,   -- JSON
  game_id TEXT,
  template_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL    -- JSON
);
```

JSON columns (`variables`, `game_inputs`, `rolls`) are stored as JSON strings and parsed in the `SQLiteBackend` implementation. This avoids a complex relational schema for fields that are always read and written as a unit.

### AsyncStorage (web) — key conventions

AsyncStorage keys are namespaced to avoid collisions:

```
randsum/templates          → JSON array of RollTemplate
randsum/history            → JSON array of RollHistoryEntry (most recent first, capped at 500)
randsum/preferences        → JSON object matching Preferences type
```

The 500-entry history cap is enforced at write time on web. SQLite has no equivalent cap (queries can use `LIMIT`).

### Conflict resolution: last-write-wins by `updated_at`

When a user signs in, the sync engine merges local data with Supabase data. The merge strategy is **last-write-wins by `updated_at` timestamp**:

- For templates: if the same `id` exists in both local and remote, the record with the later `updated_at` wins. The winning record is written to both stores.
- For history: history entries are append-only. The merge union is taken (entries from both sources, deduped by `id`).
- For preferences: the most recent `updated_at` wins across the entire preferences object (not per-field).

This strategy is chosen for simplicity. It is documented as a known trade-off: two devices editing the same template simultaneously (unlikely but possible) will result in one edit being silently overwritten. A CRDT-based approach is explicitly deferred to a future version.

### `lib/sync.ts` — sync engine

The sync engine at `lib/sync.ts` is responsible for:

1. **On sign-in:** Fetching all user data from Supabase and running the merge algorithm
2. **On each local write:** Attempting an immediate Supabase upsert if online and authenticated; otherwise enqueuing the entry in a pending-sync queue (stored locally as `randsum/sync-queue`)
3. **On app launch (authenticated):** Flushing the pending-sync queue and pulling any remote changes since the last successful sync (tracked via `randsum/last-sync-at` timestamp)

The sync engine is not exposed to components. It is called by hooks (`useTemplates`, `useHistory`) and by the auth lifecycle (sign-in triggers a full merge).

### Data that is never synced

Preferences that are pure device UI state — specifically the `haptics` toggle — are stored locally only and never synced. A user may want haptics on their phone but not on a tablet. Preferences that represent user configuration meaningful across devices — `theme`, `defaultMode`, `lastGameId` — are included in the Supabase `profiles.preferences` jsonb column.

## Consequences

### Positive

- The app works identically online and offline. The core roll loop has no async I/O on the critical path.
- The `LocalStorage` interface is mockable in tests. Unit tests for hooks never touch a real SQLite file or network.
- Users who never create accounts get the full feature set indefinitely.
- The write-local-first pattern means roll results are never lost due to network failure.

### Negative

- Two storage backends (`SQLiteBackend`, `AsyncStorageBackend`) must be maintained and kept behaviorally identical. Divergence in edge cases (e.g. JSON parsing of `null` values) will surface as platform-specific bugs.
- The merge algorithm on sign-in can be slow if a user has hundreds of local templates and a large cloud history. A progress indicator or background task is required.
- Last-write-wins does not protect against simultaneous edits from two devices. This is an accepted limitation for v1.
- History on web is capped at 500 entries; native is uncapped. This behavioral difference must be documented.

### Neutral

- The pending-sync queue is itself stored in AsyncStorage/SQLite. If the queue grows large (many offline writes), the sync-on-launch step may take noticeable time. Queue size should be logged in development.
- `lib/sync.ts` has no UI. Sync status (pending, syncing, error) is surfaced via a Zustand `useSyncStore` that the Account screen reads to display the sync status indicator.

## References

- PRD: Data Model section (local storage schema, Supabase schema, sync strategy)
- PRD: Platform-Specific Considerations (SQLite on native, AsyncStorage on web)
- ADR-001: State Management Topology (TanStack Query wraps `lib/storage.ts` reads)
- Expo SQLite docs: `expo-sqlite` v14+ new API (`openDatabaseSync`, `useSQLiteContext`)
- Supabase docs: Row-level security policies (all tables need `user_id = auth.uid()` RLS)
