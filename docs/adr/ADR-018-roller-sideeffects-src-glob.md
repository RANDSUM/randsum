# ADR-018: Roller `sideEffects` — `true` In-Repo, Flipped to `false` at Publish

## Status

Accepted (amended 2026-06-21). An earlier revision of this ADR specified an array-form
`["./src/**/*"]` glob; the implemented approach is a publish-time manifest flip (see
Decision). Re-verified against bunup `0.16.32`.

## Context

`@randsum/roller` is a pure-function dice engine with no module-level side effects.
Consumers that import a narrow surface (for example, `isDiceNotation`) should be able to
tree-shake the rest of the engine out of their bundles. The conventional signal for that is
`"sideEffects": false` in `package.json`.

Two constraints make a plain `"sideEffects": false` in the **in-repo** `package.json`
unworkable:

1. **bunup self-DCE breaks the dist.** bunup (built on `Bun.build`) reads the package's own
   `sideEffects` field at build time and, combining ESM code splitting with dead-code
   elimination, strips top-level exported consts from shared chunks it cannot prove are read
   within the same build. With `false`:
   - `dist/docs/index.js` collapses to a bare `export { D as NOTATION_DOCS, ... }` referencing
     undeclared identifiers (~108 B); `dist/trace/index.js` and `dist/tokenize.js` similarly.
   - Every roller dist smoke test fails at runtime with `"X" is not declared in this file`,
     and downstream `@randsum/games` consumption of those chunks breaks.
   - Diagnosed in commit `b8c81fde`. Tuning bunup (`ignoreDCEAnnotations: true`,
     `minify: false`, `splitting: false`) does not resolve it — the DCE is independent of
     those flags.
2. **`apps/cli` bundles roller from source.** The CLI's bunup config uses
   `noExternal: [/^@randsum\//]` and reads roller's `sideEffects` field while bundling. The
   in-repo value must keep the CLI's bundled output intact.

## Decision

Keep **`"sideEffects": true`** in the in-repo `packages/roller/package.json`, and flip it to
**`"sideEffects": false`** only in the published tarball manifest at pack time.

`scripts/publish.ts` (`packRollerWithSideEffectsFalse`) rewrites `"sideEffects": true` →
`"sideEffects": false` in the manifest immediately before `bun pm pack`, then restores it.
`bun pm pack` does not rebuild `dist/` or run lifecycle hooks, so the tarball ships the
already-built healthy `dist/**/*` alongside a tree-shakeable manifest. The script asserts the
field is `true` before flipping and fails loudly if it is not.

Net effect:

- **In-repo / build / CLI**: `sideEffects: true` keeps bunup's self-DCE from corrupting the
  dist and keeps the CLI's `noExternal` source bundle intact.
- **Published package**: ships `sideEffects: false`, so consumers tree-shake unused surfaces.

## Consequences

### Positive

- Consumers installing `@randsum/roller` receive `sideEffects: false` and full tree-shaking of
  narrow imports (the common case for UI and validation code).
- The in-repo build and the CLI's source bundling stay correct.
- Only the manifest is rewritten; the healthy pre-built dist is what ships.

### Negative

- The published manifest's `sideEffects` differs from the in-repo one. Anyone reasoning about
  roller's tree-shaking must read `scripts/publish.ts`, not just `package.json` — hence this ADR.
- The release path depends on the flip step. The assertion in `packRollerWithSideEffectsFalse`
  guards against the field silently changing shape (to `false` or an array), which would skip
  the flip and ship a non-tree-shakeable (or, if set to `false` in-repo, a broken) package.

### Neutral

- Adding a full import (`import { roll } from '@randsum/roller'`) makes no appreciable size
  difference; ESM static analysis already drops what it can see. The win is for narrow imports.

## Alternatives Considered

- **`sideEffects: false` in-repo** — Broken: bunup self-DCE corrupts the dist (see Context),
  and the CLI's source bundle reads the field.
- **`sideEffects: ["./src/**/*"]` (the prior ADR-018 decision)** — Builds clean and, because the
  published tarball ships only `dist/**/*` (which the `./src/**/*` glob never matches), yields a
  tree-shakeable published manifest. Superseded by the publish-time flip: the in-repo value must
  stay `true` for the CLI's `noExternal` source bundling, and a single `true` plus an explicit,
  asserted flip is easier to reason about than a glob whose consumer-side behavior depends on
  what the tarball happens to contain.
- **`sideEffects: ["./dist/**/*"]`** — Broken; self-DCE runs against the in-memory module graph,
  and the glob neutralizes consumer tree-shaking.
- **bunup config tuning** (`ignoreDCEAnnotations`, `splitting: false`) — Tested; does not fix
  the self-DCE.

## Re-verification (2026-06-21)

- `sideEffects: false` in-repo was re-tested against bunup `0.16.32`: it still breaks the dist
  (`packages/roller/__tests__/dist.smoke.test.ts` fails with the undeclared-identifier symptom).
  The bunup bug persists; `false` remains non-viable in-repo.
- The `publish (dry run)` CI job asserts the in-repo field is `true`. Do **not** change
  `packages/roller/package.json`'s `sideEffects` away from `true` without updating
  `scripts/publish.ts` to match.

## References

- `scripts/publish.ts` — `packRollerWithSideEffectsFalse` (the pack-time manifest flip).
- Commit `b8c81fde` — diagnosis of the bunup self-DCE failure mode.
- Commit `c4b54b3b` — games sideEffects opt-in; roller deferral note.
- bunup docs: https://bunup.dev/docs/guide/options (splitting, minify, ignoreDCEAnnotations).
- [webpack docs on `sideEffects`](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free) — canonical semantics for array-form `sideEffects`.
