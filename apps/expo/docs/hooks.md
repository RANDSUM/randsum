# Custom Hook Contracts

These hooks are the primary interface between components and the app's data and dice logic. Components must not import from `lib/storage.ts`, `lib/supabase.ts`, or `lib/sync.ts` directly — they call hooks.

All hooks follow the monorepo conventions: `import type`, explicit return types, no `any`.

---

## `useTheme()`

**File:** `hooks/useTheme.ts`

Returns the current semantic token map from `useThemeStore`. This is the only way components should access color tokens — never read from `useThemeStore` directly or use raw hex values in StyleSheet objects.

```typescript
import type { ThemeTokens, FontSizes, ColorScheme } from '@/lib/stores/themeStore'

interface UseThemeReturn {
  /** Resolved semantic tokens for the current color scheme */
  readonly tokens: ThemeTokens
  /** Font size scale */
  readonly fontSizes: FontSizes
  /** Current color scheme */
  readonly colorScheme: ColorScheme
  /** Toggle between dark and light */
  readonly toggleTheme: () => void
}

function useTheme(): UseThemeReturn
```

**Usage:**

```typescript
const { tokens, fontSizes } = useTheme()
const styles = StyleSheet.create({
  container: { backgroundColor: tokens.surface },
  label: { color: tokens.textMuted, fontSize: fontSizes.sm },
})
```

**Notes:**
- `StyleSheet.create` calls that include color tokens must be inside the component body, not at module level, because tokens change when the user switches color schemes

---

## `useRoll()`

**File:** `hooks/useRoll.ts`

Executes a dice roll via `@randsum/roller`, appends the result to local history, and navigates to the result overlay.

```typescript
import type { RollArgument, RollerRollResult } from '@randsum/roller'

interface UseRollOptions {
  /**
   * Optional template ID to associate with the history entry.
   * When provided, the history entry will include `templateId`.
   */
  templateId?: string
  /**
   * Optional game ID to associate with the history entry.
   * When provided, the history entry will include `gameId`.
   */
  gameId?: string
}

interface UseRollReturn {
  /**
   * Execute a roll with one or more arguments.
   * Appends to local history, then navigates to /result with serialized result.
   * Haptic feedback is NOT fired by this hook — it is owned by the UI layer
   * (RollButton, DieButton). See ADR-006 for haptic ownership.
   * Throws `ValidationError` if any argument fails `isDiceNotation` — callers
   * must either validate inputs or catch errors.
   */
  readonly roll: (...args: readonly RollArgument[]) => void
  /**
   * True while the roll is being appended to storage.
   * The overlay opens immediately; this flag covers the async storage write.
   */
  readonly isPending: boolean
}

function useRoll(options?: UseRollOptions): UseRollReturn
```

**Side effects:**
1. Calls `roll(...args)` from `@randsum/roller` — synchronous, pure computation (haptics are handled by the calling UI component, not this hook)
3. Appends a `RollHistoryEntry` to local storage via `storage.appendHistory()` — async, does not block the overlay
4. Calls `router.push({ pathname: '/result', params: { result: serializeRollResult(result) } })` — opens the result overlay immediately (does not wait for storage write)
5. If authenticated and online, `lib/sync.ts` queues the history entry for Supabase insertion in the background

**Error states:**
- `roll()` from `@randsum/roller` throws `ValidationError` on invalid notation. The caller is responsible for validation (e.g. checking `isValid` from `useNotationStore` before calling). `useRoll` does not swallow errors.
- Storage write failures are logged but do not surface to the user — the overlay still opens.

---

## `useGameRoll(gameId: string)`

**File:** `hooks/useGameRoll.ts`

Executes a game-specific roll via `@randsum/games`, appends to history, and navigates to the result overlay. The game module is loaded dynamically based on `gameId`.

```typescript
import type { GameRollResult } from '@randsum/games'

type SupportedGameId =
  | 'blades'
  | 'fifth'
  | 'daggerheart'
  | 'pbta'
  | 'root-rpg'
  | 'salvageunion'

interface UseGameRollReturn {
  /**
   * Execute a game roll with the given inputs.
   * `inputs` must match the spec's `roll.inputs` for the given `gameId`.
   * Navigates to /result with the serialized GameRollResult.
   * Throws `SchemaError` if inputs fail spec validation.
   */
  readonly roll: (inputs: Record<string, unknown>) => void
  /** True while the roll result is being appended to storage */
  readonly isPending: boolean
}

function useGameRoll(gameId: SupportedGameId): UseGameRollReturn
```

