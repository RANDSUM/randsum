# @randsum/expo — Dice Playground (Web, iOS, Android)

Private Expo app powering the web playground at `randsumapp.expo.app` plus native
builds. See the root `CLAUDE.md` for monorepo-wide conventions; this file covers
Expo-specific guidance only.

## Current State — Read This First

The app is a **single-screen prototype**. The entire UI is `app/index.tsx`
(a notation roller + quick-reference grid + roll-result panel) under
`app/_layout.tsx`. **None of the following exist yet:** tabs, a roll-history
feed, templates, game-specific rollers, accounts/auth, Supabase, SQLite, or
TanStack Query. Document and build against current reality.

## Stack

- **Expo SDK 56** with **Expo Router** (file-based routing under `app/`)
- **React 19 / React Native 0.85 / react-native-web 0.21**
- **Zustand 5** for client state (`lib/stores/`) — `themeStore` (persisted via
  `persist` + `createJSONStorage(AsyncStorage)`) and `notationStore` (not persisted)
- **AsyncStorage 2** for persistence
- **JetBrainsMono_400Regular** via `@expo-google-fonts/jetbrains-mono` (loaded
  before first render)
- **Workspace-linked**: `@randsum/roller`, `@randsum/dice-ui` (both `workspace:~`)
- **Web deploy target**: randsumapp.expo.app (EAS Hosting)

Supabase / cloud sync (referenced in `.env.example`) was removed 2026-03-25 and
is **not wired**. Do not re-add it without an explicit task.

## Directory Layout

```
apps/expo/
  app/                      # Expo Router (file-based) — the whole app
    _layout.tsx             # Root layout — fonts, theme init, Stack navigator
    index.tsx               # The single screen (notation roller + reference grid)
  components/               # UI — one file per component
    CSSTokens.tsx           # Native no-op
    CSSTokens.web.tsx       # Injects CSS custom properties on web
    RollResultView.tsx      # Native result panel
    WebHeader.tsx           # Web-only header bar
  hooks/
    useRoll.ts              # Wraps roll() + mounted-guarded state
    useTheme.ts             # Reads from themeStore
  lib/
    stores/
      themeStore.ts         # Persisted colorScheme + derived tokens (Zustand)
      notationStore.ts      # Current notation + validation state (Zustand)
    storage.ts              # Re-exports the web storage implementation
    storage.web.ts          # localStorage-backed implementation
    theme.ts                # ColorScheme, ThemeTokens, fontSizes, getTokens()
    interpolate.ts          # Variable interpolation helper
    parseRollResult.ts      # RollResult -> ParsedRollResult
    sharing.ts              # Share URL builder (?n= notation)
    types.ts
  docs/                     # Component/store/data-layer notes + ADRs (docs/adrs/)
  __tests__/                # bun:test (see Testing)
  metro.config.js           # Workspace resolver + web conditions (load-bearing)
  bunfig.toml               # Preloads __tests__/setup.ts
  app.json, eas.json, tsconfig.json, package.json
```

## Commands

```bash
# Per-app (from apps/expo or with --filter @randsum/expo)
bun run start                    # Expo dev server
bun run ios                      # Open iOS simulator
bun run android                  # Open Android emulator (requires ANDROID_HOME)
bun run web                      # Web dev server
bun run typecheck                # tsc --noEmit
bun run lint                     # ESLint (uses apps/expo/eslint.config.js)
bun run check                    # typecheck + format:check + lint + test

# Tests (bun:test, preloaded setup via bunfig.toml)
bun test apps/expo               # All expo tests
bun test apps/expo/__tests__/useRoll.test.ts   # Single file

# E2E (Playwright, web only)
bun run e2e:build                # expo export --platform web
bun run test:e2e                 # playwright test

# EAS (from this directory)
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas deploy --prod                # Web deploy to randsumapp.expo.app
```

ANDROID_HOME must be set for Android builds.

## Metro Resolver — Load-Bearing

`metro.config.js` contains two critical configurations. Changes here are
high-risk; verify with `bun run web` and a native build before landing.

### 1. Workspace TypeScript source resolution

Metro resolves `@randsum/*` imports directly to TS source in the monorepo rather
than built `dist/` output — avoiding a prebuild step on EAS. All workspace
subpaths are enumerated explicitly in `resolveRequest`. **If a new subpath is
added to `@randsum/roller` or `@randsum/dice-ui`, add it to this map.**

The `@randsum/dice-ui` mapping forks by platform:

- Web → `packages/dice-ui/src/index.ts` (react-dom components)
- Native → `packages/dice-ui/src/index.native.ts` (React Native components)

### 2. Web condition fix (Zustand / CJS-gated packages)

