# Build, Tooling, CI/CD Audit

_Audited: 2026-05-10_

## Summary

The pipeline is well-structured with strong bones: pinned action SHAs, path-filtered CI jobs, a changeset-driven release flow, and consistent ESM-only bunup configs. The most actionable issues are a broken production publish (npm auth not wired in `publish.yml`), coverage configured but never uploaded to Codecov, `roller`'s `sideEffects` pointing at unpublished `src/` files (defeating tree-shaking), the `claude-code-review` workflow running on every PR without author gating, and three TypeScript version forks across the workspace. None of these block day-to-day development, but the publish and coverage gaps are release-critical.

---

## Findings

### F1. `publish.yml` Missing `NODE_AUTH_TOKEN` — P0

**Observation:** `publish.yml` (Release job) sets `id-token: write` and calls `bun-setup` with `node-version: '24'` + `registry-url: 'https://registry.npmjs.org'`, which wires up `setup-node`. The `changesets/action` then runs `bun run publish`, which internally calls `npm publish <tarball>` (see `scripts/publish.ts:78`). But the job's `env:` block only contains `GITHUB_TOKEN` — no `NPM_TOKEN` → `NODE_AUTH_TOKEN` mapping. `setup-node` writes an `.npmrc` placeholder `${NODE_AUTH_TOKEN}` but never populates it automatically; the secret must be explicitly mapped as `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` in the `changesets` step's `env:`. The script comment claims "OIDC handled automatically" but no `--provenance` flag or `auth-type: web` is passed, so OIDC Trusted Publishers are not active.
**Why it matters:** Every automated release triggered by changesets-action will fail with an npm 401 auth error when attempting to publish, silently leaving the "Version PR" created but the actual publish step broken.
**Recommendation:** Add `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` to the `changesets` step's `env:` block. Optionally add `--provenance` to the `npm publish` args in `scripts/publish.ts` and ensure npm Trusted Publishers is configured on npmjs.com if you want OIDC-only auth.
**Effort:** S

---

### F2. Codecov Configured But Never Uploaded — P1

**Observation:** `codecov.yml` defines project (80%) and patch (70%) coverage gates with PR comment layout. `bunfig.toml` enables `coverage = true` and outputs lcov to `./coverage/`. `package.json` has `test:coverage` script. However, zero CI workflows contain a Codecov upload step (`codecov-action`, `curl`, or equivalent). Coverage is never sent to Codecov, so the configured thresholds are never enforced and no PR coverage comments appear.
**Why it matters:** The gates exist on paper but provide no enforcement. Regressions in coverage silently pass. The `codecov.yml` creates a false sense of coverage enforcement.
**Recommendation:** Add a coverage upload step to `ci.yml` (roller and games jobs, at minimum) using `codecov/codecov-action`. Generate coverage with `bun test --coverage --coverage-reporter=lcov` and upload `coverage/lcov.info`. Set `CODECOV_TOKEN` as a repository secret.
**Effort:** S

---

### F3. `roller` `sideEffects` Points at Unpublished `src/` — P1

**Observation:** `packages/roller/package.json` sets `"sideEffects": ["./src/**/*"]`. The `files` field publishes only `dist/` — `src/` is never in the tarball. Bundlers resolve `sideEffects` against the installed package's own files; since no file matches `./src/**/*` in the published package, bundlers fall back to treating the package as having side effects on every module. This defeats tree-shaking for consumers of `@randsum/roller`.
**Why it matters:** Every consumer that imports a single roller subpath (e.g., `@randsum/roller/tokenize`) will have the full `index.js` bundle included rather than just the requested subpath's tree. This inflates consumer bundle sizes.
**Recommendation:** Change to `"sideEffects": false` (roller has no runtime side effects — it is a pure transformation library) or, if the global random seed setup truly has side effects, use `"sideEffects": ["./dist/index.js"]` to target the correct published path.
**Effort:** S

---

### F4. TypeScript Version Fragmentation Across Workspace — P1

**Observation:** Four different TypeScript versions coexist:

- Root `devDependencies`: `typescript: 6.0.2` (used by `packages/games` which pins `6.0.2` in its own `devDependencies`)
- Catalog: `typescript: 5.9.3` (used by `packages/roller` via `catalog:`)
- `apps/rdn`: `typescript: 5.8.3` (hardcoded, below catalog)
- `apps/expo`: `typescript: ~5.9.2` (range, near-catalog)

