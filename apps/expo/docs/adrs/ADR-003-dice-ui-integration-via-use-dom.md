# ADR-003: dice-ui Integration via Metro Platform Fork

## Status

Accepted (implemented for web; native parity is future work)

## Context

The single screen (`app/index.tsx`) needs RANDSUM's notation UI to match
`randsum.io`. It uses `@randsum/dice-ui` components directly: `NotationRoller`,
`QuickReferenceGrid`, `RollResultPanel`, and `DocModal`.

These components are built for the web. They depend on `react-dom` APIs,
`className` / CSS, DOM measurement (`getBoundingClientRect`), and CSS custom
properties for theming — none of which exist in React Native. The question was
how to consume one workspace package (`@randsum/dice-ui`) across web and native
without maintaining two import sites in the app.

An earlier draft proposed wrapping dice-ui in an Expo `"use dom"` WebView
component to get native parity on day one. That approach was **not adopted** (see
below).

## Decision

### Import `@randsum/dice-ui` directly; fork the package by platform in Metro

The app imports dice-ui components straight into `app/index.tsx` — no WebView
wrapper, no bridge. Platform divergence is handled entirely by the Metro
resolver in `metro.config.js`, which maps `@randsum/dice-ui` to a different
entry point per platform:

```js
'@randsum/dice-ui': path.resolve(
  monorepoRoot,
  platform === 'web'
    ? 'packages/dice-ui/src/index.ts'        // react-dom components
    : 'packages/dice-ui/src/index.native.ts' // React Native components
)
```

The resolver also maps `@randsum/dice-ui` (and `@randsum/roller` subpaths) to
TypeScript **source** in the monorepo rather than built `dist/` output, so EAS
needs no prebuild step. tsc typechecks against the native entry via a tsconfig
`paths` mapping plus `moduleSuffixes: [".native", ""]`.

A second resolver setting is load-bearing for web:

```js
config.resolver.unstable_conditionsByPlatform = {
  web: ['browser', 'react-native']
}
```

This forces Metro's web bundler to resolve packages like Zustand to their CJS
entries (Zustand's ESM entry uses `import.meta.env.MODE`, invalid in the classic
script contexts Metro emits).

### Web is the real target today

On web the direct import works exactly as `randsum.io` does: `react-dom` is
available, CSS custom properties drive theming (injected by
`components/CSSTokens.web.tsx`), and `app/index.tsx` lays the roller and
reference grid out in a desktop two-column / mobile single-column shell.

### Native: resolves, but parity is not built

On native, Metro routes to `packages/dice-ui/src/index.native.ts`. The app also
ships a React Native result panel (`components/RollResultView.tsx`) used in place
of the web `RollResultPanel` inside the result modal, and fires
`expo-haptics` success feedback on roll (native only). Full native parity for the
dice-ui surface is **future work**, not currently built out.

### Considered but not adopted: Expo `"use dom"`

Wrapping dice-ui in a `"use dom"` WebView component was evaluated. It was
rejected as the integration mechanism because:

- The Metro platform fork already lets the app import one package name and get
  the right implementation per platform, with zero WebView indirection on web.
- WebView round-trips add input latency to notation typing, the app's hot path.
- A serialization-only props bridge (no refs, no `React.ReactNode`) is a standing
  constraint on the component API.

`"use dom"` remains an option for a future native-parity push, but it is not the
chosen approach and no `"use dom"` component exists in the app.

## Consequences

### Positive

- One import site in the app; the platform decision lives in one resolver file.
- Web has zero-overhead, 1:1 parity with `randsum.io` — direct component usage.
- Resolving to TS source avoids a dice-ui/roller build step on EAS.

### Negative

- `metro.config.js` is untyped JS, so resolver changes do not surface in
  `bun run typecheck` — they must be verified with `bun run web` and a native
  build. New `@randsum/*` subpaths must be added to the resolver map by hand.
- Native parity for the dice-ui surface is unfinished; the screen is effectively
  a web-first experience today.

### Neutral

- `@randsum/dice-ui` is an app runtime dependency via `workspace:~`, consistent
  with how the web site consumes it.

## References

- `apps/expo/metro.config.js` — platform fork + web condition set (load-bearing)
- `packages/dice-ui/src/index.ts`, `packages/dice-ui/src/index.native.ts`
- `app/index.tsx` — direct dice-ui usage
- `components/RollResultView.tsx` — native result panel
- `apps/expo/CLAUDE.md` — Metro resolver and dice-ui integration notes
