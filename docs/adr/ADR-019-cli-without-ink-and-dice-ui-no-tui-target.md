# ADR-019: CLI Shipped Without Ink; `dice-ui` Has No TUI Target

## Status

Accepted

## Context

Earlier project memory and several descriptive artifacts (notably `audit/inventory.md`
and the architecture audit dimension) recorded a planned "unified roller app" direction
in which:

- `apps/cli` would be an **Ink-based TUI** that depended on `@randsum/dice-ui`, and
- `@randsum/dice-ui` would ship a **third render target** — an `ink/` subdirectory of
  TUI components — alongside its web (`.tsx`) and React Native (`.native.tsx`) targets.

That intent was never realized. The artifacts drifted from the shipped code, which this
ADR records so the retired direction is captured rather than silently reverted.

The current, verified-in-source reality:

- **`apps/cli` is a plain string-formatting CLI.** Its source is `src/index.ts`
  (argv parsing + `console.log`/`process.exit`), `src/run.ts` (calls `roll()` and formats),
  and `src/format.ts` (`formatCompact` / `formatVerbose` / `formatJson`). There is **no
  React, no Ink, and no dependency on `@randsum/dice-ui`.** Its only workspace dependency
  is `@randsum/roller` (declared as a `devDependency` and inlined at build time via bunup's
  `noExternal: [/^@randsum\//]`). `apps/cli/package.json` is at version `2.0.0`.
- **`@randsum/dice-ui` has exactly two render targets**: `index.ts` (web / react-dom,
  the `.tsx` components) and `index.native.ts` (React Native, the `.native.tsx`
  components). There is **no `ink/` directory and no `ink` dependency** in
  `packages/dice-ui/package.json`. Its dependencies are `@randsum/roller` plus
  React / React Native peers.
- **The `NormalizedRollDefinition` IR is codegen-only.** It is defined in
  `packages/games/src/lib/normalizedTypes.ts` and consumed exclusively inside
  `packages/games/src/lib/` (the `normalizer`, `codegen`, and `emit*` functions).
  `packages/roller` contains **zero** references to it — the runtime roll pipeline does
  not consume the IR. (The generated game packages call `roll()` from `@randsum/roller`
  directly; the IR exists only to drive code generation.)

## Decision

Record that the "Ink TUI / dice-ui TUI target" direction is **retired, not pending**:

- The CLI is intentionally a thin, dependency-light string formatter over `@randsum/roller`.
- `dice-ui` is a two-target (web + React Native) component library with no TUI surface.
- The `NormalizedRollDefinition` IR is a build-time codegen artifact, not a runtime concept.

`audit/inventory.md` has been corrected to match this reality (CLI no longer described as
an Ink TUI depending on dice-ui; dice-ui no longer described as having an `ink/` target).

## Consequences

### Positive

- Descriptive artifacts now match the shipped code; future readers will not re-introduce
  an Ink dependency on the assumption that one was intended.
- The CLI stays small and bundles cleanly with no React/Ink runtime.

### Neutral

- If a TUI is desired in the future, it would be a new, deliberate addition (a new render
  target in dice-ui plus an Ink consumer in the CLI), tracked as its own work — not a
  resumption of a half-built state.

## References

- `apps/cli/src/{index,run,format}.ts`, `apps/cli/package.json`, `apps/cli/bunup.config.ts`
- `packages/dice-ui/package.json`, `packages/dice-ui/src/index.ts`, `packages/dice-ui/src/index.native.ts`
- `packages/games/src/lib/normalizedTypes.ts` (IR definition; consumers under `packages/games/src/lib/`)
- `audit/inventory.md` (corrected in the same change as this ADR)
