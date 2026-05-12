# Testing & Quality Audit

_Audited: 2026-05-10_

## Summary

The roller package has deep, well-structured test coverage (109 files, property tests, roundtrip tests, conformance vectors, a `.test-d.ts` type file, stress tests). The games package has broad integration coverage per game plus solid codegen snapshot/unit tests — but the **runtime library layer** (`packages/games/src/lib/`) is severely undercovered: the lcov report shows an aggregate of **~35.6% line coverage across 17 measurable source files**, with 16/17 files below 80%. This is the primary testing risk. Secondary risks: no CI coverage upload step (codecov thresholds exist but are never enforced), no benchmark regression gate, `apps/rdn` has zero tests despite hosting the normative conformance vector data, and `STRESS_ITERATIONS` is duplicated across packages.

Coverage is only tracked locally via `bun run test:coverage` — there is **no CI step that collects coverage and uploads to Codecov**, so the `codecov.yml` thresholds (80% project / 70% patch) are aspirational, not enforced.

---

## Findings

### F1. Games `src/lib/` Coverage Catastrophically Below 80% — P0

**Observation:** The lcov report at `/Users/jarvis/Code/RANDSUM/@RANDSUM/coverage/lcov.info` (generated from `bun run test:coverage`) covers only `packages/games/src/lib/` — no roller source. Across 17 files:

| File                       | Coverage               |
| -------------------------- | ---------------------- |
| `codegen/emitDetails.ts`   | **2.8%** (4/141 lines) |
| `refResolver.ts`           | **16.4%** (10/61)      |
| `conditionEvaluator.ts`    | **19.4%** (7/36)       |
| `inputBinder.ts`           | **23.8%** (5/21)       |
| `modifierTranslator.ts`    | **25.0%** (10/40)      |
| `pipeline.ts`              | **31.0%** (126/407)    |
| `codegen/emitBody.ts`      | **31.4%** (98/312)     |
| `typeGuards.ts`            | **31.8%** (7/22)       |
| `codegen/emitModifiers.ts` | **38.2%** (21/55)      |
| `codegen/emitOutcome.ts`   | **38.7%** (48/124)     |
| `normalizer.ts`            | **43.8%** (70/160)     |
| `codegen/emitHelpers.ts`   | **44.9%** (79/176)     |
| `loader.ts`                | **50.0%** (24/48)      |
| `codegen.ts` (root entry)  | **52.2%** (60/115)     |
| `rangeCoverage.ts`         | **57.1%** (97/170)     |
| `errors.ts`                | **100%**               |
| Overall                    | **35.6%** (679/1906)   |

The codegen snapshot tests (`codegen-snapshots.test.ts`) exercise the full round-trip spec→code path for the 6 live game specs, but the codegen sub-functions responsible for emitting body, details, modifiers, and outcome are only touched for the shapes those 6 specs happen to use. Branches for other resolve strategies, pool conditions, degree-of-success variants, and modifier combinations go un-hit. `pipeline.ts` at 31% means about 280 lines of runtime roll-execution logic have no test coverage.

**Why it matters:** The games `lib/` layer is the most critical non-roller code in the repo. A silent regression in `pipeline.ts`, `normalizer.ts`, or an emit function would generate broken game packages without any test detecting it. The `gen:check` gate only catches drift in generated text, not correctness of execution.

**Recommendation:** Add targeted unit tests for the uncovered branches in `pipeline.ts` (especially `postResolveModifiers`, multi-pool collation, `degreeOfSuccess`), `normalizer.ts` (conditional overrides with multiple `when` entries, `poolCondition`, `resultShape`), and the `emitDetails`/`emitBody` codegen paths for shapes not represented by any current spec. Target ≥70% on each file. `emitDetails.ts` at 2.8% is a P0 gap — a single integration test covering `details` field generation would cover most of it.

**Effort:** M

---

### F2. Codecov Thresholds Never Enforced — P0

**Observation:** `codecov.yml` declares project 80% / patch 70% thresholds, but the CI pipeline (`ci.yml`) has **no step that runs `bun run test:coverage` or uploads an lcov artifact to Codecov**. The `test` run in each package job runs via `bun run check` which calls `bun test` (no coverage flag). The Codecov configuration is entirely decorative.

**Why it matters:** Coverage requirements that aren't enforced in CI provide a false sense of safety. The 35.6% games `lib/` coverage would never block a PR under the current setup.

**Recommendation:** Add a coverage job (or extend an existing job) in `ci.yml` that runs `bun test --coverage --coverage-reporter=lcov --coverage-dir=./coverage` across the roller and games packages, then uploads the result via `codecov/codecov-action`. Gate coverage failures on the Codecov status check in branch protection.

