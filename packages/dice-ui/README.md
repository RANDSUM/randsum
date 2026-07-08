# @randsum/dice-ui

Private, internal React component library for RANDSUM dice UIs — a combined notation roller
(input + token color overlay + roll button) and the result panels that render a roll's steps.

> **Private package** (`"private": true`, v2.0.0). Not published to npm. Consumed from source by
> `apps/site` within the monorepo via `workspace:~`. There is **no build step** —
> `main`/`types`/`exports` all point at `src/index.ts`.

## Render target

Web only (`react-dom`): `src/index.ts` → the `.tsx` components. There is **no React Native target**
and **no TUI / `ink` target** (see `docs/adr/ADR-019`).

The only runtime workspace dependency is `@randsum/roller`. `react` and `react-dom` are peers
(`react-dom` optional).

## Exports

The public surface is intentionally small — only what `apps/site` consumes:

- `NotationRoller` (+ `NotationRollerProps`) — combined input + roll button + description row
- `RollResultPanel` (+ `RollResultPanelProps`), `RollResultDisplay` — result panels
- `RollResult` — the roll-result payload type emitted by `NotationRoller`'s `onRoll`

Everything else (`TokenOverlayInput`, the roll-step visualizer in `RollSteps`, the
`useTheme`/`getTheme`/`subscribeTheme` theme store, and the `tokenColor` helper) is an internal
implementation detail used by the components above — imported directly from its module, not
re-exported from the barrel.

## Commands

```bash
bun run --filter @randsum/dice-ui typecheck      # tsc --noEmit
bun run --filter @randsum/dice-ui lint           # eslint
bun run --filter @randsum/dice-ui format:check   # prettier --check
bun run --filter @randsum/dice-ui test           # bun test __tests__
bun run --filter @randsum/dice-ui check          # typecheck + format:check + lint + test
```

## More

See [`CLAUDE.md`](./CLAUDE.md) in this directory for component-by-component guidance, and the root
[`CLAUDE.md`](../../CLAUDE.md) for monorepo-wide rules.
