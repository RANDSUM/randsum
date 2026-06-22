# @randsum/expo — Dice Playground

The cross-platform RANDSUM dice playground (web + iOS + Android), built with
**Expo SDK 56** and Expo Router. The web build powers the public playground at
[randsumapp.expo.app](https://randsumapp.expo.app).

> **Private app.** Not published to npm. Web deploys to EAS Hosting; native
> builds run on EAS Build. See [`apps/DEPLOY.md`](../DEPLOY.md) for deploy,
> rollback, and DR.

## Current State

The app is a **single screen** (`app/index.tsx`): a notation roller plus a
quick-reference grid, backed by the `@randsum/dice-ui` components. There are no
tabs, history, templates, accounts, or cloud sync yet.

## Stack

- Expo SDK 56, React 19 / React Native 0.85, react-native-web
- Expo Router 56 (file-based routing under `app/`)
- Zustand 5 (client state) + AsyncStorage 2 (persistence)
- JetBrains Mono via `@expo-google-fonts/jetbrains-mono`
- Workspace-linked `@randsum/roller` and `@randsum/dice-ui`

## Commands

```bash
bun run --filter @randsum/expo start        # Expo dev server
bun run --filter @randsum/expo web          # Web dev server
bun run --filter @randsum/expo ios          # iOS simulator
bun run --filter @randsum/expo android      # Android emulator (needs ANDROID_HOME)
bun run --filter @randsum/expo typecheck    # tsc --noEmit
bun test apps/expo                          # bun:test (preloaded setup)
```

## Environment

The app currently needs **no secrets to run**. `.env.example` documents the
Supabase variables expected _if/when_ cloud sync is re-introduced (it was removed
2026-03-25); copy it to `.env.local` only when that work begins.

## More

See [`CLAUDE.md`](./CLAUDE.md) for the Metro resolver (load-bearing), platform-fork
conventions, and store patterns; and the root [`CLAUDE.md`](../../CLAUDE.md) for
monorepo-wide rules.
