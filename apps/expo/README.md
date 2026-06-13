# @randsum/expo — Dice Playground

The cross-platform RANDSUM dice playground (web + iOS + Android), built with **Expo SDK 55**
and Expo Router. The web build powers the public playground at
[randsumapp.expo.app](https://randsumapp.expo.app) (also `randsum.io`).

> **Private app.** Not published to npm. Web deploys to EAS Hosting; native builds run on EAS
> Build. See [`apps/DEPLOY.md`](../DEPLOY.md) for deploy, rollback, and DR.

## Stack

- Expo SDK 55, React 19 / React Native, react-native-web
- Zustand (client state), AsyncStorage (persistence)
- Workspace-linked `@randsum/roller` and `@randsum/dice-ui`

## Commands

```bash
bun run --filter @randsum/expo start        # Expo dev server
bun run --filter @randsum/expo web          # Web dev server
bun run --filter @randsum/expo typecheck    # tsc --noEmit
bun test apps/expo                          # bun:test (preloaded setup)
```

## Environment

Copy [`.env.example`](./.env.example) to `.env.local` and fill in values. Today the app needs
no secrets to run; the example file documents the variables expected when Supabase is
re-introduced (it was removed 2026-03-25 — see `CLAUDE.md`).

## More

See [`CLAUDE.md`](./CLAUDE.md) for the Metro resolver details (load-bearing), platform-fork
conventions, and store patterns; [`PRD.md`](./PRD.md) for the product spec; and the root
[`CLAUDE.md`](../../CLAUDE.md) for monorepo-wide rules.
