# ADR-001: State Management Topology

## Status

Accepted (partially implemented)

## Context

The RANDSUM Expo app is a single-screen prototype (`app/index.tsx`). Its runtime
state is small and entirely client-side:

- The current notation string being edited, plus its validation status
- The active color scheme (`'dark' | 'light'`)
- Whether the roll-result modal is visible, and the result it shows

There is no server, no account system, and no remote data source. Earlier drafts
of this ADR described a Zustand + TanStack Query split with Supabase-backed
templates, history, and profiles; none of that is installed or used today. This
ADR is trimmed to the topology that actually ships.

## Decision

Use **Zustand for client/UI state**, with AsyncStorage persistence for the
preferences that must survive a reload. There is no server-state library.

### Zustand stores (`lib/stores/`)

- `useThemeStore` (`lib/stores/themeStore.ts`) — holds `colorScheme` and the
  derived `tokens` / `fontSizes`. **Persisted** via `zustand/middleware`
  `persist` + `createJSONStorage(() => AsyncStorage)` under the key
  `zustand/theme`. `partialize` persists only `colorScheme`; `tokens` are
  recomputed from `getTokens()` on rehydrate (`onRehydrateStorage`).
  `initThemeFromSystem()` seeds the store once from the system `useColorScheme()`
  value, called from `app/_layout.tsx`; an explicit user toggle then takes over.
- `useNotationStore` (`lib/stores/notationStore.ts`) — holds the current
  `notation` string plus derived `isValid` / `hasError` from `isDiceNotation()`.
  **Not persisted.**

Stores expose selector-friendly hooks; consumers read with
`useStore(s => s.field)`. `hooks/useTheme.ts` is a thin wrapper over
`useThemeStore`.

### Roll result

The current roll result is held in local `useState` inside `app/index.tsx`, not
in a store. It is ephemeral and only one screen needs it, so a store would be
overkill.

### No server-state library

TanStack Query is **not installed**. There is nothing to fetch — `roll()` is a
pure local computation from `@randsum/roller`. If a remote data source is ever
added, a server-state library can be introduced then, behind its own ADR.

## Consequences

### Positive

- The state layer is minimal: two small, type-safe Zustand stores plus one piece
  of local component state.
- Theme preference survives reloads via AsyncStorage with no extra wiring.
- No cache-invalidation machinery to reason about, because there is no cache.

### Negative

- The `notationStore`/`themeStore` split is deliberately small; if the app grows
  to multiple screens sharing more state, the store topology will need revisiting.

### Neutral

- Zustand is an app-only dependency in `apps/expo/package.json`, not a monorepo
  dependency.
- A `lib/storage.ts` / `lib/storage.web.ts` abstraction exists (templates,
  history, preferences) but is **not wired into the screen** — it is exercised
  only by tests. See ADR-002.

## References

- ADR-002: Local-First Data Architecture (status of the unused storage layer)
- ADR-005: Design System & Theme Tokens (the theme store's token map)
- `lib/stores/themeStore.ts`, `lib/stores/notationStore.ts`
