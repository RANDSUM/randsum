# @randsum/expo — Dice Playground (Web, iOS, Android)

Private Expo app powering `randsum.io` and the future native apps. See `PRD.md` for the full product spec (tabs, roll result overlay, history, templates, account).

See the root `CLAUDE.md` for monorepo-wide conventions. This file covers Expo-specific guidance only.

## Stack

- **Expo SDK 55** with **Expo Router** (file-based routing under `app/`)
- **React 19 / React Native 0.83 / react-native-web 0.21**
- **Zustand 5** for client state (`lib/stores/`) with `persist` + `createJSONStorage(AsyncStorage)`
- **@react-native-async-storage/async-storage** for persistence
- **JetBrainsMono_400Regular** via `@expo-google-fonts/jetbrains-mono` (required before render)
- **Workspace-linked**: `@randsum/roller`, `@randsum/dice-ui` (both `workspace:~`)
- **EAS project**: `d50b53cf-026b-45e8-823d-c96fb621a521` (slug `randsumapp`, owner `randsum`)
- **Web deploy target**: randsumapp.expo.app (EAS Hosting)

Supabase auth and TanStack Query from the PRD are not wired yet — they were removed in 2026-03-25 and will return later. Do not add them back without an explicit task.

## Directory Layout

```
apps/expo/
  app/                      # Expo Router (file-based)
    _layout.tsx             # Root layout — fonts, theme, Stack navigator, <Head>
    index.tsx               # Roll screen (notation roller + reference grid)
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
      themeStore.ts         # Persisted colorScheme + tokens (Zustand)
      notationStore.ts      # Current notation + validation state (Zustand)
    storage.ts              # AsyncStorage-backed key/value
    storage.web.ts          # localStorage variant
    storage.native.ts       # AsyncStorage variant
    theme.ts                # ColorScheme, ThemeTokens, fontSizes, getTokens()
    interpolate.ts          # Variable interpolation for templates
    parseRollResult.ts      # RollerRollResult -> ParsedRollResult
    sharing.ts              # Share URL builder
    types.ts
  types/dice-ui.d.ts        # Module augmentation for @randsum/dice-ui
  __tests__/                # bun:test (see Testing below)
  metro.config.js           # Workspace resolver + web conditions (load-bearing)
  bunfig.toml               # Preloads __tests__/setup.ts
  app.json, eas.json, tsconfig.json, package.json
```

## Commands

```bash
# Per-app (run from apps/expo or with --filter @randsum/expo)
bun run start                    # Expo dev server
bun run ios                      # Open iOS simulator
bun run android                  # Open Android emulator (requires ANDROID_HOME)
bun run web                      # Web dev server
bun run typecheck                # tsc --noEmit
bun run lint                     # ESLint (uses apps/expo/eslint.config.js)

# Tests run from the monorepo root via bun:test
bun test apps/expo               # Run expo tests with the preloaded setup

# EAS (from this directory)
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas deploy --prod                # Web deploy to randsumapp.expo.app
```

ANDROID_HOME must be set (see `memory/MEMORY.md` — installed at `~/Library/Android/sdk`).

## Metro Resolver — Load-Bearing

`metro.config.js` contains two critical configurations. Changes here are high-risk; verify with `bun run web` and a native build before landing.

### 1. Workspace TypeScript source resolution

Metro resolves `@randsum/*` imports directly to TS source in the monorepo rather than built `dist/` output. This avoids needing a prebuild step on EAS. All workspace subpaths are enumerated explicitly in the `resolveRequest` function. **If a new subpath is added to `@randsum/roller` or `@randsum/dice-ui`, it must be added to this map.**

The `@randsum/dice-ui` mapping forks by platform:

- Web -> `packages/dice-ui/src/index.ts` (react-dom components)
- Native -> `packages/dice-ui/src/index.native.ts` (React Native components)

### 2. Web condition fix (Zustand / CJS-gated packages)

```js
config.resolver.unstable_conditionsByPlatform = {
  web: ["browser", "react-native"]
}
```

This forces Metro's web bundler to resolve packages like Zustand to their CJS entries. Zustand's ESM entry uses `import.meta.env.MODE`, which is invalid in classic script contexts that Metro emits. Without this line, web builds error at runtime. Do not remove.

## Path Aliases and Imports

- No TS path aliases beyond `@randsum/dice-ui` -> `./types/dice-ui.d.ts` (module augmentation only — actual resolution happens in Metro).
- Imports within `apps/expo` use relative paths (`../components/...`, `../lib/...`).
- The app is excluded from the monorepo ESLint config (`'apps/expo/**'` ignore); a local `eslint.config.js` owns the app's lint rules.

## Platform-Specific Files

`.web.tsx` / `.native.tsx` suffixes are picked up by Metro and by `metro.config.js`'s dice-ui fork. Use them for:

- Components that need DOM APIs on web (`CSSTokens.web.tsx`).
- Storage backends (`storage.web.ts` vs `storage.native.ts`).

