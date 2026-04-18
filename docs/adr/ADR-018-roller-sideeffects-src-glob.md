# ADR-018: Roller `sideEffects` Uses `["./src/**/*"]` Instead of `false`

## Status

Accepted

## Context

`@randsum/roller` is a pure-function dice engine with no module-level side effects. Downstream consumers that import a narrow surface (for example, `isDiceNotation` from `@randsum/roller`) should be able to tree-shake the roll engine out of their bundles. The conventional signal for this is `"sideEffects": false` in `package.json`.

The naïve fix — adding `"sideEffects": false` to `packages/roller/package.json` — produces a broken `dist/`. Because bunup (built on `Bun.build`) reads the package's own `sideEffects` field during the build, and combines ESM code splitting with dead-code elimination, the builder eliminates top-level exported consts from shared chunks that it cannot prove are read by a downstream consumer *within the same build*. The result:

- `dist/docs/index.js` shrinks from 3283 B to 108 B (a bare `export { D as NOTATION_DOCS, ... }` referencing undeclared identifiers)
- `dist/trace/index.js` shrinks from 2517 B to 88 B (same problem)
- `dist/tokenize.js` shrinks from 256 B to 69 B
- `dist/index.js` contains `export { N as validateRange, H as validateNotation, ... }` where `N`, `H`, etc. are never imported in the same file
- Every roller dist smoke test fails at runtime with `"X" is not declared in this file`
- Downstream `@randsum/games` consumption of those broken chunks also fails

This was documented in commit `b8c81fde` ("fix(build): remove sideEffects: false to fix empty bundle output") and deferred in commit `c4b54b3b` ("chore(games): mark @randsum/games as sideEffects-free") with a note that roller was blocked on bunup's minifier+splitter interaction.

The practical options were:

a. **Tune bunup config** — `ignoreDCEAnnotations: true`, `minify: false`, or `splitting: false`. Tested. None resolve the issue; the DCE happens independently of the minifier flag and independently of whether splitting is enabled.
b. **Array-form `sideEffects`** — declare a narrow subset of files as having side effects. A pattern that matches no file at publish time but *does* match at build time neutralizes the self-DCE trap without polluting downstream tree-shaking.
c. **Drop minify or splitting** — either option ships larger published dists or loses chunk sharing. No measurable consumer-side benefit.
d. **Publish-time injection** — strip `sideEffects` during build, inject `"sideEffects": false` during `prepublishOnly`. Brittle and adds a hook to the release pipeline.

## Decision

Use `"sideEffects": ["./src/**/*"]` in `packages/roller/package.json`.

At build time, bunup resolves imports from `packages/roller/src/**/*` and marks them as having side effects, which prevents the runtime-breaking DCE of exported consts in the output chunks.

At consumer time, the published tarball contains only `dist/**/*` (per the `files` field). Nothing a downstream bundler resolves will match `./src/**/*`, so the sideEffects list is effectively empty and the package is fully tree-shakeable.

## Consequences

### Positive

- Consumer bundles that import a subset of the public API tree-shake the rest of the engine. Measured with esbuild (`--bundle --tree-shaking=true --minify`) on a packed 1.3.0 tarball:
  - Baseline (no `sideEffects`): `import { isDiceNotation } from '@randsum/roller'` → 51.3 KB
  - With `sideEffects: ["./src/**/*"]`: same import → 14.5 KB (**72% reduction**)
- No changes to bunup config or build pipeline. All existing size-limit budgets continue to pass.
- All 2683 roller tests and 503 games tests continue to pass. The dist smoke test passes.

### Negative

- The `sideEffects` value is a workaround for a bunup self-DCE bug, not the idiomatic `false`. A comment in `package.json` is not possible (JSON); this ADR exists so future engineers understand the shape.
- If bunup's behavior changes (for example, it starts resolving `sideEffects` globs relative to `dist/` rather than the package root, or the underlying `Bun.build` stops applying self-DCE from the package's own `sideEffects`), this value should be revisited and simplified to `false`.

### Neutral

- Adding a full import (`import { roll } from '@randsum/roller'`) makes no appreciable difference (65829 B vs 65827 B) because the tree-shaker already drops what ESM static analysis can see. The win is for narrow imports, which are the common case for UI and validation code.

## Alternatives Considered

- **`sideEffects: false`** — Broken (see Context).
- **`sideEffects: ["./dist/**/*"]`** — Broken. bunup's self-DCE still runs against the in-memory module graph, not dist paths.
- **`sideEffects: ["./src/**/*", "./dist/**/*"]`** — Works at build time but neutralizes consumer tree-shaking (the `./dist/**/*` pattern matches every imported file). Equivalent to omitting the field entirely.
- **`bunup: { ignoreDCEAnnotations: true }`** — Tested, does not affect this DCE path.
- **`bunup: { splitting: false }`** — Tested, does not fix the re-export stub problem. The regression persists.
- **Post-build `package.json` rewrite** — Rejected; added brittleness for no measurable advantage over (b).

## References

- Commit `b8c81fde` — previous diagnosis of the same failure mode.
- Commit `c4b54b3b` — games sideEffects opt-in; roller deferral note.
- bunup docs: https://bunup.dev/docs/guide/options (splitting, minify, ignoreDCEAnnotations).
- [webpack docs on `sideEffects`](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free) — canonical semantics for array-form `sideEffects`.
