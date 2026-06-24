# Remediation Plan

_Generated: 2026-06-23_
_Sources: dimensions/\*.md, ontology.md_

## Methodology

This plan synthesizes findings across the eight baseline audit dimensions plus
the conditional **infrastructure** dimension (which qualified — the repo ships
managed-PaaS config-as-code: `render.yaml`, two `netlify.toml`, Expo `eas.json`),
and the ontology. Items are merged across dimensions where the root cause and
mitigation are shared. Each item is scored for severity and risk reduction, then
grouped into Now / Next / Later **priority buckets** — not time buckets. Within
each bucket, items are ordered by risk-reduction × severity (biggest leverage
first).

This plan deliberately does **not** include effort sizing, duration estimates,
or team-shape projections. LLM effort estimation is unreliable, and the Gnar
delivery model (agentic) does not match the developer-week assumptions baked
into traditional S/M/L sizing or "N-person team over Y quarters" projections.

**Context.** This is a healthy, mature, single-maintainer TypeScript dice-library
monorepo. The scorecard is uniformly strong (architecture A, delivery A,
documentation A, infrastructure A; test-quality A−, security A−, performance A−;
maintainability B, reliability B). There are **no Critical or High-severity
findings.** Every item below is Medium or Low — polish, hygiene, and
observability "last-mile" work, not risk mitigation against latent outages. The
"Now" bucket therefore holds the highest-leverage _quick wins_, not emergencies.