When adding a new platform-specific file, keep the default (`.ts` / `.tsx`) as the native variant or a shared implementation, and introduce `.web.*` only when the web path genuinely diverges.

## `"use dom"` Strategy for `@randsum/dice-ui`

Some dice-ui components (`NotationRoller`, `QuickReferenceGrid`, `TokenOverlayInput`) rely on `react-dom` APIs — CSS imports, `className`, `getBoundingClientRect`. The plan from the PRD:

1. **Web target**: use the components directly (react-dom is already available).
2. **Native target**: use Expo's `"use dom"` directive on wrapping components to render them inside a WebView. This is the default escape hatch today.
3. **Port to native**: if WebView performance becomes a blocker, produce `.native.tsx` variants using `TextInput`, `View`, `StyleSheet`.

The Metro resolver already routes `@randsum/dice-ui` to `index.native.ts` on native. Confirm that export surface before porting.

## State Management

- **Theme**: `lib/stores/themeStore.ts` — persisted `colorScheme`, derived `tokens`, derived `fontSizes`. `initThemeFromSystem()` is called once from `_layout.tsx` with the system `useColorScheme()` value. Persisted layer uses `partialize` to store only `colorScheme`; tokens are recomputed on rehydrate.
- **Notation**: `lib/stores/notationStore.ts` — current notation string plus derived `isValid` / `hasError` from `isDiceNotation()`. Not persisted.
- **Roll result**: local `useState` in `app/index.tsx`. The PRD calls for a history feed backed by AsyncStorage / SQLite; not implemented yet.

## Testing

- Framework: `bun:test` with `./__tests__/setup.ts` preloaded via `bunfig.toml`.
- Setup mocks `@react-native-async-storage/async-storage` and a minimal subset of `react-native` (`useColorScheme`, `StyleSheet.create`, `Share.share`). Add to the mock when you need more from RN.
- Hook tests assert module contract (export exists, is callable). Full hook behavior is tested at the store level rather than through `renderHook` to avoid a full React Native test renderer.
- Run a single file: `bun test apps/expo/__tests__/useRoll.test.ts`.

## How to Add a New Screen

1. Create the file under `app/` following Expo Router conventions. A tab screen goes under `app/(tabs)/<name>.tsx`; a modal under `app/<name>.tsx` with `presentation: 'modal'` in the route options.
2. Register it in the relevant `_layout.tsx` `<Stack.Screen name="<name>" />` (or it gets default options).
3. Read shared state via hooks from `hooks/` or stores from `lib/stores/`. Do not import Zustand directly into screens unless it's a trivial local store.
4. Use `useTheme()` for tokens and `Platform.OS` for platform forks. Both web and native must render.
5. Add a test in `__tests__/` if there is logic beyond wiring — focus on store interactions, not rendering.

## How to Wire a New Store

1. Create `lib/stores/<name>Store.ts`. Export an interface with `readonly` fields and action methods with explicit return types (`setX(x: X): void`).
2. Use `create<State>()(set, get => ({ ... }))`. Wrap with `persist(..., { name: 'zustand/<name>', storage: createJSONStorage(() => AsyncStorage), partialize })` only if the state must survive reloads.
3. Do not store derived data that can be recomputed cheaply at the selector site — but tokens are stored because `getTokens()` is branch-heavy and the tokens object is read on every render.
4. Export a selector-friendly hook: consumers should call `useXStore(s => s.field)` rather than pulling the whole state.
5. If the store needs to be seeded from platform APIs (e.g. `useColorScheme`), expose an initializer function (`initXFromSystem`) that the root `_layout.tsx` calls inside a `useEffect`.

## Known Gotchas

- **Supabase was removed.** The PRD references it but there is no client. Re-adding requires product sign-off.
- **TanStack Query is not installed.** Do not add it for ad-hoc data fetching without a task.
- **`"use dom"`** requires specific Expo configuration and only works on Expo SDK 54+. It is our fallback for dice-ui parity on native, not a general-purpose escape hatch.
- **`metro.config.js` is untyped JS.** Changes there do not surface in `bun run typecheck`. Verify by running `bun run web` after edits.
- **Web bundler is Metro**, not Vite/webpack. Some Metro-specific behaviors (condition sets, `resolveRequest`) have no equivalent in other bundlers. Do not copy-paste resolver patches from other Expo projects without understanding `unstable_conditionsByPlatform`.
- **Fonts must load before rendering.** `_layout.tsx` returns `null` until `useFonts` reports loaded, so anything that races the splash screen will fail silently.

## Cross-References

- Product spec: `apps/expo/PRD.md`
- Core engine: `packages/roller/CLAUDE.md`
- Game wrappers: `packages/games/CLAUDE.md`
- UI components: `packages/dice-ui/CLAUDE.md`
- Monorepo conventions: root `CLAUDE.md`
