# ADR-005: Design System & Theme Tokens

## Status

Accepted (implemented)

## Context

The RANDSUM Expo app targets iOS, Android, and Web from a single codebase and
must share a visual identity with `randsum.dev` / `randsum.io`. The TTRPG
audience expects a dark-mode-first interface, and the design must work across
React Native's `StyleSheet` system (no CSS-in-JS runtime) while remaining
compatible with Expo Web, where the `@randsum/dice-ui` components are themed via
CSS custom properties.

Without a token layer, light/dark switching would be scattered across every
component. A semantic token set keeps it a single-store concern.

## Decision

### Two token surfaces

The app has two coordinated token sources, because the screen mixes React Native
primitives with web dice-ui components:

1. **`lib/theme.ts`** — typed `ThemeTokens` consumed by React Native
   `StyleSheet` via `useTheme()` / `useThemeStore`. Holds `darkTokens` and
   `lightTokens` plus a `fontSizes` scale. `getTokens(mode)` returns the right
   map.
2. **`components/CSSTokens.web.tsx`** — injects `--dui-color-*` CSS custom
   properties onto `:root` and keeps `data-theme` on `<html>` in sync with
   `colorScheme`. These drive `@randsum/dice-ui`'s own theming on web.
   `components/CSSTokens.tsx` is a native no-op.

Both sets follow the Tailwind zinc neutral scale with a purple accent, matching
`randsum.dev`. The two surfaces are intentionally close but not byte-identical
(e.g. the RN `bg` is `#1a1a1f`; the CSS `--dui-color-bg` is `#09090b`), because
one themes RN chrome and the other themes the embedded dice-ui components.

### Semantic tokens (`lib/theme.ts`)

`ThemeTokens` defines: `bg`, `surface`, `surfaceAlt`, `border`, `text`,
`textMuted`, `textDim`, `accent`, `accentLow`, `accentHigh`, `error`, `success`.
Components read these through `useTheme()` rather than hard-coding hex values.

| Token | Dark (`darkTokens`) | Light (`lightTokens`) |
|---|---|---|
| `bg` | `#1a1a1f` | `#f4f4f6` |
| `surface` | `#222228` | `#ebebed` |
| `surfaceAlt` | `#2e2e35` | `#e4e4e7` |
| `border` | `#52525b` | `#a1a1aa` |
| `text` | `#fafafa` | `#18181b` |
| `textMuted` | `#a1a1aa` | `#3f3f46` |
| `textDim` | `#71717a` | `#71717a` |
| `accent` | `#a855f7` | `#7c3aed` |
| `accentLow` | `#2e1065` | `#f5f0ff` |
| `accentHigh` | `#d8b4fe` | `#5b21b6` |
| `error` | `#ef4444` | `#dc2626` |
| `success` | `#10b981` | `#059669` |

`textDim` (zinc-500) is the same in both modes — a serviceable midpoint for
placeholder/disabled text rather than two separate tokens.

### Dark-mode default

The theme store defaults to dark. `initThemeFromSystem()` (called once from
`app/_layout.tsx` with the React Native `useColorScheme()` value) applies the
system scheme on first launch when no explicit preference is set; after the user
toggles, the persisted `colorScheme` wins. See ADR-001.

### Typography

- **JetBrains Mono** — loaded via `@expo-google-fonts/jetbrains-mono`
  (`JetBrainsMono_400Regular`), gated through `useFonts` in `app/_layout.tsx` so
  it is available before first render. Used for notation and numeric dice values.
  On web it is also referenced as `--dui-font-mono` in the injected CSS.
- **System sans-serif** — `--dui-font-body` (`ui-sans-serif, system-ui,
  sans-serif`) for UI chrome; no bundle cost, native rendering per platform.

Font sizes are a stepped scale in `lib/theme.ts` (`fontSizes`): `xs` 11,
`sm` 13, `base` 15, `lg` 17, `xl` 22, `2xl` 32, `3xl` 48.

### Theme store implementation

`lib/stores/themeStore.ts` holds `colorScheme` plus the derived `tokens` and
`fontSizes`. `colorScheme` is persisted to AsyncStorage (`partialize` persists
only `colorScheme`; `tokens` are recomputed on rehydrate). Components read tokens
via the `useTheme()` hook (`hooks/useTheme.ts`) and build `StyleSheet` color
values from the live token map rather than module-level constants.

## Deferred — not implemented

- **Game-specific color accents** — earlier drafts defined a per-game
  `gameColors` map (Blades, 5e, Daggerheart, PbtA, Root, Salvage Union). No
  Games surface exists, and no such map ships. This is future work.

## Consequences

### Positive

- Visual consistency with the RANDSUM web ecosystem; dark-first matches TTRPG
  use.
- Semantic token layer makes light/dark a single-store concern — no per-component
  conditionals.
- JetBrains Mono gives clear notation readability and continuity with
  `randsum.dev`; system sans costs nothing in bundle size.

### Negative

- Two token surfaces (`lib/theme.ts` and `CSSTokens.web.tsx`) must be kept
  visually coherent by hand; they are deliberately not auto-derived from one
  source.
- StyleSheet color values must be built inside component bodies (not module-level
  constants), which is slightly less ergonomic but is the RN idiom for dynamic
  theming.

### Neutral

- Light mode is fully supported from day one because the token layer exists.

## References

- `lib/theme.ts` — `ThemeTokens`, `darkTokens`, `lightTokens`, `fontSizes`
- `lib/stores/themeStore.ts`, `hooks/useTheme.ts`
- `components/CSSTokens.web.tsx` — CSS custom-property injection
- `app/_layout.tsx` — font loading + theme init
- ADR-001: State Management Topology (the theme store)
