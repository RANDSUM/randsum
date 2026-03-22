# ADR-003: dice-ui Integration via "use dom"

## Status

Proposed

## Context

The RANDSUM Advanced Mode notation input must match `playground.randsum.dev` as closely as possible. The playground is built with `@randsum/dice-ui`, which provides:

- `TokenOverlayInput` — a notation text field with color-coded token highlighting rendered as overlapping HTML elements
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

Advanced Mode's `NotationInput` component wraps `@randsum/dice-ui`'s `TokenOverlayInput` using the `"use dom"` directive. This gives:
- Literal 1:1 feature parity with the playground on day one
- No duplication of token highlight logic
- A single source of truth for notation rendering

The `"use dom"` file lives at `components/NotationInput.tsx` and is marked at its top line:

```tsx
'use dom'

import { TokenOverlayInput } from '@randsum/dice-ui'
// ... props bridge
```

On iOS and Android, Expo renders this in a transparent WebView. The component communicates with the native shell via props (passed in) and callbacks (passed in as serializable event handlers). The bridge supports JSON-serializable values only — no functions with closures, no React refs crossing the boundary.

The event boundary means the `NotationInput` communicates with native code via two callbacks:
- `onNotationChange(notation: string)` — fires on each keystroke; native side validates and updates `useNotationStore`
- `onSubmit()` — fires when the user taps the submit button inside the DOM component

### Prop bridge constraints

Because props cross a WebView boundary, they must be JSON-serializable:
- `notation: string` — current notation value (controlled input pattern)
- `isValid: boolean` — validation state, passed down so the component can style itself
- `onNotationChange: (notation: string) => void` — serialized as a message channel call
- `onSubmit: () => void` — serialized as a message channel call

No `React.ReactNode` children, no function props with complex closures, no `ref` forwarding across the boundary.

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

## Consequences

### Positive

- Advanced Mode ships on day one with full feature parity with the playground — no separate notation highlight implementation.
- The token highlight logic in `@randsum/dice-ui` is maintained in one place. Bug fixes to the playground's notation rendering automatically improve the app.
- Web target gets zero-overhead direct component usage.
- The `.native.tsx` fallback path is well-defined and does not require an ADR revision to pursue.

### Negative

- WebView communication adds latency to the props bridge. If a user types faster than the bridge round-trips, there may be visible lag in token highlighting on low-end native devices. This is the primary risk.
- Debugging issues in the `"use dom"` component on native requires inspecting WebView internals, which is less ergonomic than native React Native debugging.
- The prop bridge constraint (JSON-serializable only) means any future enhancement to `NotationInput` that requires passing React nodes or refs across the boundary will require a redesign.
- The `RollResultPanel` from dice-ui is not reused in the app — its visual design must be reproduced in React Native. This means any dice-ui updates to the result panel layout require manual porting to the native component.

### Neutral

- `@randsum/dice-ui` becomes a runtime dependency of the Expo app (`apps/expo/package.json`), linked via `workspace:~`. This is consistent with how the playground consumes it.
- The `"use dom"` WebView is loaded from the app bundle, not from a remote URL. There is no network dependency for the Advanced Mode input.
- Theming: CSS custom properties set in the WebView's root do not inherit from the native app's theme store. The `"use dom"` component receives theme tokens as props (`accentColor`, `bgColor`, etc.) and applies them via inline styles or a style tag injected into the WebView document.

## References

- PRD: dice-ui Strategy section (three-step strategy: use dom → port if needed → direct on web)
- PRD: Advanced Mode screen specification
- Expo docs: DOM Components (`"use dom"` directive, SDK 55)
- `apps/playground/` — dice-ui usage on web (reference implementation)
- `@randsum/dice-ui` — `TokenOverlayInput`, `RollResultPanel` components
