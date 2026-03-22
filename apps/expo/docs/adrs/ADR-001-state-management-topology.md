# ADR-001: State Management Topology

## Status

Proposed

## Context

The RANDSUM Expo app has two meaningfully different categories of runtime state, and conflating them leads to either over-fetching (treating UI state as server data) or stale cache bugs (treating server data as local state).

**Client/UI state** is ephemeral, lives only on the device, and is mutated synchronously in response to user gestures:
- The current dice pool being built in Simple Mode (e.g. `3d6 + 1d8`)
- The current notation string in Advanced Mode
- Which game is selected in the Games tab
- Theme preference (dark/light) before it has been written to storage
- Whether the roll result overlay is visible

**Server/persisted state** is asynchronous, may be stale, and requires cache invalidation:
- Roll templates stored in Supabase (fetched on mount, written after user saves)
- Roll history when cloud sync is active (merged from local + remote on sign-in)
- The authenticated user's profile and preferences from Supabase

A single global store trying to own both categories creates a coupling problem: every Supabase response must be manually threaded into the store, and every cache invalidation has to be driven by imperative calls rather than query keys.

React Context alone is insufficient. Each of the five tabs potentially mounts independently in Expo Router, and passing context across tab boundaries via React's component tree is error-prone at the scale of this app.

## Decision

Use **two purpose-specific libraries with clear, non-overlapping boundaries**:

### Zustand — client/UI state

Zustand manages all state that is:
- Synchronous and device-local
- Not fetched from a remote source
- Reset on user action, not on cache expiry

Concrete stores:
- `usePoolStore` — current dice pool (Simple Mode), reset on Roll or Clear
- `useNotationStore` — current notation string (Advanced Mode), validation status
- `useThemeStore` — active theme (`'dark' | 'light'`), seeded from preferences but mutated by the toggle
- `useUIStore` — overlay visibility, active game selection, active tab state that must survive re-renders

Zustand stores are created with `create()` and optionally persisted to AsyncStorage using the `zustand/middleware` `persist` middleware for stores that must survive app restart (e.g. `useThemeStore`).

### TanStack Query — server/async state

TanStack Query (`@tanstack/react-query`) manages all state that is:
- Fetched from Supabase or derived from a Supabase response
- Subject to cache invalidation (e.g. after a template is saved or deleted)
- Loaded asynchronously and potentially stale

Concrete query domains:
- `useTemplatesQuery` — fetches the user's saved templates from Supabase; invalidated after any template mutation
- `useHistoryQuery` — fetches cloud roll history; only active when the user is authenticated
- `useProfileQuery` — fetches the user's Supabase profile and cloud preferences on sign-in

TanStack Query is configured with a `QueryClient` at the root layout. The Supabase client is the query function dependency — it is not stored in Zustand.

### The boundary rule

The boundary is enforced by one constraint: **Zustand stores never hold Supabase responses, and TanStack Query never holds UI gesture state.** If a piece of data crosses this line (e.g. preferences loaded from Supabase need to seed the theme store), that handoff happens in a one-time effect on query success, not by merging the two state layers.

Example: on successful `useProfileQuery`, a `useEffect` calls `useThemeStore.getState().setTheme(profile.preferences.theme)`. After that point, Zustand owns the theme for UI purposes. Zustand does not re-fetch from Supabase; TanStack Query does not know the theme store exists.

### Local data (AsyncStorage/SQLite)

Local templates and history — the data that exists before a user signs in — are accessed via a `lib/storage.ts` abstraction (see ADR-002). Reads from local storage are wrapped in TanStack Query using a local query key (e.g. `['templates', 'local']`). This keeps the hooks interface consistent for components regardless of whether the backing store is local or remote: components call `useTemplatesQuery()`, which internally decides whether to hit local storage or Supabase based on auth state.

## Consequences

### Positive

- Components have a single, consistent hook interface for each data domain regardless of whether auth is active.
- Cache invalidation after mutations (`invalidateQueries`) is automatic and correct — no manual Zustand setters to update template lists after a save.
- Zustand stores are small, type-safe, and testable in isolation.
- TanStack Query's devtools provide visibility into Supabase query timing, retries, and stale states during development.
- The boundary rule is enforceable in code review: any Supabase response showing up in a Zustand store is a clear violation.

### Negative

- Two state libraries means two mental models for developers new to the codebase.
- The handoff pattern (query success → seed Zustand) introduces a small window where the theme store has its default value before the profile query resolves. A loading state or skeleton must cover this.
- Persist middleware for Zustand (theme, preferences) and TanStack Query's cache are both writing to AsyncStorage. Key namespace collisions must be avoided by convention (`zustand/theme`, `rq/templates`, etc.).

### Neutral

- Neither library is a monorepo dependency. Both are app-only deps in `apps/expo/package.json`.
- The `QueryClient` lives in `app/_layout.tsx`. All tabs share one cache instance — this is the intended Expo Router pattern.

## References

- PRD: Technical Architecture section (Zustand, TanStack Query listed as core dependencies)
- PRD: Data Model section (local vs Supabase schema)
- ADR-002: Local-First Data Architecture (defines the `lib/storage.ts` abstraction referenced above)
- Expo Router docs: Root layout and shared providers
