# Zustand Store Contracts

All client/UI state in the RANDSUM Expo app is managed by Zustand stores. See ADR-001 for the boundary rule: Zustand owns synchronous device-local state; TanStack Query owns Supabase-fetched state. These two layers never overlap.

Stores that must survive app restart use the `persist` middleware writing to AsyncStorage. Store keys are namespaced under `zustand/` to avoid collisions with TanStack Query's cache keys and raw `randsum/` storage keys.

---

## `usePoolStore`

**File:** `lib/stores/poolStore.ts`

Holds the dice pool being built in Simple Mode. Reset on Roll (after result is dispatched) or Clear. Not persisted — the pool is session state.

```typescript
import type { RollArgument } from '@randsum/roller'

/** Map of die sides to current count in the pool */
type DicePool = {
  readonly [sides: number]: number
}

interface PoolState {
  /** Current dice counts keyed by number of sides */
  readonly pool: DicePool
  /** Whether the pool has at least one die */
  readonly isEmpty: boolean

  /** Increment the count for `sides`-sided dice by 1 */
  increment(sides: number): void
  /** Decrement the count for `sides`-sided dice by 1. Removes key when count reaches 0 */
  decrement(sides: number): void
  /** Reset all die counts to zero */
  clear(): void
  /**
   * Convert the current pool to a notation string suitable for `roll()`.
   * Returns null when pool is empty.
   * Example: { 6: 3, 8: 1 } → "3d6+1d8"
   */
  toNotation(): string | null
  /**
   * Convert the current pool to an array of `RollArgument` values.
   * Returns an empty array when pool is empty.
   * Used when calling `roll(...args)` with spread.
   */
  toArguments(): readonly RollArgument[]
}
```

**Initial state:** `pool: {}`, `isEmpty: true`

**Notes:**
- `increment` and `decrement` are the only write paths — direct pool assignment is not exposed
- `decrement` on a die with count 1 removes the key entirely (does not set it to 0)
- `toNotation` joins entries with `+`: `3d6+1d8+1d20`. Entries are ordered by sides ascending
- When switching from Simple Mode to Advanced Mode, the Roll tab calls `toNotation()` and seeds `useNotationStore` with the result

---

## `useNotationStore`

**File:** `lib/stores/notationStore.ts`

Holds the notation string and validation state for Advanced Mode. Not persisted.

```typescript
interface NotationState {
  /** Current notation string (may be invalid) */
  readonly notation: string
  /** True when `isDiceNotation(notation)` returns true */
  readonly isValid: boolean
  /** True when notation is non-empty and invalid */
  readonly hasError: boolean

  /** Replace the current notation string and revalidate */
  setNotation(notation: string): void
  /** Reset to empty string */
  clear(): void
}
```

**Initial state:** `notation: ''`, `isValid: false`, `hasError: false`

**Notes:**
- `isValid` and `hasError` are derived from `notation` — they are not stored independently. Calling `setNotation` must update both synchronously
- `isDiceNotation` is imported from `@randsum/roller` — no local validation logic
- The Roll button in Advanced Mode is enabled only when `isValid` is true

---

## `useThemeStore`

**File:** `lib/stores/themeStore.ts`

Holds the resolved semantic token map for the current color scheme. Persisted to AsyncStorage under key `zustand/theme`. See ADR-005 for the full token set.

```typescript
type ColorScheme = 'dark' | 'light'

/** Semantic token map — all values are hex color strings */
interface ThemeTokens {
  readonly bg: string
  readonly surface: string
  readonly surfaceAlt: string
  readonly border: string
  readonly text: string
  readonly textMuted: string
  readonly textDim: string
  readonly accent: string
  readonly accentHigh: string
  readonly error: string
  readonly success: string
}

/** Font size token set — all values are numbers (React Native StyleSheet units) */
interface FontSizes {
  readonly xs: 11
  readonly sm: 13
  readonly base: 15
  readonly lg: 17
  readonly xl: 22
  readonly '2xl': 32
  readonly '3xl': 48
}

interface ThemeState {
  readonly colorScheme: ColorScheme
  readonly tokens: ThemeTokens
  readonly fontSizes: FontSizes

  /** Switch to the specified color scheme and update tokens */
  setTheme(scheme: ColorScheme): void
  /** Toggle between 'dark' and 'light' */
  toggleTheme(): void
}
```

**Initial state:** `colorScheme: 'dark'` with dark token values. On store initialization, `useColorScheme()` from React Native is read; if the result is `'light'`, the store initializes to light mode. After a user explicitly calls `setTheme`, the explicit preference overrides the system value and is persisted.

**Token values — dark mode:**

| Token | Value |
|---|---|
| `bg` | `#09090b` |
| `surface` | `#18181b` |
| `surfaceAlt` | `#27272a` |
| `border` | `#52525b` |
| `text` | `#fafafa` |
| `textMuted` | `#a1a1aa` |
| `textDim` | `#71717a` |
| `accent` | `#a855f7` |
| `accentHigh` | `#d8b4fe` |
| `error` | `#ef4444` |
| `success` | `#10b981` |

**Token values — light mode:**

| Token | Value |
|---|---|
| `bg` | `#ffffff` |
| `surface` | `#f4f4f5` |
| `surfaceAlt` | `#e4e4e7` |
| `border` | `#a1a1aa` |
| `text` | `#18181b` |
| `textMuted` | `#3f3f46` |
| `textDim` | `#71717a` |
| `accent` | `#a855f7` |
| `accentHigh` | `#7c3aed` |
| `error` | `#dc2626` |
| `success` | `#059669` |

