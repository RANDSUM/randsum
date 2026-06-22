# ADR-002: Local-First Data Architecture

## Status

Superseded — the broader local-first/sync design is **not implemented**.

The original ADR described a local-first data layer with Expo SQLite on native,
AsyncStorage on web, a `lib/sync.ts` sync engine, and Supabase as a sync target
with last-write-wins conflict resolution. **None of that was built.** Supabase
was removed from the app on 2026-03-25; SQLite and the sync engine never existed.
This document is reduced to the persistence that actually ships, plus an explicit
record of what is deferred.

## Context

The app is a single-screen prototype. The only data that needs to outlive a
reload today is the user's theme preference. There is no roll history feed, no
saved templates surface, no account system, and no network data source in the
running app.

## Decision (current state)

### AsyncStorage via Zustand persist (the only live persistence)

The one piece of persisted state is `colorScheme`, written by `useThemeStore`
through `zustand/middleware` `persist` with
`createJSONStorage(() => AsyncStorage)` (key `zustand/theme`). On web,
AsyncStorage is backed by the browser's `localStorage`. See ADR-001.

### `lib/storage.ts` abstraction — exists but unused by the app

A `LocalStorage` interface (`lib/storage.ts`) and an AsyncStorage-backed
implementation (`lib/storage.web.ts`) exist for templates, history, and
preferences:

```typescript
interface LocalStorage {
  getTemplates(): Promise<readonly RollTemplate[]>
  saveTemplate(template: RollTemplate): Promise<void>
  updateTemplate(template: RollTemplate): Promise<void>
  deleteTemplate(id: string): Promise<void>

  getHistory(limit?: number): Promise<readonly RollHistoryEntry[]>
  appendHistory(entry: RollHistoryEntry): Promise<void>
  deleteHistoryEntry(id: string): Promise<void>
  clearHistory(): Promise<void>

  getPreferences(): Promise<Preferences>
  savePreferences(prefs: Preferences): Promise<void>
}
```

`storage.web.ts` namespaces its keys (`randsum/templates`, `randsum/history`,
`randsum/preferences`) and caps history at 500 entries. **No screen, hook, or
store imports this module** — it is currently exercised only by tests. It is a
scaffold for a future history/templates surface, not a live part of the app.

## Deferred — explicitly not implemented

The following were described in earlier specs and are **not built**. Do not treat
them as architecture:

- **Expo SQLite native backend** — never written. `expo-sqlite` is not a
  dependency. The `LocalStorage` interface has only an AsyncStorage backend.
- **`lib/sync.ts` sync engine** — never written. There is no pending-sync queue,
  no `randsum/sync-queue`, no `randsum/last-sync-at`.
- **Supabase sync target** — removed 2026-03-25. Not installed, not wired. Do not
  re-add without an explicit task.
- **Conflict resolution (last-write-wins by `updated_at`)** — moot; nothing syncs.
- **Platform-forked storage backends** — only the web/AsyncStorage path exists.

If a persistent history or template feature is taken on, it should be re-specified
against the codebase as it stands at that time, under a fresh ADR.

## Consequences

### Positive

- The only live persistence (theme preference) is trivial and reliable.
- The unused `LocalStorage` interface is fully mockable and test-covered, so a
  future feature has a typed starting point.

### Negative

- The presence of `lib/storage.ts` / `lib/storage.web.ts` can mislead readers
  into thinking a data layer is wired up. It is not — only tests touch it.

### Neutral

- The web 500-entry history cap and the `Preferences` defaults in `storage.web.ts`
  describe intended behavior for a feature that does not yet have UI.

## References

- ADR-001: State Management Topology (theme persistence via AsyncStorage)
- `lib/storage.ts`, `lib/storage.web.ts` (the unused abstraction)
- `apps/expo/CLAUDE.md` — "Current State" note (Supabase removed 2026-03-25)
