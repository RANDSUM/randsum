# ADR-003: dice-ui Integration via "use dom"

## Status

Proposed

## Context

The RANDSUM Advanced Mode notation input must match `randsum.io` as closely as possible. The playground is built with `@randsum/dice-ui`, which provides:

- `NotationRoller` — the top-level component that owns notation input, token highlighting, validation feedback, and roll dispatch. It wraps `TokenOverlayInput` internally; `TokenOverlayInput` is an internal implementation detail, not the public API surface.
- `RollResultPanel` — a structured breakdown of dice results with modifier steps
- Token chip components driven by CSS `className` and inline style props
- Layout that depends on `getBoundingClientRect` for token position calculation

These components are built for the web. They depend on:
- `react-dom` APIs (`ReactDOM.createPortal`, `flushSync`)
- CSS class names and `className` prop (not `StyleSheet`)
- DOM measurement APIs (`getBoundingClientRect`, `ResizeObserver`)
- CSS custom properties for theming

None of these APIs exist in React Native. `className` is not a valid prop on `View` or `Text`. `getBoundingClientRect` does not exist on the `ref` returned by React Native components. Porting `@randsum/dice-ui` to native would require rewriting every component against React Native primitives, duplicating layout logic, and maintaining two implementations indefinitely.

Expo's `"use dom"` directive (introduced in Expo SDK 51, stable in SDK 55) allows a React component file to declare itself a DOM component. On native platforms, Expo wraps it in a WebView proxy, communicating via a structured bridge. On web, the file is loaded as a normal React component with direct DOM access.

The question is: use `"use dom"` to ship dice-ui on native via WebView, or rewrite native-specific variants from the start?

## Decision

### Start with `"use dom"` for dice-ui components

Advanced Mode's `NotationInput` component wraps `@randsum/dice-ui`'s `NotationRoller` using the `"use dom"` directive. This gives:
- Literal 1:1 feature parity with the playground on day one
- No duplication of token highlight logic
- A single source of truth for notation rendering

The `"use dom"` file lives at `components/NotationInput.tsx` and is marked at its top line:

```tsx
'use dom'

import { NotationRoller } from '@randsum/dice-ui'
// ... props bridge
```

On iOS and Android, Expo renders this in a transparent WebView. The component communicates with the native shell via props (passed in) and callbacks (passed in as serializable event handlers). The bridge supports JSON-serializable values only — no functions with closures, no React refs crossing the boundary.

### Prop bridge — aligned with `NotationRollerProps`

`NotationRoller` accepts the following props (from `packages/dice-ui/src/NotationRoller.tsx`):

```typescript
interface NotationRollerProps {
  readonly defaultNotation?: string
  readonly notation?: string        // controlled input
  readonly className?: string
  readonly onChange?: (notation: string) => void
  readonly resetToken?: number      // increment to trigger an uncontrolled reset
  readonly renderActions?: (notation: string) => React.ReactNode
  readonly onRoll?: (result: RollResult) => void
}
```

The `"use dom"` bridge exposes a subset of these — only JSON-serializable values cross the WebView boundary:

| Prop | Type | Direction | Notes |
|------|------|-----------|-------|
| `notation` | `string` | native → DOM | Controlled input value |
| `resetToken` | `number` | native → DOM | Increment to reset the input |
| `onChange` | `(notation: string) => void` | DOM → native | Fires on each keystroke; native updates `useNotationStore` |
| `onRoll` | `(result: RollResult) => void` | DOM → native | Fires after a successful roll; `result` is `{ total, records, notation }`, fully JSON-serializable |

Props not bridged: `className` (no CSS in native), `renderActions` (returns `React.ReactNode`, not serializable). The ROLL button inside `NotationRoller` is the only roll trigger — the native shell does not need a separate submit path.

No `React.ReactNode` children, no function props with complex closures, no `ref` forwarding across the boundary.

### Theming: seeding the DOM component's theme store

`NotationRoller` resolves its theme by reading the `data-theme` attribute on `document.documentElement` via a `MutationObserver` (see `packages/dice-ui/src/useTheme.ts`). When the attribute is `"light"`, the component uses light-mode token colors; otherwise it defaults to dark.

Inside the `"use dom"` component, the native app's theme preference is passed as a prop (`theme: 'light' | 'dark'`). On mount and on prop change, the `"use dom"` component sets the attribute on the WebView's `document.documentElement`:

```typescript
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
}, [theme])
```

This bridges the native `useThemeStore` into `dice-ui`'s internal theme mechanism without requiring any changes to `@randsum/dice-ui`. The WebView document is isolated from the native app's DOM — setting `data-theme` on it does not affect the native shell.

### Web target uses dice-ui directly

On Expo Web, `"use dom"` components are rendered as regular React components — there is no WebView indirection. `react-dom` is available and the component works without a bridge. The behavior is identical to the playground.

