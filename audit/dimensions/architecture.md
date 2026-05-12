# Architecture & Monorepo Audit

_Audited: 2026-05-10_

## Summary

The monorepo is architecturally sound: package responsibilities are clearly delineated, the dependency graph is acyclic, and the workspace protocol (`workspace:~`) is used consistently across all inter-package links. The two real issues are a TS version fragmentation that produces inconsistent strict-mode guarantees across packages, and a `dice-ui` package that ships as raw source (no build) while also carrying a runtime `ink` dependency that belongs on the consumer side.

---

## Findings

### F1. TypeScript version fragmentation — P1

**Observation:** Four different TypeScript versions are in play simultaneously:

- Root `devDependencies`: `typescript@6.0.2`
- Catalog entry `typescript`: `5.9.3`
- `packages/games/devDependencies`: `typescript@6.0.2` (explicit, overrides catalog)
- `apps/rdn/devDependencies`: `typescript@5.8.3` (two minor versions behind catalog)
- `apps/expo/devDependencies`: `typescript@~5.9.2` (semver range, resolves to catalog range but pinned separately)
- `packages/roller` and `apps/cli` use `catalog:` (resolves to 5.9.3)

The root `devDependencies` TS 6.0.2 is used by eslint/build tooling at the root level; the catalog 5.9.3 is used by most packages. This means `packages/games` typechecks against TS 6.0 while `packages/roller` typechecks against TS 5.9.3 — potentially different error behavior for strict-mode edge cases.

**Why it matters:** A TS 6.0 feature or stricter inference used in `packages/games` will fail to compile when `packages/roller` consumers pull the types in a TS 5.9 project. If `apps/rdn` is on 5.8.3, any rdn-internal type that relies on a 5.9+ feature silently degrades.

**Recommendation:** Consolidate on a single TS version. Promote the catalog entry to 6.0.2, remove the explicit pin in `packages/games/devDependencies`, remove the rdn local pin, and update the expo range to `~6.0.0`. Use `catalog:` everywhere. The catalog entry is the single source of truth; the root `devDependencies` pin should match it.

**Effort:** S

---

### F2. `dice-ui` ships as unbuilt source with a runtime `ink` dependency — P1

