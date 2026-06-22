# @randsum/dice-ui

Private, internal React component library for RANDSUM dice UIs — a notation input with a token
color overlay, a roll-step visualizer, result panels, a combined notation roller, and a quick
reference grid.

> **Private package** (`"private": true`, v2.0.0). Not published to npm. Consumed from source by
> `apps/expo` and `apps/site` within the monorepo via `workspace:~`. There is **no build step** —
> `main`/`types`/`exports` all point at `src/index.ts`.

## Render targets

Two targets only — there is **no TUI / `ink` target** (see `docs/adr/ADR-019`):

- **Web (react-dom):** `src/index.ts` → the `.tsx` components.
- **React Native:** `src/index.native.ts` → the `.native.tsx` components.

Bundlers/resolvers pick the target by platform (Metro for Expo, `paths`/conditions for the
site). The only runtime workspace dependency is `@randsum/roller`. `react`, `react-dom`,
`react-native`, and `expo-haptics` are peers (the last three optional).

## Exports

Both barrels expose the same public surface:

- Theme: `useTheme`, `getTheme`, `subscribeTheme`, `DiceUIThemeProvider`
- `TokenOverlayInput` — notation input with a colored token overlay
- `RollSteps`, `StepRow`, `DieBadge` — roll-step visualizer
- `NotationRoller` — combined input + roll button + result display
- `RollResultPanel`, `RollResultDisplay` — result panels
- `QuickReferenceGrid`, `DocModal` — notation reference grid + modal
- `tokenColor` — token-to-color helper

## Commands

```bash
bun run --filter @randsum/dice-ui typecheck   # tsc --noEmit
bun run --filter @randsum/dice-ui test        # bun test __tests__
bun run --filter @randsum/dice-ui check       # typecheck + test
```

## More

See [`CLAUDE.md`](./CLAUDE.md) in this directory for component-by-component guidance and the
platform-fork conventions, and the root [`CLAUDE.md`](../../CLAUDE.md) for monorepo-wide rules.
