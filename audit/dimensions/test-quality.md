# Test Quality

_Dimension of the randsum-monorepo audit — generated 2026-06-23_

**Grade: A− (88 / 100)**

> **Confidence: High.** Metrics are measured (file counts, LOC, skip/flaky greps,
> CI config inspection) rather than estimated. Coverage _targets_ are cited from
> `codecov.yml` and CI; live coverage _percentages_ are not measured here (no
> committed report) — Codecov hosts them. The 15 test "failures" observed on a
> raw worktree run were root-caused to a missing build artifact, not a defect
> (see Flakiness), and confirmed green (17/0) after `bun run build`.

## Summary

The randsum monorepo has a mature, well-architected test suite. 193 test files
span unit, property-based, stress, conformance-vector, integration, and e2e
layers. The test-to-code ratio is ~1.21:1 (27,749 test LOC over 22,858 non-test
source LOC), and the core engine alone runs 2,702 tests across 114 files. Test
code is healthy: only one file exceeds 800 LOC, skips are few and each carries an
explicit documented reason, and there are zero "flaky"/"TODO: fix" markers.
Sampled tests show genuine depth (real invariants, a true cross-boundary
integration test, dist-output smoke tests) rather than shallow assertion
padding. Marks are withheld from a full A only because integration/e2e coverage
is thin at the app layer and live coverage numbers live off-repo in Codecov.

## Metrics

| Metric                                           | Value                                                       | Source             |
| ------------------------------------------------ | ----------------------------------------------------------- | ------------------ |
| Test files                                       | 193 (`*.test.ts` / `*.test.tsx`)                            | `find`             |
| Test LOC                                         | 27,749                                                      | `wc -l`            |
| Non-test source LOC (ts/tsx, excl. dist)         | 22,858                                                      | `wc -l`            |
| **Test-to-code ratio**                           | **~1.21 : 1**                                               | derived            |
| Property-based test files                        | 13 (`*.property.test.ts`), 18 files import `fast-check`     | `find` / `grep`    |
| Core-engine test count                           | 2,702 tests / 114 files / 1.46M `expect()` calls            | `bun test` run     |
| Skipped tests                                    | 3 `test.skip` + 2 `test.todo` (all with documented reasons) | `grep`             |
| Flakiness markers (`flaky`/`TODO: fix`/`.retry`) | 0                                                           | `grep`             |
| Test files > 800 LOC                             | 1 (`notation/definitions.test.ts`, 987 LOC)                 | `wc -l`            |
| Coverage % (live)                                | Not measured here — tracked in Codecov                      | `codecov.yml` / CI |

## Layer Presence

| Layer              | Present     | Evidence                                                                                                                                                                                                                                                                            |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit               | **Yes**     | `__tests__/` throughout every package; roller dirs `roll/`, `notation/`, `lib/modifiers/`, `types/`, `trace/`                                                                                                                                                                       |
| Property-based     | **Yes**     | 13 `*.property.test.ts` files using `fast-check`; sampled `fifth` test asserts real d20+modifier invariants (range, advantage = 2d20-keep-highest)                                                                                                                                  |
| Stress             | **Yes**     | 9999-iteration boundary suites (per project convention)                                                                                                                                                                                                                             |
| Conformance / spec | **Yes**     | `roller/__tests__/spec/` with `conformance-vectors.test.ts` + `s06/s09/s10` pipeline/safety/level dirs — vectors driving the notation spec                                                                                                                                          |
| Integration        | **Partial** | `apps/discord-bot/__tests__/integration/roll.integration.test.ts` is a genuine un-mocked cross-boundary test (real roller + seeded random → asserts the actual Discord embed). Roller has `specialDice.integration.test.ts`. Only the discord-bot app exercises this systematically |
| Dist/output smoke  | **Yes**     | `dist.smoke.test.ts`, `esm-only.test.ts`, `roll.dist.types.test.ts` test the _built_ `dist/` output — catches packaging regressions most suites miss                                                                                                                                |
| End-to-end         | **Partial** | `apps/expo/e2e/` (`roll.e2e.ts`, `serve.ts`, README) — present but minimal; no Playwright/Cypress browser suite for the docs sites                                                                                                                                                  |

Pyramid shape is healthy and correctly weighted: a broad, deep unit + property
base under the zero-dependency core, a thin and _deliberate_ integration/e2e cap.
This is the right shape for a library-centric monorepo (the value is in the
engine; apps are thin consumers).