**Effort:** S

---

### F3. `apps/rdn` Has 0 Tests Despite Hosting Normative Conformance Vector Data — P1

**Observation:** `apps/rdn` (notation.randsum.dev) has 0 test files. Its `package.json` has no `test` script. Yet `apps/rdn/src/conformance/vectors.ts` is the **authoritative source** for the 48 RANDSUM notation conformance vectors — the roller's conformance suite (`packages/roller/__tests__/spec/conformance-vectors.test.ts`) directly imports from this file. If the vectors file is mis-edited, the conformance test may pass with wrong expected values rather than catching a roller regression. The app also runs a `conformance:gen` script that generates `public/conformance/v0.9.0.json` from TypeScript; there is a `conformance:check` in the pre-push hook but no runtime validation that vector data is internally consistent.

**Why it matters:** Correctness of the conformance vector data is not tested. A typo in `expectedTotal` or `expectedPool` would cause a conformance test to incorrectly pass or fail without surfacing the vector file as the source of truth issue.

**Recommendation:** Add `bun:test` tests to `apps/rdn` that: (1) assert each non-error, non-indeterminate vector has `expectedPool` and `expectedTotal` with sensible values, (2) assert `conformanceLevels` membership arrays are subsets of actual vector IDs, (3) assert no duplicate vector IDs. These are pure data-integrity tests requiring no network or browser. Add a `test` script to `apps/rdn/package.json`.

**Effort:** S

---

### F4. Benchmark Suite Has No CI Regression Gate — P1

**Observation:** `bench:ci` script exists at the root (`bun run packages/roller/__benchmarks__/roll.bench.ts --json > benchmark-results.json`) but is called from **zero CI workflow steps**. The mitata bench output is never compared to a baseline. No performance regression would block a PR.

