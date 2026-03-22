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

## Decision

### Expo Router file-based routing with tab navigator and modal stack

The routing structure maps to the file system as follows:

```
app/
  _layout.tsx             # Root layout — QueryClient, Zustand providers, modal stack
  result.tsx              # Roll result overlay (modal presentation)
  (tabs)/
    _layout.tsx           # Tab navigator — 5 tabs with icons and labels
    index.tsx             # Roll tab (Simple Mode / Advanced Mode toggle)
    games.tsx             # Games tab
    saved.tsx             # Saved templates tab
    history.tsx           # History feed tab
    account.tsx           # Account / settings tab
  wizard/
    _layout.tsx           # Wizard stack layout (back button, step indicator)
    index.tsx             # Step 1: Choose type (Standard or Game)
    build.tsx             # Step 2: Build the roll
    variables.tsx         # Step 3: Add variables
    name.tsx              # Step 4: Name and save
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
      <Stack.Screen name="wizard" options={{ headerShown: false }} />
    </Stack>
  )
}
```

When a roll completes, the screen that triggered the roll calls `router.push('/result')` with the roll result passed as route params (serialized as a JSON string to satisfy Expo Router's string-only param constraint):

```typescript
router.push({
  pathname: '/result',
  params: { result: JSON.stringify(rollResult) },
})
```

The result screen reads params with `useLocalSearchParams()` and parses the JSON. On dismiss (swipe down or backdrop tap), the result screen calls `router.back()`, which returns to the originating tab. The history append happens inside the result screen's `useEffect` on mount — the result is always recorded before the overlay is shown, not on dismiss.

Using a route (rather than a Zustand-controlled overlay at the root layout level) provides:
- Native iOS/Android modal dismiss gesture for free (`presentation: 'modal'`)
- A back stack entry — the "Roll again" action can replace the current modal route with a new roll result
- Deep-linkability if a future feature wants to link to a shared result (params are URL-accessible on web)

### Roll wizard: `app/wizard/` as a stack

The wizard is a four-screen stack at `app/wizard/`. It uses Expo Router's nested stack navigator. Each step pushes forward; the native back button or a custom "Back" button pops. Step 4 (name and save) calls `router.replace('/(tabs)/saved')` on successful save, replacing the wizard stack with the saved tab so the back button does not return to the wizard.

The wizard is entered via `router.push('/wizard')` from the Saved tab's FAB or header button. It is not accessible via deep links (no reason to link to mid-wizard state).

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

### Negative

- Roll result params must be JSON-stringified to pass through Expo Router's string param constraint. Deeply nested `RollRecord` types must be serialized and deserialized correctly; any non-serializable values (e.g. `undefined` fields vs. absent fields in `exactOptionalPropertyTypes`) can cause subtle bugs.
- The wizard's four-step flow is four route files. Simple state (e.g. the notation string built in step 2, needed in step 3) cannot be passed via URL params for complex objects. A Zustand `useWizardStore` is needed to hold in-progress wizard state across steps, with the store cleared on wizard exit.
- `router.replace('/(tabs)/saved')` after wizard completion discards the wizard stack history. If the user expects the back button to return to the wizard after a save, this will surprise them. This is an accepted UX trade-off — returning to a completed wizard would be confusing.

### Neutral

- Expo Router on web generates URLs for all routes. The Roll tab is at `/`, Games is at `/games`, etc. This is correct for PWA use and matches conventional web app URL patterns.
- The `presentation: 'modal'` stack screen option behaves differently on iOS (card slides up from bottom), Android (activity animation), and web (no native animation; CSS transition should be added). This platform difference is cosmetic and acceptable.

## References

- PRD: Navigation Structure section (5 tabs, result overlay, roll wizard)
- PRD: Technical Architecture section (`app/` directory structure)
- PRD: Sharing section (`randsum.io/t/{template_id}` deep link)
- Expo Router docs: Tab navigator, Stack navigator, modal presentation, `useLocalSearchParams`
- ADR-001: State Management Topology (wizard state in Zustand, not in routes)
