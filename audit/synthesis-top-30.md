# RANDSUM Top-30 Prioritized Improvements

_Synthesized: 2026-05-10_
_Source: 7 dimension audits in `audit/dimensions/` — 74 raw findings deduped + ranked_

Each item includes severity, dimension(s), single-sentence fix, and effort. References use `[dim:Fn]` notation pointing to the source file in `audit/dimensions/`.

---

## P0 — Blocks something real (1–6)

### 1. Wire `NPM_TOKEN` into `publish.yml`

**[build:F1]** The changesets step has no `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` mapping, so every automated publish 401s after creating the Version PR. **Fix:** Add the env mapping. **Effort:** S

### 2. Fix D&D 5e nat 1/20 inversion under advantage/disadvantage

**[games:F1]** `fifth.generated.ts` reads `initialRolls[0]` (RNG order) instead of `rolls[0]` (kept die), so crits invert when rolling with advantage/disadvantage. No test covers this case. **Fix:** Change spec to `field: 'final'`, regenerate, add advantage crit tests. **Effort:** S

### 3. Add `check:all` script (or fix the docs that reference it)

**[dx:F1]** Both `CONTRIBUTING.md` and `CLAUDE.md` instruct contributors to run `bun run check:all`; only `check` exists. First-time contributors hit a script-not-found error. **Fix:** Alias `"check:all": "bun run check"`. **Effort:** XS

### 4. Fix `@randsum/roller` `sideEffects` to restore tree-shaking

