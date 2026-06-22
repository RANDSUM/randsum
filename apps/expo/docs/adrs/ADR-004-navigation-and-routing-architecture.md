# ADR-004: Navigation and Routing Architecture

## Status

Accepted (single screen implemented; multi-screen structure is future work)

## Context

The app needs a navigation framework even though it currently has just one
screen. Earlier drafts described a five-tab navigator with a `(tabs)` group,
modal routes for a roll-result overlay and a four-step roll wizard, and a
`t/[id]` deep link for shared templates. **None of those screens or routes
exist.** This ADR is trimmed to the routing that actually ships and the
convention for growing it.

## Decision

### Expo Router, file-based routing

The app uses **Expo Router** (`expo-router`), the mandated file-based navigation
framework. Routes map to files under `app/`. Today the entire route tree is:

```
app/
  _layout.tsx   # Root layout — font loading, theme init, Stack with one screen
  index.tsx     # The single screen (notation roller + reference grid + result modal)
```

`app/_layout.tsx` loads JetBrains Mono, seeds the theme store from the system
color scheme, injects web SEO `<Head>` tags and CSS tokens, and renders a
`Stack` with a single screen:

```tsx
<Stack>
  <Stack.Screen name="index" options={{ headerShown: false }} />
</Stack>
```

### The result "modal" is in-screen state, not a route

When a roll completes, `app/index.tsx` stores the result in local `useState` and
renders a React Native `<Modal>` over the screen. It is **not** an Expo Router
modal route — there is no `result.tsx`. On web, Escape and backdrop tap dismiss
it, with focus management handled inline.

### Web URL state via query param, not routes

The screen seeds its notation from a `?n=` query param on web and writes it back
with a debounced `history.replaceState` (see `lib/sharing.ts`). This is plain
URL/query manipulation, not Expo Router navigation — there is one route.

### How the structure grows

As screens are added, each becomes a file under `app/`. Tab groups, modal
routes, and deep links can be introduced when there are actually multiple
destinations to navigate between, each behind its own decision record. They are
not pre-built.

## Deferred — not implemented

The following from earlier specs do **not** exist and should not be treated as
the routing model:

- A `(tabs)` group or five-tab navigator (`index`, `games`, `saved`, `history`,
  `account`).
- `app/result.tsx` and `app/wizard.tsx` modal routes (the result is in-screen
  state; there is no wizard).
- A `useRollResultStore` / `useWizardStore`, or `router.push('/result')` /
  `router.push('/wizard')` flows.
- A `t/[id]` template deep link.
- `serializeRollResult` / route-param serialization of roll results.
- A Simple/Advanced mode toggle within a Roll tab.

(`lib/parseRollResult.ts` exists, but only as the `ParsedRollResult` type plus a
parser used by the single screen — not as route-param serialization.)

## Consequences

### Positive

- Expo Router gives file-based routing and web URL generation for free, ready to
  grow without swapping frameworks.
- A single `Stack` screen is the minimum viable structure — no navigator
  ceremony for a one-screen app.

### Negative

- Because routing is trivial today, the conventions for tabs/modals/deep links
  are unproven in this codebase and will need to be established when the second
  screen lands.

### Neutral

- `app.json` declares a `randsum` URL scheme and an `https` association, but no
  deep-link routes consume them yet.

## References

- `app/_layout.tsx`, `app/index.tsx`
- `lib/sharing.ts` — `?n=` notation query param
- Expo Router docs: file-based routing, Stack navigator
