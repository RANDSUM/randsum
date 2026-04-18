# ADR-008: ESM-Only Package Output Across All Publishable @randsum Packages

## Status

Accepted — all publishable packages emit ESM only (no `.cjs`/`.d.cts`/`dist/cjs/`).

## Context

The monorepo's build toolchain is `bunup` (a Bun-native bundler). `@randsum/roller`'s `bunup.config.ts` has always specified `format: ['esm']`. The exports map in `packages/roller/package.json` contains zero `"require"` conditions — every subpath uses only `"import"` with `types` and `default`. No `.cjs` files exist in the roller `dist/`. No `require()` calls appear anywhere in the monorepo. `"type": "module"` is set at the package level.

The roller's ESM-only state was confirmed empirically in Round 3 of the streamline-roller debate (Orion's CJS blocker resolution). The de facto state and the formal configuration are aligned for roller.

However, this alignment has not been formally audited across all other publishable packages (`@randsum/games`, `@randsum/display-utils`, `@randsum/component-library`). Lingering CJS artifacts in those packages — whether as `"require"` conditions in exports maps, `.cjs` output files, or `.d.cts` declaration files — would:

1. Undermine the tree-shaking argument that makes ADR-007 (modifier co-location) safe. If any package in the consumer graph uses a CJS bundle of roller, module-level tree-shaking does not apply and co-located schema+behavior files become a bundle-size problem.
2. Create inconsistency in the published package surface — some packages shipping ESM+CJS while others ship ESM-only creates confusion for consumers building framework integrations or server-side bundles.
3. Prevent reliable size-limit enforcement — `size-limit` import-graph checks behave differently against CJS vs. ESM artifacts.

CJS support was historically relevant when targeting broad Node.js compatibility. The current engine requirement in roller is `node >=18.0.0`. Node 18+ supports ESM natively with `"type": "module"`. The bundler ecosystem (esbuild, rollup, webpack 5, Vite, Bun) all perform ESM tree-shaking. No `@randsum/*` package requires CJS output for its stated use cases.

## Decision

Formalize ESM-only output across all publishable `@randsum` packages:

1. **Audit** all publishable package `bunup.config.ts` files — confirm `format: ['esm']` is the only format.
2. **Remove** any lingering `.cjs` references from `package.json` exports maps (any `"require"` conditions in subpath exports).
3. **Remove** any `"require"` condition entries from exports maps.
4. **Delete** any `.cjs` and `.d.cts` output files from dist directories.
5. **Update** `CLAUDE.md` Package Build Output section to read: "All publishable packages produce ESM only (`dist/index.js`, `dist/index.d.ts`)."

The build output for every publishable package is:

```
dist/index.js      (ESM)
dist/index.d.ts    (TypeScript declarations)
```

Subpath exports follow the same pattern (`dist/<subpath>.js`, `dist/<subpath>.d.ts`). No `.cjs`, `.d.cts`, or `dist/cjs/` variants are produced.

CJS consumers must use a bundler that translates ESM to CJS (esbuild, rollup, webpack 5+). All mainstream bundlers support this transparently. Direct `require()` of an ESM package without a bundler is not a supported use case for `@randsum/*`.

## Consequences

### Positive

- Enables reliable ESM tree-shaking across the entire consumer graph, which is the enforcement mechanism for ADR-007 (modifier co-location tokenize isolation).
- Eliminates `.cjs` / `.d.cts` output files from all dist directories, reducing published package size.
- Removes `"require"` conditions from all exports maps, simplifying the package.json surface.
- `size-limit` import-graph checks behave predictably and uniformly across all packages.
- Consistent published package surface — all `@randsum/*` packages behave identically in a consumer's bundler.
- Reduces build toolchain surface: no dual-format output configuration to maintain.

### Negative

- CJS consumers who `require()` an `@randsum/*` package without a bundler will encounter an error. This is a breaking change for those consumers.
- Semantic versioning requires a major version bump if `.cjs` output was previously present and documented in the published package surface. If `.cjs` files were never listed in `"files"` or in the exports map, no major bump is required.
- The practical consumer impact is expected to be low: Node 18+ natively supports ESM, Bun supports ESM, and all bundlers handle ESM-to-CJS translation. The `@randsum/*` target audience (game developers, RPG toolmakers, web app developers) uses bundled environments.

## Alternatives Considered

**Dual ESM+CJS output (status quo if any packages still ship CJS):**
Maintains broadest compatibility but doubles build output, prevents reliable tree-shaking, and creates inconsistency within the monorepo. Rejected because the CJS consumer population is negligible for this package ecosystem and the tree-shaking benefit (enabling ADR-007) is concrete and immediate.

**ESM-only for roller only, dual format for other packages:**
Inconsistent. If `@randsum/games` ships CJS and a consumer bundles roller via games, tree-shaking guarantees from ADR-007 do not apply at the consumer level. Rejected for consistency and correctness.

**Require `eslint-plugin-import` to ban `require()` calls:**
An enforcement layer, not a decision. Compatible with this ADR but not a substitute for it. The build config (`bunup.config.ts`) is the authoritative source — lint rules reinforce it but do not replace it.

## References

- ADR-007: Modifier Co-Location (depends on ESM-only for tree-shaking guarantee)
- Brainstorm: `options.md` Story 3 — Formalize ESM-Only Across All Packages
- Debate: `round-2.md` — CJS concern blocks co-location; noted as stale assumption for roller
- Debate: `round-3.md` (Orion) — CJS blocker confirmed fully resolved; ESM tree-shaking guarantee documented