`packages/games` explicitly pins `typescript: "6.0.2"` in its own `devDependencies` rather than using `catalog:`, which means it diverges independently from the catalog pin. `apps/rdn` is two minor versions behind the catalog and is not on the catalog at all.
**Why it matters:** Different tsc behavior between packages can produce type errors that only appear in one package's CI job. TS 5.9→6.0 is a major version jump with breaking changes in strict mode; packages using 6.0 that feed types into packages type-checking with 5.9 may produce subtly incompatible declarations.
**Recommendation:** Consolidate on one version. Either bump catalog to `6.0.2` and remove per-package overrides, or downgrade root/games to `5.9.3`. Update `apps/rdn` to use `catalog:`. The games package should use `"typescript": "catalog:"` not a hardcoded string.
**Effort:** S

---

### F5. Pre-commit `install` Runs in Parallel with `lint` / `typecheck` — P2

**Observation:** `lefthook.yml` sets `parallel: true` at the `pre-commit` level, which means `bun install --frozen-lockfile`, `eslint --fix`, `prettier`, `tsc --noEmit`, and `codegen-check` all start simultaneously. On a fresh checkout or after a dependency change, `bun install` may not complete before `lint` or `typecheck` attempt to resolve workspace packages, causing spurious failures. `stage_fixed: true` on lint also means ESLint may write to files before the install that added new type definitions completes.
**Why it matters:** Intermittent pre-commit failures that appear flaky but are actually a race condition. Developers work around them with `--no-verify`, undermining the hooks.
**Recommendation:** Move `install` to a `pre-commit` `run` step without `parallel: true`, or use lefthook's `skip_output` + `priority` ordering (move install to `priority: 1`, everything else `priority: 2` with `parallel: true` for that group). Alternatively, remove the install step from pre-commit entirely — the pre-push `build` step catches missing deps.
**Effort:** S

---

### F6. `claude-code-review` Fires on Every PR Without Author Gating — P2

**Observation:** `claude-code-review.yml` runs on `pull_request: [opened, synchronize, ready_for_review, reopened]` with no `if:` condition on the job. The author-filter block is commented out. This means every PR — including Dependabot patch bumps, bot PRs, and trivial doc fixes — triggers a full Claude code review, consuming API credits unconditionally. The `claude.yml` (comment-triggered) is fine since it requires `@claude` mention. The review workflow also lacks a `pull-requests: write` permission to post its review comment, which may silently fail.
**Why it matters:** Unnecessary credit burn on every PR lifecycle event. At scale (Dependabot weekly + regular dev PRs), this adds up. Silent permission failure means the review is computed but not posted.
**Recommendation:** Add `if: github.event.pull_request.author_association == 'CONTRIBUTOR' || github.event.pull_request.author_association == 'COLLABORATOR'` (or restrict to non-bot authors) to the job. Add `pull-requests: write` to the permissions block so the review can actually be posted.
**Effort:** S

---

### F7. `pre-push` Test Output Truncated to 5 Lines — P2

**Observation:** `lefthook.yml` pre-push test command: `bun run test 2>&1 | tail -5`. When tests fail across multiple packages (roller, games, cli), only the last 5 lines of combined output are shown. A multi-package test failure will show only the final package's summary, hiding which test failed in earlier packages.
**Why it matters:** Developer sees "5 tests failed" with no file context, has to re-run `bun run test` manually to diagnose. Slows iteration on pre-push failures.
**Recommendation:** Remove `| tail -5`. Lefthook already controls output via `output: [summary, failure]` — the summary is sufficient. If verbosity is a concern, replace with `bun run test 2>&1 | grep -E "(FAIL|PASS|✗|✓|Error)" | head -30` to keep signal while bounding output.
**Effort:** S

---

### F8. `games` tsconfig Extends Root Rather Than `tsconfig.packages.json` — P2