Platform detection is Expo's responsibility. The same `components/NotationInput.tsx` file works on all three platforms without conditional logic in the component itself.

### Native fallback path: `.native.tsx` platform extensions

If WebView performance is unacceptable in production — measured as perceptible input lag during notation typing on a mid-range Android device — the fallback is a `.native.tsx` platform-specific variant:

```
components/NotationInput.tsx         ← "use dom" version (web + native via WebView)
components/NotationInput.native.tsx  ← React Native TextInput version (native only)
```

Metro bundler resolves `.native.tsx` over `.tsx` on iOS and Android. The `.native.tsx` variant implements the same prop interface using React Native's `TextInput`, custom `Text` spans for token highlighting (approximated), and `StyleSheet`. It does not use dice-ui at all.

This fallback is explicitly **not built in the initial sprint**. It is noted here so developers know the escape hatch exists and can begin implementing it if WebView performance proves inadequate during QA.

### `RollResultPanel` (result overlay) — native-first from the start

The roll result overlay (`components/RollResultView.tsx`) is built as a React Native component from the start, not using `"use dom"`. The rationale: the result overlay is full-screen, animated (slide-up, number spin), and integrates deeply with React Native's gesture and animation systems (`Animated`, `PanResponder` or `react-native-reanimated`). Attempting to animate a WebView-hosted component with native gesture coordination is not practical.

The `RollResultPanel` from dice-ui is used as a **reference implementation only**. The native component reproduces its visual structure (total, breakdown, notation, actions) using React Native primitives.

### Metro + ESM compatibility risk

The spike validated `@randsum/roller` with Metro's bundler. It did **not** validate `@randsum/dice-ui` or any `@randsum/games` subpath imports. Both packages are ESM-only with subpath exports.

Metro requires `resolver.unstable_enablePackageExports: true` in `metro.config.js` to resolve `exports`-field subpaths correctly. Without it, imports like `@randsum/dice-ui` or `@randsum/games/blades` will fail to resolve at bundle time.

The current `apps/expo/metro.config.js` must verify this flag is set:

```javascript
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.resolver.unstable_enablePackageExports = true

module.exports = config
```

Additional risks to validate before shipping Advanced Mode:
- `@randsum/dice-ui` imports `react-dom` — Metro must not attempt to bundle `react-dom` for the native target (it is only used inside the `"use dom"` WebView). This is handled by Expo's `"use dom"` build transform, but should be confirmed.
- `@randsum/games` subpath imports (e.g. `@randsum/games/blades`) depend on the same `unstable_enablePackageExports` flag. If game rollers are added in the same story as Advanced Mode, test both import paths before closing the story.

## Consequences

### Positive

- Advanced Mode ships on day one with full feature parity with the playground — no separate notation highlight implementation.
- The token highlight logic in `@randsum/dice-ui` is maintained in one place. Bug fixes to the playground's notation rendering automatically improve the app.
- Web target gets zero-overhead direct component usage.
- The `.native.tsx` fallback path is well-defined and does not require an ADR revision to pursue.
- The `data-theme` theming mechanism requires no changes to `@randsum/dice-ui` — the WebView attribute is the existing hook.

### Negative

- WebView communication adds latency to the props bridge. If a user types faster than the bridge round-trips, there may be visible lag in token highlighting on low-end native devices. This is the primary risk.
- Debugging issues in the `"use dom"` component on native requires inspecting WebView internals, which is less ergonomic than native React Native debugging.
- The prop bridge constraint (JSON-serializable only) means any future enhancement to `NotationInput` that requires passing React nodes or refs across the boundary will require a redesign.
- The `RollResultPanel` from dice-ui is not reused in the app — its visual design must be reproduced in React Native. This means any dice-ui updates to the result panel layout require manual porting to the native component.
- Metro's ESM/subpath-export support is gated behind an unstable resolver flag. If Metro stabilizes a different API surface in a future Expo SDK, the `metro.config.js` will need updating.

### Neutral

- `@randsum/dice-ui` becomes a runtime dependency of the Expo app (`apps/expo/package.json`), linked via `workspace:~`. This is consistent with how the playground consumes it.
- The `"use dom"` WebView is loaded from the app bundle, not from a remote URL. There is no network dependency for the Advanced Mode input.

## References

- PRD: dice-ui Strategy section (three-step strategy: use dom → port if needed → direct on web)
- PRD: Advanced Mode screen specification
- Expo docs: DOM Components (`"use dom"` directive, SDK 55)
- `apps/playground/` — dice-ui usage on web (reference implementation)
- `packages/dice-ui/src/NotationRoller.tsx` — `NotationRollerProps` interface, `RollResult` type
- `packages/dice-ui/src/useTheme.ts` — `data-theme` attribute mechanism
- Expo Metro docs: `resolver.unstable_enablePackageExports`
