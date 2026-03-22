# ADR-004: Navigation and Routing Architecture

## Status

Proposed

## Context

The app has five primary screens organized as a tab bar, plus two secondary surfaces that appear above the tab content:

1. **Roll result overlay** — appears after every roll, full-screen, dismissible by swipe-down or backdrop tap
2. **Roll wizard** — a multi-step flow for creating a template (4 steps: type → build → variables → name)

These surfaces require different navigation models:
- The tab bar must persist across all primary screens
- The result overlay must appear above the tab bar and block interaction with it
- The roll wizard is a linear flow (forward/back) that should not be accessible via deep links (it's transient)

Expo Router is the mandated navigation framework (it is listed as a core dependency in the PRD). It uses file-system-based routing that maps directly to Expo's directory structure. The key question is how to model the overlay and wizard within Expo Router's routing model vs. an imperative navigation call.

Two approaches exist:
1. **Expo Router file routes for all surfaces** — the overlay and wizard are routes in the file system. Navigation is declarative via `router.push()`. The overlay is a modal route.
2. **Imperative state for overlay** — the overlay is not a route; it is a Zustand-controlled component rendered at the root layout level, conditionally visible. Only the tabs and wizard are routes.

The PRD's technical architecture already specifies `result.tsx` as a file in `app/` (not inside `app/(tabs)/`), suggesting the modal-as-route model.

ADR-006 specifies that the Roll Wizard uses `presentationStyle: 'pageSheet'` on iOS and is dismissible via swipe-down on all platforms. A single-route modal with internal step state satisfies this requirement cleanly. A four-route stack would require back-button handling across route boundaries, complicate wizard-state persistence between steps, and create an inconsistent dismiss gesture (swipe-down dismisses the whole wizard vs. pops one step).

## Decision

### Expo Router file-based routing with tab navigator and modal stack

The routing structure maps to the file system as follows:

```
app/
  _layout.tsx             # Root layout — QueryClient, Zustand providers, modal stack
  result.tsx              # Roll result overlay (modal presentation)
  wizard.tsx              # Roll wizard (pageSheet modal, internal step state via useWizardStore)
  t/
    [id].tsx              # Shared template deep link
  (tabs)/
    _layout.tsx           # Tab navigator — 5 tabs with icons and labels
    index.tsx             # Roll tab (Simple Mode / Advanced Mode toggle)
    games.tsx             # Games tab
    saved.tsx             # Saved templates tab
    history.tsx           # History feed tab
    account.tsx           # Account / settings tab
```

### Tab group: `app/(tabs)/`

The `(tabs)` route group uses Expo Router's `Tabs` navigator from `expo-router`. The tab bar is visible on all five tab screens and hidden on the overlay and wizard. Tab icons use `@expo/vector-icons` (Ionicons), matching the PRD's icon descriptions.

Tab order and route mapping:

| Tab | File | Icon |
|-----|------|------|
| Roll | `(tabs)/index.tsx` | `dice-outline` / `dice` |
| Games | `(tabs)/games.tsx` | `game-controller-outline` |
| Saved | `(tabs)/saved.tsx` | `bookmark-outline` |
| History | `(tabs)/history.tsx` | `time-outline` |
| Account | `(tabs)/account.tsx` | `person-circle-outline` |

The tab navigator is defined in `(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarStyle: { backgroundColor: '#18181b' }, ... }}>
      <Tabs.Screen name="index" options={{ title: 'Roll', tabBarIcon: ... }} />
      <Tabs.Screen name="games" options={{ title: 'Games', tabBarIcon: ... }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ... }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ... }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ... }} />
    </Tabs>
  )
}
```

### Roll result overlay: `app/result.tsx` as a modal route

The roll result overlay is a modal route at `app/result.tsx`. It is registered in the root layout as a modal presentation:

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="result"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="wizard"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  )
}
```

When a roll completes, the `useRoll` hook writes the result to a Zustand store (`useRollResultStore`) and then calls `router.push('/result')` with no params. The result screen reads from the store, not from route params.

```typescript
// In useRoll.ts
setPending(parsedResult)
router.push('/result')