**Observation:** `packages/games/tsconfig.json` extends `../../tsconfig.json` (root) directly. All other packages (`roller`, `dice-ui`) extend `../../tsconfig.packages.json`, which itself extends root and adds `outDir: dist`, test file exclusions, and `include: ["src/**/*"]`. The games tsconfig manually reimplements `include`/`exclude` but misses the test-exclusion pattern `**/*.spec.ts` (though games has no `.spec.ts` files currently). More importantly, the games tsconfig does not set `outDir` in `compilerOptions` (it's inherited from root which doesn't set it either), leaving emitted files in the package root rather than `dist/` when `tsc --build` runs directly.
**Why it matters:** bunup handles emission correctly regardless, but `tsc --noEmit` for typecheck and any direct `tsc --build` invocations may behave differently from other packages. Inconsistency makes future tsconfig debugging harder.
**Recommendation:** Change games `tsconfig.json` to `"extends": "../../tsconfig.packages.json"` and remove the redundant `compilerOptions.composite` (inherited from root). Retain the games-specific overrides (`types: ["bun"]`, `paths`) and keep `__tests__` in `include`.
**Effort:** S

---

### F9. `render.yaml` Deploys Discord Bot via Node, Not Bun — P2

**Observation:** `render.yaml` configures the discord-bot worker with `runtime: node` and `startCommand: node apps/discord-bot/dist/index.js`. The dist is built by bunup targeting ESM. The bot uses bun workspace packages (`bun install` in `buildCommand`) but starts via `node`. The `apps/discord-bot` package is ESM-only (`"type": "module"`), which requires Node 18+ `--experimental-vm-modules` or native ESM support. The discord bot version (`1.1.2`) is also out of sync with all other packages (`1.3.0`), and `render.yaml` has no health-check, no auto-deploy branch pin, and no region specification.
**Why it matters:** ESM entrypoint via `node` on Render's Node runtime should work for Node 18+, but the runtime mismatch (bun workspace → node runtime) is a latent deployment risk if any workspace-resolved import uses bun-specific APIs. The version skew may indicate the bot is not being versioned with the rest of the monorepo via changesets (`discord-bot` is in `ignore:` in changeset config).
**Recommendation:** Either switch `runtime` to a bun-compatible option on Render (use a Docker runtime with `oven/bun` image) or accept Node ESM and document the constraint. Pin an explicit `startCommand: node --experimental-specifier-resolution=node apps/discord-bot/dist/index.js` if needed. Sync the discord-bot version or formally document that it versions independently.
**Effort:** M

---

### F10. `site` CI Job Runs Full `bun run build` Before Site Check — P3

**Observation:** `ci.yml` site job runs `bun run build` (builds roller + games + cli + discord-bot, all four packages sequentially) then `bun run --filter '@randsum/site' check`. The site only depends on `@randsum/roller` and `@randsum/dice-ui` (which is unbundled, pointing to `src/` directly). Building cli and discord-bot is unnecessary for site CI.
**Why it matters:** Adds ~30-60s to site CI jobs on every change to any package file (the site path filter triggers on all `packages/**` changes). Minor inefficiency, not a correctness issue.
**Recommendation:** Replace with `bun run --filter '@randsum/roller' build` (the only transitive build dependency of the site). The `dice-ui` package uses `src/` directly via workspace so it doesn't need a build step.
**Effort:** S

---

### F11. `bun pm pack` + `npm publish` Hybrid in Publish Script — P3

**Observation:** `scripts/publish.ts` uses `bun pm pack` to resolve `workspace:~` dependencies into a real semver tarball, then calls `npm publish <tgz>` on the result. The CLAUDE.md states "always `bun publish`, never `npm publish`" for workspace resolution. The script correctly uses `bun pm pack` to sidestep the workspace resolution issue, then delegates to `npm` only for the registry upload step. This is a valid workaround but diverges from documented guidance and introduces an npm version dependency (`npm@latest` is installed in CI). The dry-run also uses `npm publish --dry-run` which behaves differently from bun's dry-run.
**Why it matters:** Low risk — the pattern works — but creates drift from CLAUDE.md's documented approach and requires `npm@latest` as an additional install step in CI. The comment in publish.ts (line 11) is potentially misleading about OIDC being "automatic".
**Recommendation:** Update CLAUDE.md to document the actual `bun pm pack` + `npm publish` pattern and why it's used. Clarify in the script comment that OIDC provenance requires explicit `--provenance` and Trusted Publisher configuration, not just `id-token: write`.
**Effort:** S