**Side effects:**
- Same storage/navigation pattern as `useRoll` (haptics owned by UI layer)
- The history entry includes `gameId` so the History feed can display the game name

**Error states:**
- Throws `SchemaError` (from `@randsum/games`) if `inputs` fails spec validation. Components should validate inputs against spec constraints before calling `roll()`.
- Unsupported `gameId` values (not in `SupportedGameId`) are a development-time error — TypeScript enforces the type at call sites.

---

## `useTemplates()`

**File:** `hooks/useTemplates.ts`

CRUD operations for roll templates. Reads from local storage (always) and syncs to Supabase (when authenticated). Built on TanStack Query with query key `['templates', 'local']` (unauthenticated) or `['templates', userId]` (authenticated).

```typescript
import type { RollTemplate } from '@/lib/types'

interface UseTemplatesReturn {
  /** All saved templates, sorted by `updatedAt` descending */
  readonly templates: readonly RollTemplate[]
  /** True on initial load */
  readonly isLoading: boolean
  /** True if the query failed */
  readonly isError: boolean

  /**
   * Save a new template to local storage (and sync to Supabase if authenticated).
   * `template.id` must be a pre-generated nanoid. Sets `createdAt` and `updatedAt`
   * to the current ISO timestamp if not provided.
   */
  readonly saveTemplate: (template: RollTemplate) => Promise<void>
  /**
   * Update an existing template. Caller must update `updatedAt` before passing.
   * Throws if no template with `template.id` exists in local storage.
   */
  readonly updateTemplate: (template: RollTemplate) => Promise<void>
  /**
   * Delete a template by ID from local storage and Supabase.
   * No-op if the ID does not exist.
   */
  readonly deleteTemplate: (id: string) => Promise<void>
}

function useTemplates(): UseTemplatesReturn
```

**Side effects:**
- `saveTemplate` and `updateTemplate` call `storage.saveTemplate` / `storage.updateTemplate`, then invalidate the `['templates']` query key to trigger a re-fetch
- If authenticated, mutations also enqueue a Supabase upsert via `lib/sync.ts`
- `deleteTemplate` calls `storage.deleteTemplate` then invalidates the query key

**Error states:**
- Storage errors bubble up as rejected promises — callers should wrap mutations in try/catch
- Supabase sync errors are queued for retry (see ADR-002); they do not cause the mutation to fail

---

## `useHistory()`

**File:** `hooks/useHistory.ts`

Read and write access to the roll history feed. Built on TanStack Query with query key `['history', 'local']` or `['history', userId]`.

```typescript
import type { RollHistoryEntry } from '@/lib/types'

interface UseHistoryReturn {
  /**
   * Roll history entries, most recent first.
   * On web, capped at 500 entries (AsyncStorage backend limit — see ADR-002).
   * On native, uncapped.
   */
  readonly entries: readonly RollHistoryEntry[]
  /** True on initial load */
  readonly isLoading: boolean

  /**
   * Append a new entry to history.
   * `entry.id` must be a pre-generated nanoid.
   * `entry.createdAt` must be an ISO 8601 string.
   */
  readonly appendEntry: (entry: RollHistoryEntry) => Promise<void>
  /** Delete a single history entry by ID */
  readonly deleteEntry: (id: string) => Promise<void>
  /** Delete all history entries from local storage and Supabase */
  readonly clearHistory: () => Promise<void>
}

function useHistory(): UseHistoryReturn
```

**Notes:**
- `useRoll` calls `appendEntry` internally — components on the History tab do not need to call it directly
- `clearHistory` is destructive and permanent; the History tab's "Clear all" button should confirm before calling it

---

## `useAuth()`

**File:** `hooks/useAuth.ts`

Supabase auth state and actions. This hook is thin wrapper over the Supabase client's auth state — it does not use TanStack Query (auth is event-driven, not polling-based).