// In result.tsx
const pending = useRollResultStore(s => s.pending)
```

**Why a store instead of route params:** Roll results contain `RollRecord[]` — deeply nested arrays that can be large (e.g., Salvage Union rolls with many modifier steps). JSON-stringifying them into URL params risks hitting URL length limits on web and adds unnecessary serialization overhead. The store approach avoids this class of bug entirely. Roll results are ephemeral (not shareable by URL), so deep-linkability is not a concern.

On dismiss (swipe down or backdrop tap), the result screen calls `router.back()`, which returns to the originating tab. The store is cleared on unmount. History append happens inside `useRoll` immediately after the roll — the result is recorded before the overlay opens.

`lib/parseRollResult.ts` remains as a utility defining the `ParsedRollResult` type. `serializeRollResult` and `parseRollResult` functions are retained for potential future deep-link use but are not used in the current result flow.

Using a modal route provides:
- Native iOS/Android modal dismiss gesture for free (`presentation: 'modal'`)
- A back stack entry — the "Roll again" action re-fires the roll and updates the store in-place

### Roll wizard: `app/wizard.tsx` as a single modal route with internal step state

The wizard is a **single route** at `app/wizard.tsx`, presented as a `pageSheet` modal (consistent with ADR-006). All step navigation is internal — the wizard component renders the correct step view based on a Zustand `useWizardStore`.

```typescript
// lib/useWizardStore.ts
interface WizardState {
  step: number  // 0-3 index
  type: 'standard' | 'game' | null
  draft: Partial<RollTemplate>
  readonly canAdvance: boolean
  goToNext(): void
  goToPrev(): void
  setType(type: 'standard' | 'game'): void
  updateDraft(fields: Partial<RollTemplate>): void
  reset(): void
}
```

Navigation inside the wizard is entirely imperative (`useWizardStore().goToNext()`) — no route pushes, no back-stack entries between steps. The native back button and swipe-down gesture both dismiss the entire wizard (calling `router.back()`), not pop a single step. A visible "Back" button inside the wizard UI calls `goToPrev()` to go to the previous step; "Cancel" calls `router.back()` directly.

On successful save at the Name step, the wizard calls `router.replace('/(tabs)/saved')`, replacing the wizard modal with the saved tab so the back button does not return to the wizard.

The `useWizardStore` is reset on wizard entry (in a `useEffect` in `wizard.tsx`) to clear any stale state from a previously abandoned session.

This model resolves the contradiction with ADR-006's `pageSheet` description: a single modal route dismisses as a sheet, which is the platform-correct behavior. A four-route stack inside the modal would require custom back-button logic to distinguish "pop wizard step" from "dismiss wizard sheet."

### `lib/parseRollResult.ts` — serialization helper

`RollRecord` from `@randsum/roller` contains nested arrays and numeric values that are fully JSON-serializable, but Expo Router's params are typed as `string | string[]`. A dedicated helper at `lib/parseRollResult.ts` owns the serialization contract and handles type narrowing:

```typescript
import type { RollRecord } from '@randsum/roller'

export interface ParsedRollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
}

/** Serialize a roll result for passing as an Expo Router route param. */
export function serializeRollResult(result: ParsedRollResult): string {
  return JSON.stringify(result)
}

/**
 * Deserialize a roll result from an Expo Router route param.
 * Returns null if the param is absent or malformed — callers must handle this
 * case (e.g. navigate back immediately).
 */
export function parseRollResult(raw: string | string[] | undefined): ParsedRollResult | null {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as ParsedRollResult
  } catch {
    return null
  }
}
```

This helper is the only place in the codebase that calls `JSON.parse` on route params. Using it rather than inline `JSON.parse` calls ensures that any future schema change to `ParsedRollResult` is a single-file update, and that the `exactOptionalPropertyTypes` constraint does not produce subtle bugs across multiple call sites.

### Simple/Advanced Mode toggle: in-screen state, not routing

The toggle between Simple Mode and Advanced Mode within the Roll tab is **not a route change**. It is managed by `usePoolStore` (or a dedicated `useRollModeStore` if the state grows). The Roll tab renders either `<SimpleMode />` or `<AdvancedMode />` based on the stored mode. This avoids URL bar changes on web (which would be jarring) and keeps the mode change instant (no route transition animation).

### Deep links

The PRD specifies `randsum.io/t/{template_id}` for sharing a template. Expo Router maps this URL to a route. The mapping:

```
randsum.io/t/[id]  →  app/t/[id].tsx
```

This route checks if the user is authenticated:
- If signed in: fetches the template from Supabase by `id`, offers to save it to the user's templates
- If not signed in: shows the template details with a "Save" prompt that routes to sign-up

This route is not in the tab group and has no tab bar. After saving, it navigates to `/(tabs)/saved`.

## Consequences

### Positive

- The file system structure in `app/` maps directly to the PRD's navigation description. Developers can orient themselves in the file tree by reading the PRD.
- The modal presentation for the result overlay uses native iOS/Android swipe-to-dismiss with no custom gesture code.
- Deep links for shared templates have a natural home at `app/t/[id].tsx`.
- Expo Router's `useLocalSearchParams()` and `router.push()` are the only navigation primitives needed — no imperative navigation service or context.
- The single-route wizard aligns with ADR-006's `pageSheet` description: swipe-down dismisses the entire wizard. No custom back-button interception is needed between wizard steps.
- `useWizardStore` cleanly accumulates step state in memory without polluting route params with partially-complete wizard data.

### Negative

- Roll results are passed via Zustand store, not URL params. This means roll results are not deep-linkable — acceptable since they are ephemeral.
- Wizard step navigation is not reflected in the URL. Users cannot deep-link to a mid-wizard state (acceptable — this is explicitly out of scope).
- `router.replace('/(tabs)/saved')` after wizard completion discards the wizard modal from the back stack. If the user expects the back button to return to the wizard after a save, this will surprise them. This is an accepted UX trade-off — returning to a completed wizard would be confusing.

### Neutral

- Expo Router on web generates URLs for all routes. The Roll tab is at `/`, Games is at `/games`, etc. This is correct for PWA use and matches conventional web app URL patterns.
- The `presentation: 'modal'` stack screen option behaves differently on iOS (card slides up from bottom), Android (activity animation), and web (no native animation; CSS transition should be added). This platform difference is cosmetic and acceptable.

## References

- PRD: Navigation Structure section (5 tabs, result overlay, roll wizard)
- PRD: Technical Architecture section (`app/` directory structure)
- PRD: Sharing section (`randsum.io/t/{template_id}` deep link)
- Expo Router docs: Tab navigator, Stack navigator, modal presentation, `useLocalSearchParams`
- ADR-001: State Management Topology (wizard state in Zustand, not in routes)
- ADR-006: Interaction Patterns — Roll Wizard as `pageSheet`, step indicator, dismiss behavior