**[architecture:F3 + build:F3]** `"sideEffects": ["./src/**/*"]` never matches a published file (`src/` isn't in `files`), so bundlers fall back to "treat all as side-effectful". Every consumer pulls the full `index.js` even when importing one subpath. **Fix:** `"sideEffects": false`. **Effort:** XS

### 5. Fix or delete the broken expo IndexScreen tests + add expo to CI test matrix

**[apps:F3]** 10 tests assert `testID="desktop-two-col"`, `<details>`, `<summary>` that don't exist in the implementation. Tests would always fail — but expo isn't in `ci.yml`'s test job, so the breakage is silent. **Fix:** Implement the layout the tests describe (good a11y win) or delete the tests; either way add expo to CI. **Effort:** M

### 6. Wire CI to upload coverage to Codecov

**[testing:F2 + build:F2 + testing:F9]** `codecov.yml` declares 80%/70% gates but no workflow uploads lcov. The thresholds are decorative. Also: current `bun test --coverage` only instruments `packages/games/src/lib/` — roller is invisible. **Fix:** Add coverage step + Codecov upload to `ci.yml`; investigate roller-coverage scoping (likely needs per-package `--filter` then merge). **Effort:** S

---

## P1 — Real friction (7–22)

### 7. Drive games `lib/` coverage above 80%

**[testing:F1]** Aggregate is **35.6%** with `pipeline.ts` at 31% (~280 uncovered runtime lines), `emitDetails.ts` at 2.8%, `refResolver.ts` at 16.4%. A silent regression in pipeline collation, normalizer overrides, or codegen emit functions would generate broken game packages. **Fix:** Targeted unit tests for uncovered branches. **Effort:** M

### 8. Add `apps/rdn` test suite to validate conformance vector data

**[apps:F9 + testing:F3]** The roller's conformance suite imports vectors from `apps/rdn/src/conformance/vectors.ts`. A typo in `expectedTotal` would silently invalidate roller tests. `apps/rdn` has 0 test files. **Fix:** Add bun:test data-integrity tests (no duplicate IDs, valid expectedPool/Total, conformanceLevels are valid subsets). **Effort:** S

### 9. Consolidate TypeScript on a single version

**[architecture:F1 + build:F4]** TS 5.8.3 / 5.9.3 / 6.0.2 coexist (root devDep = 6.0.2, catalog = 5.9.3, games hardcodes 6.0.2, rdn pinned to 5.8.3). Different tsc behavior per package risks cross-package type incompatibility. **Fix:** Promote catalog to 6.0.2, replace all per-package pins with `catalog:`. **Effort:** S

### 10. Move `dice-ui`'s `ink` dependency to `peerDependencies` (optional)

**[architecture:F2]** Ink (~250KB TUI runtime) is in `dependencies` but only `apps/cli` actually needs it. `apps/site` and `apps/expo` consume `dice-ui` and risk pulling in TUI code if tree-shaking imperfect. **Fix:** `peerDependencies` + `peerDependenciesMeta.ink.optional: true`. **Effort:** S

### 11. Correct `!` modifier docs (or implement chaining)

**[roller:F1]** `description` field claims "Continues if new dice also max" but implementation is single-wave only. Diverges from Foundry/Roll20/Dice So Nice expectations. **Fix:** Update `explodeSchema.docs.description` to state single-wave behavior, or implement recursion. **Effort:** S

### 12. Remove `registry.parseModifiers` dead-code parser

**[roller:F2]** Two parser implementations — registry uses behavior-bearing `RANDSUM_MODIFIERS`, production path uses schema-only `MODIFIER_SCHEMAS`. Tests treat the registry version as canonical, but it's never called in production. They handle count sugar / duplicates differently. **Fix:** Delete `parseModifiers` from `registry.ts`, point tests at `notation/parse/parseModifiers`. **Effort:** S

### 13. Fix `explodeSequence` requirement guard mismatch

**[roller:F3]** Declares `requiresRollFn: true`, but `apply()` accesses `ctx.randomFn` (typed optional). A direct call with only `rollOne` passes the guard then throws a raw `Error` (not `ModifierError`). **Fix:** Add `requiresRandomFn` to registry validation, or rework to use `rollOne + parameters.sides`. **Effort:** S

### 14. CLI `-i` / `--interactive` flag — phantom in published README

**[apps:F1]** `apps/cli/README.md` documents a flag `parseArgs()` doesn't implement. Users hit "notation not found" instead of TUI mode. **Fix:** Either implement (trivial — set `interactive: boolean` and route to `render()`) or strip from README. **Effort:** XS–S

### 15. Resolve rdn version mismatch

**[apps:F8]** `apps/rdn` ships only `v0.9.0 Draft`, but CLI + Discord bot READMEs claim "RDN v1.0 Level 4 (Full) Conformant". **Fix:** Either ship the v1.0 spec from `jarvis/spec` branch OR roll README claims back to v0.9.0. **Effort:** XS now / M for full spec land

### 16. Add CI bench regression gate

**[testing:F4]** `bench:ci` script exists but is called from no workflow. A 2× regression in `roll()` would ship silently. **Fix:** Use `github-action-benchmark` or store JSON artifact and compare to previous main run with 20% threshold. **Effort:** S

### 17. Discord bot deployment — railway.json missing despite docs

**[apps:F6]** README has 96 lines of Railway deployment instructions referencing a `railway.json` that doesn't exist. No automated deploy job. **Fix:** Either commit a real `railway.json` + add a deploy workflow, or replace the README section with what's actually used. **Effort:** S

### 18. Expo native: builds in CI but never submitted to stores

**[apps:F5]** `expo-native-deploy.yml` runs production EAS builds on every push to main but never calls `eas submit`. Burns build minutes; users can't install the app. **Fix:** Add submit step (needs ASC API key + Play service account) OR gate native builds behind manual trigger. **Effort:** M

### 19. Add Root RPG mastery/helping mechanic

**[games:F2]** Root: The TTRPG's two most common rolls (Mastery perk, Helping action) both use 3d6 keep highest 2 — same as PbtA advantage. Currently inexpressible. **Fix:** Copy the `rollingWith: Advantage/Disadvantage` block from `pbta.randsum.json` verbatim. **Effort:** S

### 20. Fix `SECURITY.md` version table

**[dx:F2]** References `3.x.x` (legacy monolith). Current scoped packages are `1.3.0`. Wrong version family AND wrong package framing. **Fix:** Reference `@randsum/roller ≥ 1.3.0` etc., add a one-line SLA. **Effort:** S

### 21. Restart Changeset discipline + write retrospective changelog

**[dx:F3]** Root CHANGELOG frozen at `[3.0.0] — 2024`. Per-package changelogs each have one bootstrap entry whose message ("Testing changes for 2.0.0 release") actively misleads. ~269 commits in 90 days have zero changelog. **Fix:** Write retrospective 1.0–1.3 block per package, archive root CHANGELOG with monolith header, require Changeset on user-visible PRs going forward. **Effort:** M

### 22. Replace stock-default issue templates + add a PR template

**[dx:F4 + dx:F6]** `bug_report.md` asks for browser/device on a dice library. No PR template at all. **Fix:** RANDSUM-specific bug template (notation that reproduced bug, expected vs actual `roll()` output, version), `.github/PULL_REQUEST_TEMPLATE.md` with summary/type/checklist. **Effort:** S

---

## P2 — Worth doing, less urgent (23–30)

### 23. Author-gate `claude-code-review` workflow + add `pull-requests: write`

**[build:F6]** Runs on every PR including Dependabot, no author filter, missing `pull-requests: write` perms (review may compute but fail to post). **Fix:** Restrict to non-bot authors via `author_association`, add the missing permission. **Effort:** S

### 24. Remove unused expo deps (~14MB+ of dead weight)

**[apps:F4]** `@expo/vector-icons`, `expo-constants`, `expo-crypto`, `expo-linking` declared but never imported. `expo-sqlite` imported only by an unused `storage.native.ts`. **Fix:** Remove the 4 dead deps; either wire SQLite to a feature or delete `storage.native.ts`. **Effort:** XS–M

### 25. CLI: stdin/pipe support + non-zero exit on error

**[apps:F2]** Always exits 0, errors go to stdout. Breaks `randsum 4d6L --json | jq '.total'` style usage. **Fix:** `process.exit(1)` on throws; read stdin when no args + non-TTY. **Effort:** S

### 26. Discord bot: ephemeral roll option

**[apps:F7]** Every command responds publicly. Standard dice-bot pattern is a `private/ephemeral` flag (GM secret rolls, etc.). **Fix:** Add `hidden: boolean` option to `/roll` and game commands, pass `MessageFlags.Ephemeral`. **Effort:** S

### 27. Publish TypeDoc API reference

**[dx:F7]** `typedoc.json` is fully configured. `roll()` has ~250 JSDoc blocks. No `docs:build` script, no CI step, no published URL. **Fix:** Add script, build during site deploy, link from roller README + site nav. **Effort:** M

### 28. Add Roadmap + Discord invite + Community section to root README

**[dx:F8 + dx:F12]** README has no link to project board, no Discord invite (URL exists at `randsum.dev/discord/`), no roadmap teaser. Project actively evolving but invisible to first-time visitors. **Fix:** One Roadmap section with project board link + Discord invite + upcoming-games one-liner. **Effort:** S

### 29. Fix `traceRoll` arithmetic step type for `integerDivide` and `modulo`

**[roller:F5]** Both modifiers use `createScaleBehavior` but are absent from `ARITHMETIC_MODIFIERS`. `traceRoll` falls into the default rolls-diff branch, emitting a misleading empty `kind: 'rolls'` step. Not tested. **Fix:** Add both to `ARITHMETIC_MODIFIERS` map with `÷` and `%` signs; cover in `trace.test.ts`. **Effort:** S

### 30. Pre-commit hook race: serialize `bun install` before parallel steps

**[build:F5]** `parallel: true` at the pre-commit level starts `install` simultaneously with `lint`/`format`/`typecheck`/`codegen-check`. On fresh checkouts or after dep changes, install may not complete before lint resolves workspace packages — flaky failures push devs toward `--no-verify`. **Fix:** Move `install` to its own priority-1 step, then run the rest in parallel. **Effort:** S

---

## Honorable mentions (didn't make top 30)

These are real but smaller-impact or already-tracked elsewhere:

- Rasterize `og-image.svg` to PNG — Twitter/Slack/Discord render blank social cards [apps:F11]
- Pin `@stackblitz/sdk` from `"latest"` to an exact version [architecture:F7]
- Eliminate `notation/definitions/` dual-schema directory (or update CLAUDE.md) [roller:F9]
- Export `notation()` from `@randsum/roller` main barrel [roller:F6]
- Cap post-explosion pool size for `!` (parity with depth caps elsewhere) [roller:F4]
- Discord bot README "Adding New Commands" section is stale post-barrel refactor [apps:F12]
- D&D 5e `4d6L` ability score generation roll absent [games:F4]
- Blades resistance roll outcome interpretation undocumented [games:F3]
- Daggerheart `'critical hope'` label conflates crit + Hope-side outcome [games:F11]
- Salvage Union `lookupByRange` falls back silently to `'No result'` on remote-table gap [games:F10]
- Type-level test coverage missing for return types (`RollerRollResult`, `GameRollResult`) [testing:F6]
- Property tests for modifier composition missing [testing:F8]
- Pre-push test output truncated to 5 lines hides which package failed [build:F7]
- `apps/site` builds CLI + discord-bot in CI unnecessarily [build:F10]
- `render.yaml` runs discord-bot via Node despite ESM-only build [build:F9]
- `STRESS_ITERATIONS` constant duplicated across roller + games [testing:F5]
- Pre-commit codegen check glob misses hand-edits to `.generated.ts` files [games:F5]
- No `FUNDING.yml` / GitHub Sponsor button [dx:F5]
- `llms.txt` is a 42-line stub; no `llms-full.txt` covering games or codegen [dx:F10]
- `CONTRIBUTING.md` omits the "add a modifier" path [dx:F9]

---

## Cross-cutting themes

1. **Decorative gates** — Codecov thresholds, `bench:ci`, `claude-code-review`, `eas submit` all configured but not actually enforced/wired. Pattern: infrastructure exists, last-mile activation missed.
2. **Doc-vs-reality drift** — `check:all`, CLI `-i`, "v1.0 conformant", `railway.json`, "Adding New Commands", SECURITY.md monolith table, root CHANGELOG frozen at 3.0.0. Pattern: docs ship and are then never re-verified after refactors.
3. **Test coverage misallocation** — 109 test files in roller (~7.7K LOC) vs 35.6% lib coverage in games (~5.8K LOC) and 0 tests in `apps/rdn` despite it being normative. Pattern: most-loved package gets the love; critical-path peers go bare.
4. **Generated-code drift surface** — `gen:check` runs only at push (or on spec edits), so a hand-edited `.generated.ts` can land in commits. Combined with low pipeline coverage (#7), drift could ship.
5. **Adoption infrastructure underdeveloped** — no PR template, no FUNDING, no published API docs, no Discord invite in README, no roadmap link. Pattern: code is a 9/10, community/discoverability is a 5/10.