**Observation:** `packages/dice-ui/package.json` has no `build` script; `exports` points at `./src/index.ts` (raw TypeScript). It is consumed directly from source by three dependents — `apps/cli`, `apps/expo`, and `apps/site` — each of which must understand TypeScript source resolution at typecheck and bundle time. `apps/site` achieves this via a `paths` alias in its `tsconfig.json`; `apps/expo` via a Metro `resolveRequest` map plus a manual `.d.ts` augmentation file; `apps/cli` bundles it through bunup with no `noExternal` override for dice-ui (relying on bunup's default source inlining).

Additionally, `ink@6.8.0` is declared as a production `dependency` of `dice-ui`, not a `peerDependency`. Ink is a TUI library only relevant to `apps/cli`; pulling it into a web/React Native component library that `apps/site` and `apps/expo` also consume adds ~250 KB to any consumer that tree-shakes imperfectly.

**Why it matters:** The `apps/expo` workaround is particularly fragile: `apps/expo/types/dice-ui.d.ts` duplicates the entire public API surface as hand-written ambient declarations. Any change to dice-ui's public API requires a manual update to that file or types silently drift. The ink misclassification risks bundling the TUI runtime in Astro/Expo builds if tree-shaking fails (e.g. a future SSR target).

**Recommendation:** Move `ink` to `peerDependencies` with `peerDependenciesMeta.ink.optional: true` (same pattern used for `react-dom` today). Long-term, give dice-ui a build step and ship `dist/` — the current source-only approach is an intentional shortcut (CLAUDE.md acknowledges it) but the ambient `.d.ts` duplication in expo is the concrete tax to pay for it.

**Effort:** S (peer dep fix) / L (full build pipeline)

---

### F3. `packages/roller` `sideEffects` glob is incorrect — P1

**Observation:** `packages/roller/package.json` declares:

```json
"sideEffects": ["./src/**/*"]
```

`src/` is not included in `files` (only `dist/` is published). Post-publish, no consumer ever sees `src/`, so this glob never matches anything and every file in the published `dist/` is implicitly treated as side-effect-free. This is accidentally correct for bundling, but the intent is clearly wrong — it should either be `false` (zero side effects) or point at the actual published paths.

**Why it matters:** If a consumer's bundler evaluates `sideEffects` strictly, the glob `./src/**/*` is unresolvable after install, and the behavior falls back to the bundler's default (treat all files as having side effects). This defeats tree-shaking for the tokenize/docs/trace subpath separation that the architecture carefully maintains.

**Recommendation:** Change to `"sideEffects": false`. Roller has no module-level side effects; the explicit false declaration enables tree-shaking for all subpaths.

**Effort:** S

---

### F4. `packages/games` extends root `tsconfig.json` directly, not `tsconfig.packages.json` — P2

**Observation:** `packages/games/tsconfig.json` extends `../../tsconfig.json` while `packages/roller` and `packages/dice-ui` both extend `../../tsconfig.packages.json`. `tsconfig.packages.json` adds `outDir: "dist"` and excludes test files from the compiled output. Games inherits neither: it sets no `outDir`, and `__tests__/lib` is explicitly excluded in its own config while test files in `__tests__/` (non-lib) are included in the type-check scope. This inconsistency means `bun run typecheck` in games includes test code in the compiled set, while roller does not.

Games also adds a `types: ["bun"]` compiler option and `paths` aliases — both are legitimate game-package needs — but these could be additive on top of `tsconfig.packages.json` rather than forking from the base config.

**Why it matters:** Test files included in `outDir`-less compilation means games' `tsc --noEmit` validates a broader surface (test imports of game subpaths via the paths alias) than roller's typecheck. It's not broken, but it's inconsistent and makes the tsconfig inheritance hierarchy harder to reason about.

**Recommendation:** Change games `tsconfig.json` to `"extends": "../../tsconfig.packages.json"` and add its specific overrides (`types`, `paths`, and `include`/`exclude` adjustments) on top.

**Effort:** S

---

### F5. `@randsum/cli` depends on `@randsum/roller` as a `devDependency` despite bundling it — P2

**Observation:** `apps/cli/package.json` lists `@randsum/roller` under `devDependencies`, yet `apps/cli/bunup.config.ts` uses `noExternal: ['@randsum/roller']` to inline roller into the built `dist/index.js`. The classifier is technically correct (roller doesn't ship as a peer dep of the CLI) but the intent is misleading: it's inlined at build time, not a true dev-only dependency. `@randsum/dice-ui` is listed under `dependencies` but is not covered by `noExternal`, meaning dice-ui is treated as an _external runtime_ dependency — yet dice-ui is `private: true` and has no published build.

In practice bunup resolves `@randsum/dice-ui` from the workspace source tree during build, so the CLI binary includes dice-ui code, but this is not expressed in the config.

**Why it matters:** Any future change that moves dice-ui to a real published package, or any attempt to run the CLI binary in a context without the workspace (e.g. `npm install -g @randsum/cli`), will fail at runtime because dice-ui is not a real package on npm. `bun publish` will not resolve the `workspace:~` reference to a real semver for dice-ui (it's private and won't be on npm).

**Recommendation:** Add `"@randsum/dice-ui"` to `noExternal` in `bunup.config.ts` so dice-ui is explicitly inlined. This makes the bundle self-contained and removes the runtime dep on an unpublished workspace package. Both roller and dice-ui should be `devDependencies` (inlined, not shipped as runtime deps).

**Effort:** S

---

### F6. Two separate Astro apps (`apps/site` and `apps/rdn`) with version drift — P2

**Observation:** Both sites use Astro `6.0.2`, but `apps/site` uses `@astrojs/netlify@7.0.1` while the root `overrides` pins `vite@7.3.2` and `@astrojs/netlify` in `devDependencies` is at `7.0.4`. The site has `node: ">=22.12.0"` in `engines` while the monorepo root requires `node: ">=18.0.0"`. `apps/rdn` has a local `typescript@5.8.3` devDependency (two minor versions behind) and no Starlight dependency (intentionally minimal).

The split is intentional — `site` is the full Starlight docs site; `rdn` is a standalone spec viewer at a different domain (`notation.randsum.dev`). The separation is justified by domain, audience, and content authoring model.

**Why it matters:** The `@astrojs/netlify` version drift (7.0.1 in site vs 7.0.4 root devDep) is benign since root devDeps don't influence workspace package resolution. The `node >= 22.12` engine requirement in `apps/site` is undocumented (root says `>= 18`) and will silently fail CI if the job matrix uses Node 18 or 20.

**Recommendation:** Align `apps/site/package.json` `engines.node` to `">=22.12.0"` in the CI matrix explicitly, or relax to `">=20.0.0"` if compatible. Promote `@astrojs/netlify` into the catalog and use `catalog:` in `apps/site`. The site/rdn split is justified — no consolidation needed.

**Effort:** S

---

### F7. `@stackblitz/sdk` pinned to `"latest"` in `apps/site` — P3

**Observation:** `apps/site/package.json` declares `"@stackblitz/sdk": "latest"`. This is the only `latest`-tagged dependency in the entire monorepo; every other package uses exact or tilde-range pins.

**Why it matters:** `latest` resolves at install time to whatever is current on npm. A major StackBlitz SDK release could silently break the `live-repl/OpenInStackBlitz.tsx` component. Bun's lockfile pins the resolved version, so it's not broken today — but it will resolve to a new major on the next fresh install after a major release.

**Recommendation:** Pin to an explicit version: `"@stackblitz/sdk": "1.10.0"` (or whatever the current lockfile-resolved version is). One line change.

**Effort:** S

---

### F8. `packages/games` tsconfig `paths` alias works for typecheck but is not validated by bunup — P3

**Observation:** `packages/games/tsconfig.json` declares:

```json
"paths": { "@randsum/games/*": ["./src/*.generated.ts"] }
```

This allows `__tests__/` to import `from '@randsum/games/blades'` and resolve to source. At build time bunup does not use this alias — it uses the `package.json#exports` map. The `exports-sync.test.ts` guard ensures the two stay in sync after each build. This is a sound design and the guard test is the right enforcement mechanism.

The minor gap: if a developer runs `bun run typecheck` before `bun run build`, the paths alias will resolve generated files that exist in `src/` but the test guard that checks `dist/` will not yet have run. A stale `src/blades.generated.ts` could pass typecheck while `dist/blades.generated.js` is missing or outdated.

**Why it matters:** The pre-push hook (`lefthook.yml`) runs `gen:check` before tests, so in normal flow this is caught. The gap only bites a developer who runs `bun run typecheck` in isolation after editing a spec without regenerating.

**Recommendation:** Document this in `packages/games/CLAUDE.md` (one bullet under "Key Constraints"). The enforcement is already correct in lefthook; no code change needed.

**Effort:** S