**Discrepancy reconciled (load-bearing).** The performance report (R1, its
single highest-leverage recommendation) claims _"no benchmark regression gate
exists."_ This is **incorrect / stale.** Reading `.github/workflows/ci.yml`
directly confirms a `bench (regression gate)` job (lines 213-245) that runs
`bun run bench:ci`, restores a cached baseline, and uses
`benchmark-action/github-action-benchmark` with `fail-on-alert: true` and
`alert-threshold: '150%'` — exactly the gate performance R1 asks for. The
delivery report ("benchmark regression gate, fail-on-alert at 150%") is the
correct read. The gate **already exists**, so performance R1 is dropped from
this roadmap as already-satisfied; item **L6** instead captures the only
residual nuance (the gate is gated on `roller` path-changes, so a games/CLI-only
change won't re-baseline — minor and arguably correct).

## Now (highest priority — quick wins)

### N1 — Correct the stale `apps/discord-bot/README.md` hosting path (pm2 → Render)

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Documentation
- **Evidence:** [documentation.md F2](dimensions/documentation.md#f2--known-stale-appsdiscord-botreadmemd-flagged-but-not-corrected)
- **Discipline:** docs
- **Why now:** Confidently-wrong doc, already acknowledged-but-uncorrected in
  `apps/DEPLOY.md`. A one-file fix closing a known doc-rot vector — the highest
  risk-reduction-per-edit item in the audit.
- **Acceptance criteria:**
  - `apps/discord-bot/README.md:182` no longer presents `node dist/index.js` via
    `pm2 / systemd / docker` as the production run path.
  - Render (per `render.yaml`) is documented as the source of truth for hosting;
    any self-host block is explicitly marked "alternative self-host, not
    production."
  - No remaining contradiction between `apps/discord-bot/README.md` and
    `apps/DEPLOY.md:117-118`.

### N2 — Confirm (and enable if absent) branch protection requiring `ci-gate` on `main`

- **Severity:** Low
- **Risk reduction:** Medium
- **Source dimensions:** Delivery
- **Evidence:** [delivery.md F2](dimensions/delivery.md#f2--branch-protection--required-status-checks-on-main-not-verifiable-from-worktree)
- **Discipline:** build
- **Why now:** `main` auto-deploys to four targets. A configured-but-not-_required_
  `ci-gate` means an un-gated merge could ship unverified code. The gate is built
  and intended to be enforcing; this only verifies the repo-settings fact the
  worktree can't see.
- **Acceptance criteria:**
  - GitHub branch protection on `main` requires the `ci-gate` status check.
  - At least one review/approval is required before merge to `main`.
  - Verification recorded (e.g. a screenshot or a note in a runbook).

### N3 — Confirm hypothesis-grade PaaS declarations against live platform state (once)

- **Severity:** Low
- **Risk reduction:** Medium
- **Source dimensions:** Infrastructure
- **Evidence:** [infrastructure.md R2](dimensions/infrastructure.md#recommendations), [infrastructure.md F3](dimensions/infrastructure.md#f3--no-automated-drift-detection-or-config-scan-tooling)
- **Discipline:** infrastructure
- **Why now:** The entire infrastructure A-grade rests on _declared_ config that
  was never checked against provisioned state. A one-time confirmation converts a
  hypothesis into a fact cheaply, and seeds the drift gap in N7/L7.
- **Acceptance criteria:**
  - Render env vars confirmed all `sync:false` in the dashboard; live
    `BUN_VERSION` matches committed `render.yaml` (`1.3.14`).
  - Netlify build env confirmed to match each `apps/*/netlify.toml`; EAS project
    bindings confirmed current.
  - Verification date recorded in `runbooks/DEPLOY.md`.

### N4 — Add `fast-check` property tests around `parseArguments.ts` multi-pool splitting

- **Severity:** Low
- **Risk reduction:** Medium
- **Source dimensions:** Maintainability
- **Evidence:** [maintainability.md F3](dimensions/maintainability.md#f3--multi-pool-notation-parsing-concentrates-regex-complexity), [maintainability.md R3](dimensions/maintainability.md#recommendations)
- **Discipline:** reliability
- **Why now:** `parseArguments.ts` is the highest-churn + moderate-complexity file
  in the engine and the origin of notation edge-case bugs (`"1d20+2d6"`). Locking
  its behavior with property tests is a quick win that hardens the core's most
  bug-prone surface without restructuring it.
- **Acceptance criteria:**
  - New `*.property.test.ts` covers signed/unsigned multi-pool boundaries and
    special-die collisions (`D{..}` / `DD` / `d%`).
  - Tests pass and run in the roller CI job.

### N5 — Manifest hygiene: prune unused deps and fix the expo `tsconfig.base` reference

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Maintainability
- **Evidence:** [maintainability.md F5](dimensions/maintainability.md#f5--minor-unused-dependencies-dead-code-hygiene), [maintainability.md R4](dimensions/maintainability.md#recommendations)
- **Discipline:** build
- **Why now:** `knip` already flags the items; a clean sweep restores full
  dead-code coverage in CI (the expo `tsconfig.base` load error currently leaves
  expo's dead-export sweep partial).
- **Acceptance criteria:**
  - The 6 unused (dev)dependencies flagged by `bun run knip` are removed or
    justified.
  - `apps/expo` `tsconfig` no longer references the missing `expo/tsconfig.base`;
    `knip` completes the expo sweep without load errors.

### N6 — Prune stale remote branches (delete-on-merge + sweep `story/*`, `jarvis/p*`)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Delivery
- **Evidence:** [delivery.md F1](dimensions/delivery.md#f1--branch-sprawl-16-unmerged-remote-branches-several-stale-3-months), [delivery.md R3](dimensions/delivery.md#recommendations)
- **Discipline:** build
- **Why now:** 16 unmerged remote branches (~7 stale) are cosmetic clutter that
  masks in-flight work; pruning is trivial and reduces ambiguity.
- **Acceptance criteria:**
  - Enable delete-on-merge for squash-merged PRs.
  - Stale `story/*` and `jarvis/p*` branches with no open PR / recent activity are
    deleted.

## Next (structural leverage)

### N7 — Activate the Discord-bot error tracker and add a Sentry DSN

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Reliability, Infrastructure
- **Evidence:** [reliability.md F1](dimensions/reliability.md#f1--error-tracker-is-configured-but-never-forwards-no-op-sentry-stub), [reliability.md R1](dimensions/reliability.md#recommendations), [infrastructure.md R5](dimensions/infrastructure.md#recommendations)
- **Discipline:** observability
- **Why:** The `forwardToSentry` body is an empty no-op stub, so even with a DSN
  set, exceptions never leave Render logs — "observability theater." Merged with
  infrastructure R5 (same seam, same fix): the single-instance worker's outage-prone
  SPOF currently has no runtime error aggregation.
- **Acceptance criteria:**
  - `forwardToSentry` (`apps/discord-bot/src/utils/errorTracker.ts:42`) delivers
    to a real tracker (Sentry SDK or a dependency-thin HTTP-DSN POST), gated on
    `SENTRY_DSN`.
  - A Sentry DSN (or equivalent) is configured for the deployed worker.
  - A test exercises the forward path (mocked transport) so the stub can't
    silently regress.

### N8 — Add an application-level liveness signal + gateway instrumentation for the bot

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Reliability, Infrastructure
- **Evidence:** [reliability.md F2](dimensions/reliability.md#f2--no-health--liveness-signal-for-the-single-instance-gateway-worker), [reliability.md R2](dimensions/reliability.md#recommendations), [infrastructure.md F1](dimensions/infrastructure.md#f1--single-instance-discord-worker-is-a-single-point-of-failure), [infrastructure.md R3](dimensions/infrastructure.md#recommendations)
- **Discipline:** observability
- **Why:** The bot is a Render `worker` with no HTTP health check; a "zombie"
  state (process alive, gateway silently disconnected) is invisible until a user
  reports it. The `numInstances: 1` SPOF (correct and intrinsic) has no failover,
  so detection is the only available mitigation.
- **Acceptance criteria:**
  - discord.js `shardDisconnect` / `shardReconnecting` / `shardError` events are
    instrumented into the logger + metrics.
  - A lightweight watchdog or `/healthz`-style heartbeat makes a stuck-but-alive
    gateway externally detectable (an emitted heartbeat the worker pushes, since
    it has no inbound URL).

### N9 — Define one symptom-based alert and a minimal SLO/SLI for the bot

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Reliability
- **Evidence:** [reliability.md F3](dimensions/reliability.md#f3--no-slo--sli-definitions-or-alerting), [reliability.md R3](dimensions/reliability.md#recommendations), [reliability.md R5](dimensions/reliability.md#recommendations)
- **Discipline:** observability
- **Why:** Per-command metrics already flush every 5 min, but nothing closes the
  loop — the signal is forensic-only. One alert + a one-line SLO turns existing
  metrics into incident _detection_.
- **Acceptance criteria:**
  - One symptom-based alert is defined and routed to a notification channel
    (e.g. command error-rate over a 5-min window, or absence of `bot.ready` /
    `metrics.flush` lines).
  - A minimal SLO/SLI + error-budget one-liner is recorded (e.g. "best-effort,
    single-instance; target: respond to >99% of interactions").

### N10 — Add unit tests for the load-bearing bot reliability utilities

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Reliability, Test Quality
- **Evidence:** [reliability.md F4](dimensions/reliability.md#f4--load-bearing-reliability-utilities-have-no-dedicated-tests), [reliability.md R4](dimensions/reliability.md#recommendations), [test-quality.md Rec 2](dimensions/test-quality.md#recommendations)
- **Discipline:** reliability
- **Why:** `loginWithBackoff`, `metrics`, `logger`, and the `interactionCreate`
  error-reply fallback are the components that only run _under failure_ — exactly
  the untested code that ships regressions silently. `loginWithBackoff`'s
  injectable `sleep` seam signals test intent that was never realized.
- **Acceptance criteria:**
  - Unit tests cover `loginWithBackoff` (exhaustion, cap, success-on-retry via the
    injectable `sleep`), `metrics` (flush/snapshot/timer lifecycle), `logger`
    (Error serialization, level→stream routing), and the `interactionCreate`
    error-reply fallback (replied/deferred branches).
  - Tests run in the discord-bot CI job.

### N11 — Publish the generated TypeDoc API reference (or diff it against hand-authored pages in CI)

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Documentation
- **Evidence:** [documentation.md F1](dimensions/documentation.md#f1--generated-api-reference-typedoc-is-configured-but-never-published), [documentation.md R1](dimensions/documentation.md#recommendations)
- **Discipline:** docs
- **Why:** TypeDoc is fully wired but `docs/api/` is git-ignored and unpublished;
  the hand-authored `*/api-reference.mdx` pages are the de-facto public reference
  and can silently drift from exported signatures. This is the only _structural_
  doc-rot vector in an otherwise A-grade doc estate.
- **Acceptance criteria:**
  - Either: TypeDoc output is published to a stable URL and linked from the README;
  - Or: CI generates TypeDoc and diffs it against the `*/api-reference.mdx` pages,
    failing on signature drift.

### N12 — Broaden app-layer integration/e2e coverage (replicate the discord-bot pattern)

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Test Quality
- **Evidence:** [test-quality.md Rec 2](dimensions/test-quality.md#recommendations), [test-quality.md Layer Presence](dimensions/test-quality.md#layer-presence)
- **Discipline:** reliability
- **Why:** The discord-bot's un-mocked cross-boundary integration test is
  exemplary but unique; the `cli` app has no equivalent and the docs-site builds
  have no smoke e2e. This is the only marked gap holding test-quality below a full A.
- **Acceptance criteria:**
  - An un-mocked cross-boundary integration test exists for the `cli` app
    (mirroring the discord-bot pattern: real engine + seeded random → asserted
    output).
  - At least a smoke e2e exists for the `site` / `rdn` docs builds.

### N13 — Add a CI guard that live Render `BUN_VERSION` matches the committed blueprint

- **Severity:** Low
- **Risk reduction:** Medium
- **Source dimensions:** Infrastructure
- **Evidence:** [infrastructure.md F2](dimensions/infrastructure.md#f2--bun_version-dashboard-drift-risk-between-blueprint-and-live-service), [infrastructure.md R1](dimensions/infrastructure.md#recommendations)
- **Discipline:** infrastructure
- **Why:** The repo self-flags this drift risk (the live service was on 1.3.8 vs
  committed 1.3.14). A divergent live Bun version could produce build/runtime
  behavior that doesn't match CI. After the one-time N3 confirmation, this makes
  the check standing.
- **Acceptance criteria:**
  - A CI/scheduled job (Render API) asserts the live `BUN_VERSION` matches
    `render.yaml`, OR Blueprint auto-sync is enforced so divergence is impossible.

## Later (strategic / hygiene / polish)

### L1 — Extract shared logic from the `dice-ui` web/native component pairs

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Maintainability
- **Evidence:** [maintainability.md F1](dimensions/maintainability.md#f1--randsumdice-ui-webnative-component-duplication), [maintainability.md R1](dimensions/maintainability.md#recommendations)
- **Discipline:** frontend
- **Why:** The `QuickReferenceGrid.tsx` (983 LOC) / `.native.tsx` (792 LOC) pair
  has ~1,459 differing lines — effectively two parallel components, the repo's top
  duplication/modifiability risk. Every behavioral change must be made twice and
  silently lands on only one platform when missed. Placed in Later because it is
  contained to a single private package and is a substantial refactor, not a quick
  fix.
- **Acceptance criteria:**
  - Shared logic for the diverged `dice-ui` pairs (starting with
    `QuickReferenceGrid`) is extracted into platform-agnostic hooks/utilities.
  - Each `.tsx` / `.native.tsx` is reduced to a thin render shim over the shared
    logic.

### L2 — Decompose the oversized codegen emitter `generateFunctionBody`

- **Severity:** Medium
- **Risk reduction:** Medium
- **Source dimensions:** Maintainability
- **Evidence:** [maintainability.md F2](dimensions/maintainability.md#f2--oversized-codegen-function-generatefunctionbody), [maintainability.md R2](dimensions/maintainability.md#recommendations)
- **Discipline:** build
- **Why:** `generateFunctionBody` (~157 lines) is the single longest function in
  the tree and is string-emitting codegen — bugs propagate to all eight game
  packages at once. Decomposing it lowers the blast radius of codegen changes.
- **Acceptance criteria:**
  - `generateFunctionBody` (and siblings `generateMultiPoolBody`,
    `generateRollParts` in `emitBody.ts`) are split into smaller named
    sub-emitters by concern (pool / modifier / multi-pool join).
  - `gen:check` still passes (generated output is byte-identical or intentionally
    re-baselined).

### L3 — Add a commit-time secret-scanning gate

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Security
- **Evidence:** [security.md S-1](dimensions/security.md#input-validation--dos-resistance-the-core-risk--strong), [security.md Rec 1](dimensions/security.md#recommendations)
- **Discipline:** security
- **Why:** The repo is clean today, but no dedicated scanner (gitleaks /
  detect-secrets / GitHub push protection) is wired into lefthook or CI. Pure
  prevention against future accidental commits — cheap.
- **Acceptance criteria:**
  - gitleaks or detect-secrets runs in `lefthook.yml` pre-commit, and/or GitHub
    push protection is enabled.
  - A baseline pass is clean.

### L4 — Document the RNG security boundary (`Math.random` is non-crypto)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Security
- **Evidence:** [security.md S-2](dimensions/security.md#input-validation--dos-resistance-the-core-risk--strong), [security.md Rec 2](dimensions/security.md#recommendations)
- **Discipline:** docs
- **Why:** The product's value proposition is dice fairness, yet the default RNG
  is `Math.random` (non-cryptographic). Documenting the boundary + the
  `{ randomFn }` injection pattern prevents misuse in any future money/wager /
  commit-reveal context.
- **Acceptance criteria:**
  - `@randsum/roller` docs/README state that the default RNG is
    entertainment-grade and non-cryptographic.
  - The `{ randomFn }` injection pattern (e.g. backed by `crypto.getRandomValues`)
    is shown for CSPRNG-grade consumers.

### L5 — Begin collecting change-failure-rate and MTTR from deploy/incident tooling

- **Severity:** Low
- **Risk reduction:** Medium
- **Source dimensions:** Delivery
- **Evidence:** [delivery.md F3](dimensions/delivery.md#f3--change-failure-rate-and-mttr-not-measurable-from-git-alone), [delivery.md R2](dimensions/delivery.md#recommendations)
- **Discipline:** observability
- **Why:** Two of the four DORA metrics are unobservable from git. Sourcing them
  from Render/Netlify/EAS deploy history (and any incident log) completes the
  delivery picture. Strategic, not urgent — delivery already grades A.
- **Acceptance criteria:**
  - CFR and MTTR are derived from deploy/incident tooling and recorded somewhere
    durable (dashboard or periodic note), rather than inferred from zero-revert
    git history.

### L6 — Note the bench gate's `roller`-only trigger scope (gate exists; verify breadth)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Performance, Delivery
- **Evidence:** [performance.md Rec 1](dimensions/performance.md#recommendations-ordered-by-leverage), [delivery.md CI quality](dimensions/delivery.md#cicd-configuration-quality-notable-strengths), `.github/workflows/ci.yml:213-245`
- **Discipline:** build
- **Why:** **Reconciliation note** — performance R1 claims no bench gate exists;
  this is stale. The gate _does_ exist (`bench (regression gate)`, `fail-on-alert:
true`, threshold 150%, baseline cached and saved on push to `main`). The only
  residual nuance: the job is gated on `needs.changes.outputs.roller == 'true'`,
  so a games/CLI-only change won't re-run or re-baseline the benchmark. That is
  arguably correct (the engine is the hot path), but worth a conscious decision.
- **Acceptance criteria:**
  - A maintainer confirms the `roller`-path-only trigger is intentional, OR the
    bench job's path filter is broadened if non-roller code can affect roll-engine
    latency.
  - Performance R1's "no gate exists" claim is corrected in any downstream tracking.

### L7 — Watch the two tight roller bundle budgets (`dist/index.js`, `dist/tokenize.js`)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Performance
- **Evidence:** [performance.md Rec 2](dimensions/performance.md#recommendations-ordered-by-leverage), [performance.md Bundle size](dimensions/performance.md#bundle-size--measured-bun-run-size-roller-fresh-build)
- **Discipline:** build
- **Why:** `dist/index.js` (1.7% headroom) and `dist/tokenize.js` (3.7% headroom)
  will trip `size-limit` on the next non-trivial barrel addition or a behavior
  leak into the tokenize import graph. The gate already catches it — this is
  "be aware in review," not a fix.
- **Acceptance criteria:**
  - The `dist/tokenize.js` isolation invariant (schema must not reference behavior
    symbols at module-init) is documented as a review checkpoint.
  - Any new modifier/notation primitive triggers a deliberate budget-vs-trim
    decision rather than an accidental CI failure.

### L8 — Guard the dist-smoke tests against a missing `dist/`

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Test Quality
- **Evidence:** [test-quality.md Rec 1](dimensions/test-quality.md#recommendations), [test-quality.md Flakiness Signals](dimensions/test-quality.md#flakiness-signals)
- **Discipline:** reliability
- **Why:** A fresh-worktree `bun test` without a prior build surfaces 15+ confusing
  `Cannot find module '.../dist/index.js'` failures that are really a missing build
  step (CI never hits this — pre-push runs `build` at priority 1). A skip-with-message
  guard makes the failure mode self-explanatory to new contributors.
- **Acceptance criteria:**
  - The `(dist)` smoke tests detect a missing `dist/` and `test.skip` with a
    "run `bun run build` first" message instead of erroring opaquely.

### L9 — Capture vault/DNS/credential ownership and a secret-rotation/release-recovery runbook (bus-factor)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Delivery, Documentation, Infrastructure
- **Evidence:** [delivery.md F4](dimensions/delivery.md#f4--single-maintainer-bus-factor-delivery-continuity-risk), [delivery.md R4](dimensions/delivery.md#recommendations), [documentation.md F5](dimensions/documentation.md#f5--external-dependencies-the-audit-cannot-verify-discord-project-board-password-vault), [documentation.md R4](dimensions/documentation.md#recommendations)
- **Discipline:** docs
- **Why:** Single-maintainer continuity risk recurs across three dimensions:
  release decisions, secret rotation (OIDC / `EXPO_TOKEN` / Render / Netlify /
  `CODECOV_TOKEN`), DNS, vault access, and incident response all concentrate on
  one person. Automation would survive a bus event; the _human-held_ knowledge
  would not. A short ownership + rotation runbook is the mitigation.
- **Acceptance criteria:**
  - A runbook documents secret-rotation steps for OIDC publisher config,
    `EXPO_TOKEN`, Render/Netlify credentials, and `CODECOV_TOKEN`.
  - Vault / DNS / store-credential _ownership_ (who holds access) is recorded.

### L10 — Expand the two thin READMEs (`apps/cli`, `apps/rdn`)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Documentation
- **Evidence:** [documentation.md F3](dimensions/documentation.md#f3--two-thin-readmes-appscli-and-appsrdn), [documentation.md R3](dimensions/documentation.md#recommendations)
- **Discipline:** docs
- **Why:** Both surfaces are below the monorepo's high doc baseline (buffered by
  solid `CLAUDE.md` files, so no contributor is blocked — just under-served).
- **Acceptance criteria:**
  - `apps/cli/CLAUDE.md` gains architecture / test-pattern notes.
  - `apps/rdn/README.md` gains a brief structure/deploy section.

### L11 — Keep coupling-magnet `lib/` hubs and the largest test file under periodic review

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Architecture, Maintainability, Test Quality
- **Evidence:** [architecture.md F5](dimensions/architecture.md#f5--coupling-magnet-directories-exist-but-are-bounded-and-local), [architecture.md R1](dimensions/architecture.md#recommendations), [maintainability.md F4](dimensions/maintainability.md#f4--high-churn-roller-barrels-and-shared-type-modules), [test-quality.md Rec 4](dimensions/test-quality.md#recommendations)
- **Discipline:** build
- **Why:** `roller/src/lib` (~12 fan-in) and `games/src/lib` (~9) are intentional,
  contained hubs today; the only risk is `lib/utils` accreting unrelated helpers
  over time. Likewise `notation/definitions.test.ts` (987 LOC) is fine as a data
  table but should split by category if it grows. Watch items, not remediation.
- **Acceptance criteria:**
  - A periodic-review note exists for `roller/src/lib/utils` (split by concern if
    it accretes unrelated helpers).
  - `notation/definitions.test.ts` is split by notation category if it grows
    materially beyond its current size.

### L12 — Make the `apps/cli` → roller dependency edge explicit

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Architecture
- **Evidence:** [architecture.md F6](dimensions/architecture.md#f6--cli-consumes-roller-via-a-bundled-devdependency), [architecture.md R2](dimensions/architecture.md#recommendations)
- **Discipline:** build
- **Why:** `apps/cli` imports `@randsum/roller/roll` but lists roller under
  `devDependencies` (defensible — `bunup` inlines it at build), making the edge
  invisible to manifest-reading tooling. Manifest-hygiene nuance only.
- **Acceptance criteria:**
  - Either roller is moved to `dependencies` in `apps/cli/package.json`, OR a
    comment documents the bundled-edge rationale.
  - The published CLI bundle is confirmed self-contained.

### L13 — Re-evaluate suppressed dev/build-time advisories on the next Astro/Expo major bump

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Security
- **Evidence:** [security.md Rec 4](dimensions/security.md#recommendations), [security.md Rec 3](dimensions/security.md#recommendations)
- **Discipline:** security
- **Why:** The 4 moderate + 1 low advisories suppressed in `osv-scanner.toml` are
  correctly dev/build-time-only and unreachable from published packages today,
  but suppressions should expire, not become permanent. Optionally pair with a
  full-tree SCA/license scanner (Trivy/Snyk; `license-checker`/ScanCode) as a v2
  confirmation of the manifest-level hypotheses.
- **Acceptance criteria:**
  - The `osv-scanner.toml` suppressions are re-checked at the next Astro/Expo
    major bump and removed if resolved.
  - (Optional) a full-transitive-tree SCA + license scan is run once to confirm
    the manifest-level findings.

### L14 — Codify the Expo native store-submit path; consider bot rate-limiting

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Infrastructure, Security
- **Evidence:** [infrastructure.md F4](dimensions/infrastructure.md#f4--expo-app-version-source-is-remote-native-builds-not-store-submitted), [infrastructure.md R4](dimensions/infrastructure.md#recommendations), [security.md Rec 5](dimensions/security.md#recommendations)
- **Discipline:** infrastructure
- **Why:** Two small defense-in-depth / completeness items: the Expo native submit
  path is half-configured (no iOS `submit.production`; Android `internal`/`draft`),
  so a native release still requires manual console steps; and the single-instance
  bot worker caps a _single_ roll's work but not a flood of large-but-legal rolls.
- **Acceptance criteria:**
  - An iOS `submit.production` block is added and the Android track promoted beyond
    `internal`/`draft` when a store release is intended.
  - (Optional) a basic per-user/-guild rate limit guards the bot's compute commands.

### L15 — Capture the missing-config failure path through `captureException` (minor consistency)

- **Severity:** Low
- **Risk reduction:** Low
- **Source dimensions:** Reliability
- **Evidence:** [reliability.md F6](dimensions/reliability.md#f6--configts-throws-at-import-time-on-missing-env-vars-fail-fast-with-a-restart-loop-caveat), [reliability.md R6](dimensions/reliability.md#recommendations), [reliability.md F5](dimensions/reliability.md#f5--no-distributed-tracing-or-requestinteraction-correlation-id)
- **Discipline:** observability
- **Why:** `config.ts` throws at import time before `initErrorTracker()` runs, so a
  missing-env failure lands only as a raw stderr stack while the auth-failure path
  is hardened — a minor asymmetry. Optionally also add happy-path interaction-level
  correlation ids (F5) for easier log reconstruction.
- **Acceptance criteria:**
  - `initErrorTracker()` runs before (or the `config.ts` throw is restructured so)
    all boot failures route through `captureException`.

## Index by source dimension

| Dimension       | Items                    |
| --------------- | ------------------------ |
| Maintainability | N4, N5, L1, L2, L11      |
| Test Quality    | N10, N12, L8, L11        |
| Security        | L3, L4, L13, L14         |
| Reliability     | N7, N8, N9, N10, L8, L15 |
| Performance     | L6, L7                   |
| Architecture    | L11, L12                 |
| Delivery        | N2, N6, L5, L6, L9       |
| Documentation   | N1, N11, L9, L10         |
| Infrastructure  | N3, N7, N8, N13, L9, L14 |

## Open questions / conflicts

- **No cross-dimension recommendation conflicts** were found — the reports are
  mutually consistent. The only conflict is _internal_ to the source set and is
  resolved above: performance R1 ("no benchmark regression gate") contradicts the
  delivery report and the actual `ci.yml`, which **does** define the gate. Resolved
  in favor of "gate exists" (see Methodology and L6).