**Notes:**
- Components access tokens via the `useTheme()` hook (see `hooks.md`), not by calling `useThemeStore` directly
- All `StyleSheet` objects that include color values must be constructed inside the component body (cannot be module-level constants) — see ADR-005
- The handoff from `useProfileQuery` to this store happens in a one-time `useEffect` on query success: `useThemeStore.getState().setTheme(profile.preferences.theme)`. After that, Zustand owns the theme; TanStack Query does not re-seed it

---

## `useUIStore`

**File:** `lib/stores/uiStore.ts`

Holds overlay visibility, selected game, and other cross-tab UI state that must survive re-renders but is not persisted.

```typescript
interface UIState {
  /** ID of the currently selected game in the Games tab, or null if showing the selector */
  readonly activeGameId: string | null

  /** Set the active game ID */
  setActiveGame(gameId: string): void
  /** Return to the game selector (clear active game) */
  clearActiveGame(): void
}
```

**Initial state:** `activeGameId: null`

**Notes:**
- Roll mode (simple vs. advanced) is managed by `usePoolStore` state: when `useNotationStore.notation` is non-empty and the user has explicitly toggled Advanced Mode, a separate `mode: 'simple' | 'advanced'` field on `usePoolStore` tracks the active view. If that state grows, it may be extracted to a dedicated `useRollModeStore`
- The roll result overlay is a modal route (see ADR-004) rather than a Zustand-controlled component — overlay visibility is not tracked here

---

## `useWizardStore`

**File:** `lib/stores/wizardStore.ts`

Holds all state for the Roll Wizard modal (`app/wizard.tsx`). State is internal to the wizard route — components outside `wizard.tsx` do not read from this store. See ADR-004 and ADR-006 for the single-route wizard model.

```typescript
import type { RollTemplate } from '@/lib/types'

type WizardStep = 'type' | 'build' | 'variables' | 'name'
type WizardType = 'standard' | 'game'

interface WizardState {
  /** Current step in the wizard flow */
  readonly step: WizardStep
  /** Whether the wizard is building a standard notation or game roll */
  readonly type: WizardType
  /** Partial template accumulated across wizard steps */
  readonly draft: Partial<RollTemplate>
  /** True when the wizard can advance to the next step (step-specific validation) */
  readonly canAdvance: boolean

  /** Advance to the next step. No-op when already at 'name' */
  goToNext(): void
  /** Go back to the previous step. No-op when already at 'type' */
  goToPrev(): void
  /** Set the wizard type ('standard' or 'game') */
  setType(type: WizardType): void
  /** Merge fields into the draft template */
  updateDraft(fields: Partial<RollTemplate>): void
  /**
   * Reset all wizard state to initial values.
   * Called on wizard entry (in a useEffect in wizard.tsx) and on cancel/save.
   */
  reset(): void
}
```

**Initial state:** `step: 'type'`, `type: 'standard'`, `draft: {}`, `canAdvance: false`

**Step progression:**

| Step | Can advance when |
|---|---|
| `type` | Always (type is pre-selected) |
| `build` | `draft.notation` is set and valid (standard path), or `draft.gameId` and `draft.gameInputs` are set (game path) |
| `variables` | Always (variables step has a skip option) |
| `name` | `draft.name` is non-empty |

**Notes:**
- Navigation between steps is entirely via `goToNext()` / `goToPrev()` — no `router.push()` calls inside the wizard
- The device back button and swipe-down dismiss the entire wizard via `router.back()`, not by going back one step
- `reset()` must be called at wizard entry to clear stale state from a previously abandoned session

---

## `useSyncStore`

**File:** `lib/stores/syncStore.ts`

Surface for `lib/sync.ts` to communicate sync engine status to the Account screen. Written by `lib/sync.ts`; read by the Account screen. Not persisted — resets to `idle` on every app launch.

```typescript
type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  /** Current sync engine status */
  readonly status: SyncStatus
  /** Number of local writes not yet confirmed by Supabase */
  readonly pendingCount: number
  /** ISO 8601 timestamp of the last successful sync, or null if never synced */
  readonly lastSyncAt: string | null
  /** Error message from the most recent failed sync, or null */
  readonly errorMessage: string | null

  /** Called by lib/sync.ts when a sync operation begins */
  setSyncing(): void
  /** Called by lib/sync.ts when a sync operation succeeds */
  setSyncSuccess(lastSyncAt: string): void
  /** Called by lib/sync.ts when a sync operation fails */
  setSyncError(message: string): void
  /** Called by lib/sync.ts when the pending count changes */
  setPendingCount(count: number): void
}
```

**Initial state:** `status: 'idle'`, `pendingCount: 0`, `lastSyncAt: null`, `errorMessage: null`

**Notes:**
- Components never call `setSyncing`, `setSyncSuccess`, or `setSyncError` directly — only `lib/sync.ts` does
- The Account screen reads `status`, `pendingCount`, and `lastSyncAt` to render the sync status indicator
- `errorMessage` is displayed in the Account screen when `status === 'error'`
- On successful sync, `errorMessage` is cleared (set to null)

---

## AsyncStorage Key Namespace

Zustand persist middleware uses the following keys. They must not collide with TanStack Query's cache keys or raw storage keys.

| Store | AsyncStorage key |
|---|---|
| `useThemeStore` | `zustand/theme` |

No other store is persisted via Zustand middleware. `usePreferencesStore` is intentionally absent — preferences are stored via `lib/storage.ts` (the `LocalStorage` abstraction from ADR-002) and read via TanStack Query's local query keys, not via Zustand persist middleware. This keeps the storage layer consistent: all structured data (templates, history, preferences) flows through `lib/storage.ts`, not through scattered AsyncStorage calls.