## Coverage Indicators

- **Codecov configured** (`codecov.yml`): project target **80%** (threshold 5%),
  patch target **70%**; `dice-ui` carries its own lower flag (50% project / 60%
  patch) with a documented ratchet-up plan. Per-package carryforward flags for
  `roller`, `games`, `dice-ui`.
- **CI uploads coverage** (`.github/workflows/ci.yml`): dedicated jobs run
  `test:coverage` for `@randsum/roller`, `@randsum/games`, and `@randsum/dice-ui`,
  uploading `lcov.info` to Codecov (pinned action SHA, token via secret). dice-ui
  upload is guarded `if hashFiles(...lcov.info) != ''`.
- One file ignored from coverage (`apps/cli/src/tui/hooks/useCursorPosition.ts`) —
  scoped and reasonable.
- No committed coverage report in the tree, so a live percentage is not asserted
  here; Codecov holds the authoritative number. Targets are real and enforced.

## Flakiness Signals

- **Zero** retry annotations or "flaky"/"TODO: fix" comments in test code.
- 5 non-running tests, **all documented**: `conformance-vectors.test.ts` uses
  `test.todo` for a tracked CONFORMANCE GAP and `test.skip` for three cases the
  seeded-random harness provably can't drive (null expected pool, custom string
  faces, draw-die Fisher-Yates shuffle); `rosettaStone.test.ts` skips
  non-standalone notation fragments. These are honest exclusions, not hidden
  failures — a positive discipline signal.
- **Worktree run anomaly (not a defect):** a raw `bun run --filter @randsum/roller
test` reported 15 fail + 4 errors. Every one was a `(dist)` smoke test failing
  with `Cannot find module '.../dist/index.js'` because the clean audit worktree
  had no build output. After `bun run build`, the same suites pass **17/0**. The
  pre-push hook runs `build` at priority 1, so CI never hits this. Worth a guard
  (skip-with-message when `dist/` is absent) so the failure mode is
  self-explanatory to a fresh contributor.

## Test Code Health

- **Sizing:** only 1 of 193 files exceeds 800 LOC (`notation/definitions.test.ts`,
  987 — a data-table notation suite where length is inherent, low risk).
- **Depth over breadth:** sampled tests assert real behavior. The discord-bot
  integration test injects a seeded PRNG into the _un-mocked_ engine and asserts
  the exact embed the user receives — explicitly the one test that would catch a
  result-shape regression the mocked unit tests can't. Property tests assert
  algebraic invariants, not snapshots.
- **Mocking discipline:** discord-bot mocks only `@randsum/games/*` and
  `@randsum/roller/*` subpaths, using real discord.js builders — avoiding the
  "mock everything" anti-pattern, and backstopped by the un-mocked integration
  test.
- **No snapshot sprawl** observed in sampling.
- **Seeded determinism** (`createSeededRandom(42)`, queue randoms) is the standard
  fixture pattern, keeping a stochastic domain reproducible.

## Recommendations

1. **(Low) Guard the dist-smoke tests.** Detect a missing `dist/` and `test.skip`
   with a "run `bun run build` first" message, so a fresh-worktree run doesn't
   surface 15+ confusing failures that are really a missing build step.
2. **(Medium) Broaden app-layer integration/e2e.** The discord-bot integration
   test is exemplary — replicate that un-mocked cross-boundary pattern for the
   `cli` app, and add at least a smoke e2e for the `site`/`rdn` docs builds. The
   expo e2e is currently minimal.
3. **(Low) Surface live coverage in-repo.** Add a Codecov coverage badge to the
   README (the data exists; it's just not visible without leaving the repo), and
   keep ratcheting the `dice-ui` target as its component tests land.
4. **(Low) Keep the largest test file in check.** `notation/definitions.test.ts`
   (987 LOC) is fine as a data table, but if it grows further, split by notation
   category to preserve navigability.

## Framework Anchors

- **ISO/IEC 25010 §6.5.4 (Testability):** strong — seeded determinism, layered
  suites, and dist-output tests make the system highly testable and the suite
  trustworthy.
- **DORA / Accelerate (continuous testing):** strong — tests are gated in CI and
  in the pre-push hook alongside conformance and security checks.
- **Test pyramid (Cohn):** correctly shaped for a library monorepo — deep
  unit/property base, deliberate thin integration/e2e cap.