**Why it matters:** The roller is a zero-dependency dice engine where performance matters (it's called in game-package loops and Discord bot commands). Without a CI gate, a 2× regression in `roll()` throughput would ship silently.

**Recommendation:** Use `github-action-benchmark` (or a simple inline comparison) to store `benchmark-results.json` as a CI artifact and compare it against the previous `main` run. A 20% regression threshold is a reasonable starting point. The `bench:ci` script already produces the right JSON shape. The missing step is the comparison and gate.

**Effort:** S

---

### F5. `STRESS_ITERATIONS` Constant Is Duplicated — P2

**Observation:** The constant is defined in two independent files:

- `packages/roller/__tests__/stressIterations.ts`
- `packages/games/__tests__/stressIterations.ts`

Both have identical value (9999) and identical JSDoc. The games tests that use it (`daggerheart.test.ts`, `fifth.test.ts`, `root-rpg.test.ts`) import from their local copy rather than the roller's `test-utils`.

**Why it matters:** Low individual risk, but represents a pattern where shared test infrastructure drifts rather than consolidating. If the value or rationale needs to change, both files must be updated independently.

**Recommendation:** Move `STRESS_ITERATIONS` into `packages/roller/test-utils/src/` (which already exports `createSeededRandom` and `createQueueRandom`) and have the games package import it from there via `workspace:~`. This is a 3-file change.

**Effort:** S

---

### F6. Type-Level Test Coverage Is Narrow — P2

**Observation:** There is one `.test-d.ts` file: `packages/roller/__tests__/types/notation.test-d.ts`. It tests `DiceNotation` and `RollArgument` template literal types via `@ts-expect-error` assertions and is run implicitly via `tsc --noEmit` (the `typecheck` script). However, **return types of `roll()`** (`RollerRollResult`), subpath export types (`RollRecord`, `ValidationResult`, discriminated union shapes), and game package types (`GameRollResult<TResult, TDetails, TRollRecord>`) have no type-level tests. These are the types consumers depend on for type safety.

**Why it matters:** A refactor that narrows a `RollerRollResult` field (e.g., making `.rolls[n].modifierLogs` optional) could break downstream consumers without the runtime test suite detecting it, since runtime tests only check values, not types.

**Recommendation:** Add `__tests__/types/rollResult.test-d.ts` (roller) and `__tests__/types/gameRollResult.test-d.ts` (games) covering: `roll()` return type shape, discriminated union exhaustiveness on `ValidationResult`, `GameRollResult` generic constraints, and subpath export surface. Use `@ts-expect-error` for negative cases; rely on `tsc --noEmit` for positive cases.

**Effort:** S

---

### F7. Discord Bot Tests Are Shallow on Game Command Flows — P2

**Observation:** All 11 discord-bot test files exercise the happy path and a few error paths for each slash command. The game command tests (`blades.test.ts`, `dh.test.ts`, etc.) mock the `@randsum/games/*` `roll()` function with a fixed return value — meaning the tests validate embed formatting logic but not the game integration. The `roll.test.ts` is notably better: it uses real `@randsum/roller` implementations under a spy wrapper and tests 8 distinct scenarios including the `suggestNotationFix` path. Discord's `interactionCreate` routing is untested (no test for unknown command names, autocomplete routing, or the guildCreate welcome embed content beyond "joined a guild").

**Why it matters:** Shallow mocking in game command tests means a breaking change to a game's `roll()` return type (e.g., renaming `result: 'success'` to `result: 'hit'`) would not be caught — the bot would silently display wrong embed titles. The guildCreate event has one test (`guildCreate.test.ts`) but it's unclear it exercises the embed's channel-finding logic.

**Recommendation:** For the game command tests, replace fixed mock returns with typed stubs that match the actual `GameRollResult` shape using `import type` — this makes structural mismatches a TypeScript error rather than a silent runtime bug. Add a test for `interactionCreate` routing with an unknown command name to confirm the handler ignores it gracefully.

**Effort:** S

---

### F8. Property Tests for Modifier Composition Are Missing — P2

**Observation:** Property tests in roller (`roll.property.test.ts`, `notationSugar.property.test.ts`, `specialDice.property.test.ts`) cover basic bounds and drop/keep invariants well. However, `log.property.test.ts` is the only modifier-specific property test, and it only tests the logging metadata. **No property tests exist for modifier composition** (e.g., "reroll + keep highest never produces a total outside bounds", "explode always produces more dice than the initial pool", "unique modifier always produces a pool where no two values are equal for sides ≥ quantity"). The `ModifierEngine.test.ts` covers these behaviors with unit tests at specific fixed seeds, but property testing would catch the long-tail edge cases that 9999-iteration stress tests also aim for but with brute force rather than shrinkable counterexamples.

**Why it matters:** The modifier system is the most complex part of the roller. Composed modifiers (e.g., `4d6L!R{1}`) interact in ways that are hard to reason about. Fast-check's shrinking makes it far easier to diagnose failures than a stress test's raw iteration count.

**Recommendation:** Add `packages/roller/__tests__/lib/modifiers/composition.property.test.ts` covering at minimum: reroll never exceeds original pool bounds, explode always grows the pool, unique + keep-highest still respects bounds, compound accumulates into single dice. Use `fc.integer` for sides/quantity and `createSeededRandom` for determinism on failure.

**Effort:** M

---

### F9. Coverage Collection Scope Excludes Roller — P1

**Observation:** The `bun run test:coverage` command in the root `package.json` runs `bun test --coverage` from the root directory, but the resulting `coverage/lcov.info` only contains entries from `packages/games/src/lib/`. The roller source (`packages/roller/src/`) is entirely absent from the report. This is likely because coverage collection depends on which test files are discovered from the workspace root and which source is instrumented.

**Why it matters:** Roller coverage — the most critical package — is completely invisible. It's impossible to know whether specific modifier implementations or edge-case notation paths are actually exercised.

**Recommendation:** Investigate whether `bunfig.toml` or the `test:coverage` script needs explicit `--coverage-include` flags to include roller source. If bun's coverage from a workspace root has known limitations, run per-package coverage (`bun run --filter '@randsum/roller' test:coverage`) and merge the lcov results before uploading to Codecov. This is a prerequisite for F2's enforcement fix.

**Effort:** S

---

### F10. Known Conformance Gaps Are Surfaced but Not Tracked — P2

**Observation:** `packages/roller/__tests__/spec/conformance-vectors.test.ts` uses `test.todo` for 3 known gaps (vector 2: bare `dN` notation; vector 39: `!s{values}` semantics mismatch; vector 47: multiple Count modifiers silently accepted). This is an excellent practice — they're visible in test output. However, there is no corresponding issue in the GitHub project, no `// TODO: #issue-number` comment, and no CI gate that would fail if the number of `.todo` tests _increased_ (indicating new conformance regressions rather than intentional gaps).

**Why it matters:** Conformance gaps can silently grow. A developer adding a new spec feature might notice a new vector fail and mark it `.todo` rather than opening an issue — making the ecosystem appear more compliant than it is.

**Recommendation:** (1) Open GitHub issues for all 3 known gaps and annotate the `test.todo` calls with `// TODO: #NNN`. (2) Add a CI step that parses test output for the count of `.todo` tests and fails if the count exceeds the current baseline of 3. A simple `bun test 2>&1 | grep -c 'todo'` comparison would suffice.

**Effort:** S