```typescript
import type { User, Session } from '@supabase/supabase-js'

interface UseAuthReturn {
  /** Authenticated Supabase user, or null if signed out */
  readonly user: User | null
  /** Active Supabase session, or null */
  readonly session: Session | null
  /** True until the initial auth state check completes */
  readonly isLoading: boolean

  /**
   * Sign in with email and password.
   * On success, triggers a full sync merge (see lib/sync.ts).
   * Returns an error string on failure, or null on success.
   */
  readonly signIn: (email: string, password: string) => Promise<string | null>
  /**
   * Sign up with email and password.
   * On success, creates a Supabase profile and triggers initial sync.
   * Returns an error string on failure, or null on success.
   */
  readonly signUp: (email: string, password: string) => Promise<string | null>
  /**
   * Sign out the current user.
   * Clears the Supabase session. Local data is retained.
   * TanStack Query cache is cleared (queries fall back to local-only keys).
   */
  readonly signOut: () => Promise<void>
}

function useAuth(): UseAuthReturn
```

**Side effects on sign-in:**
1. Supabase session is established
2. `lib/sync.ts` runs the full merge algorithm (local data + Supabase data, last-write-wins by `updatedAt`)
3. `useProfileQuery` becomes active, fetches user preferences
4. On `useProfileQuery` success, a `useEffect` seeds `useThemeStore` with `profile.preferences.theme`
5. TanStack Query cache keys transition from `['templates', 'local']` to `['templates', userId]`

**Error states:**
- Auth failures (wrong password, network error) return a string error message from `signIn`/`signUp` — components display this string in the form UI
- Session expiry is handled by Supabase's refresh token mechanism — `useAuth` re-emits the refreshed session automatically

---

## `useSync()`

**File:** `hooks/useSync.ts`

Exposes sync engine status and a manual trigger. Reads from `useSyncStore`; delegates actions to `lib/sync.ts`.

```typescript
import type { SyncStatus } from '@/lib/stores/syncStore'

interface UseSyncReturn {
  /** Current sync status */
  readonly status: SyncStatus
  /** Number of local writes pending sync to Supabase */
  readonly pendingCount: number
  /** ISO 8601 timestamp of the last successful sync, or null */
  readonly lastSyncAt: string | null
  /** Error message from the most recent sync failure, or null */
  readonly errorMessage: string | null

  /**
   * Manually trigger a sync cycle.
   * No-op if not authenticated or if `status === 'syncing'`.
   * Flushes the pending queue and pulls remote changes.
   */
  readonly triggerSync: () => Promise<void>
}

function useSync(): UseSyncReturn
```

**Notes:**
- The Account screen reads `status`, `pendingCount`, `lastSyncAt`, and `errorMessage` to render the sync status indicator
- `triggerSync` is available as a "Sync now" button on the Account screen for users who want to force a sync
- Automatic sync on each local write is handled inside `lib/sync.ts`, not through this hook

---

## `useGameSpec(gameId: SupportedGameId)`

**File:** `hooks/useGameSpec.ts`

Returns the normalized input spec for a game, used by `GameRoller` to auto-generate input fields. This is a read-only hook with no side effects.

```typescript
type InputKind = 'integer' | 'string-options' | 'string-free'

interface InputSpec {
  /** Input field name (matches spec's `roll.inputs` key) */
  readonly name: string
  /** Human-readable label from spec */
  readonly label: string
  readonly kind: InputKind
  /** For `integer` inputs: lower bound */
  readonly min?: number
  /** For `integer` inputs: upper bound */
  readonly max?: number
  /** For `integer` inputs: default value */
  readonly defaultValue?: number
  /** For `string-options`: valid option values */
  readonly options?: readonly string[]
}

interface UseGameSpecReturn {
  /** Ordered list of input specs for the game */
  readonly inputs: readonly InputSpec[]
  /** Game display name */
  readonly name: string
  /** Game's accent color (from the `gameColors` map, see ADR-005) */
  readonly color: string
}

function useGameSpec(gameId: SupportedGameId): UseGameSpecReturn
```

**Notes:**
- Input specs are derived statically at build time from the `.randsum.json` specs — this hook does not fetch or compute anything at runtime
- `kind: 'integer'` → `NumericStepper` component
- `kind: 'string-options'` → segmented control (3 or fewer options) or bottom sheet picker (4 or more)
- `kind: 'string-free'` → `TextInput`