```js
config.resolver.unstable_conditionsByPlatform = {
  web: ["browser", "react-native"]
}
```

Forces Metro's web bundler to resolve packages like Zustand to their CJS entries.
Zustand's ESM entry uses `import.meta.env.MODE`, invalid in the classic script
contexts Metro emits. Without this line, web builds error at runtime. Do not remove.

## Path Aliases and Imports

- `@randsum/dice-ui` resolves via a tsconfig `paths` mapping to
  `../../packages/dice-ui/src/index.native.ts`. Combined with
  `"moduleSuffixes": [".native", ""]`, tsc typechecks the app against dice-ui's
  actual native component types — no hand-maintained shim. Runtime resolution
  still happens in Metro (web → `index.ts`, native → `index.native.ts`).
- Imports within `apps/expo` use relative paths (`../components/...`, `../lib/...`).
- The app is excluded from the monorepo ESLint config; a local `eslint.config.js`
  owns the app's lint rules.

## Platform-Specific Files

`.web.tsx` / `.native.tsx` suffixes are picked up by Metro and the dice-ui fork.
Used for:

- Components needing DOM APIs on web (`CSSTokens.web.tsx`).
- Storage backends (`storage.web.ts`, re-exported by `storage.ts`).

When adding a platform-specific file, keep the default (`.ts` / `.tsx`) as the
native/shared variant and introduce `.web.*` only when the web path diverges.

## `@randsum/dice-ui` Integration

The screen uses dice-ui components (`NotationRoller`, `QuickReferenceGrid`,
`RollResultPanel`, `DocModal`) that rely on `react-dom` APIs (CSS imports,
`className`, `getBoundingClientRect`). On web these are used directly. On native,
the Metro resolver routes to `index.native.ts`; full native parity (Expo
`"use dom"` WebView wrappers, or hand-ported `.native.tsx` variants) is future
work, not currently built out.

## State Management

- **Theme**: `lib/stores/themeStore.ts` — persisted `colorScheme`, derived
  `tokens` and `fontSizes`. `initThemeFromSystem()` is called once from
  `_layout.tsx` with the system `useColorScheme()` value. `partialize` persists
  only `colorScheme`; tokens are recomputed on rehydrate.
- **Notation**: `lib/stores/notationStore.ts` — current notation string plus
  derived `isValid` / `hasError` from `isDiceNotation()`. Not persisted.
- **Roll result**: local `useState` in `app/index.tsx`. (No history feed exists.)

## Testing

- Framework: `bun:test` with `./__tests__/setup.ts` preloaded via `bunfig.toml`.
- Setup mocks `@react-native-async-storage/async-storage` and a minimal subset of
  `react-native` (`useColorScheme`, `StyleSheet.create`, `Share.share`). Extend
  the mock when you need more from RN.
- Hook tests assert module contract; behavior is tested at the store level rather
  than via `renderHook`, avoiding a full RN test renderer.
- A separate Playwright e2e suite runs against the exported web build
  (`e2e/`, `test:e2e`).

## How to Wire a New Store

1. Create `lib/stores/<name>Store.ts`. Export an interface with `readonly` fields
   and action methods with explicit return types (`setX(x: X): void`).
2. Use `create<State>()((set, get) => ({ ... }))`. Wrap with
   `persist(..., { name: 'zustand/<name>', storage: createJSONStorage(() => AsyncStorage), partialize })`
   only if the state must survive reloads.
3. Don't store derived data that can be recomputed cheaply at the selector site —
   but `themeStore` stores `tokens` because `getTokens()` is branch-heavy and read
   on every render.
4. Export a selector-friendly hook so consumers call `useXStore(s => s.field)`
   rather than pulling whole state.
5. If the store seeds from platform APIs (e.g. `useColorScheme`), expose an
   initializer (`initXFromSystem`) called from `_layout.tsx` inside a `useEffect`.

## Known Gotchas

- **`metro.config.js` is untyped JS.** Changes there do not surface in
  `bun run typecheck`. Verify by running `bun run web` after edits.
- **Web bundler is Metro**, not Vite/webpack. Metro-specific behaviors (condition
  sets, `resolveRequest`) have no equivalent elsewhere — don't copy resolver
  patches from other Expo projects without understanding
  `unstable_conditionsByPlatform`.
- **Fonts must load before rendering.** `_layout.tsx` returns `null` until
  `useFonts` reports loaded, so anything racing the splash screen fails silently.
- **Supabase / TanStack Query are not installed.** Do not add them for ad-hoc
  needs without a task.

## Cross-References

- ADRs: `apps/expo/docs/adrs/`
- Core engine: `packages/roller/CLAUDE.md`
- UI components: `packages/dice-ui/CLAUDE.md`
- Monorepo conventions: root `CLAUDE.md`
