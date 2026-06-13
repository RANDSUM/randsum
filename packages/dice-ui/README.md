# @randsum/dice-ui

Private, internal React component library for RANDSUM dice UIs — notation input with a token
overlay, a roll-step visualizer, a result panel, and a combined notation roller.

> **Private package.** Not published to npm (`"private": true`). Consumed from source by
> `apps/expo` and `apps/site` within the monorepo via `workspace:~`.

## Render targets

Two targets only — there is **no TUI / `ink` target** (see `docs/adr/ADR-019`):

- **Web (react-dom):** `src/index.ts` → the `.tsx` components.
- **React Native:** `src/index.native.ts` → the `.native.tsx` components.

Bundlers/resolvers pick the target by platform (Metro for Expo, `paths`/conditions for the
site). The only runtime workspace dependency is `@randsum/roller`; `react` / `react-dom` /
`react-native` / `expo-haptics` are peers.

## Commands

```bash
bun run --filter @randsum/dice-ui typecheck
bun run --filter @randsum/dice-ui test
bun run --filter @randsum/dice-ui check
```

## More

See [`CLAUDE.md`](./CLAUDE.md) in this directory for component-by-component guidance and the
platform-fork conventions, and the root [`CLAUDE.md`](../../CLAUDE.md) for monorepo-wide rules.
