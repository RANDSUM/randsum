# Delivery Health

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo_

## Summary

`randsum-monorepo` exhibits a mature, highly-automated delivery posture for a
single-maintainer (plus bots) open-source monorepo. npm publishing is fully
automated through Changesets + a `workflow_run`-gated Release workflow using npm
OIDC Trusted Publishing (no long-lived tokens), and four deploy targets
(Discord-bot → Render `autoDeploy`, two Astro sites → Netlify, Expo web/native →
EAS) ship on push to `main` — effectively continuous deployment. Lead time is
elite: merged PRs overwhelmingly close the same day, frequently within minutes.
CI is unusually disciplined — SHA-pinned actions, path-filtered per-package jobs,
an aggregating "CI Gate", a benchmark regression gate, OSV/SCA scanning, and
dependabot auto-merge. The main soft spots are branch sprawl (16 unmerged remote
branches, several ~3 months stale) and the fact that branch-protection / required-
status-check enforcement could not be confirmed from the worktree (the workflows
exist, but whether they are _required_ gates on `main` is not observable here).

**Overall grade:** A

## Framework anchors

- **DORA / Accelerate** — Deployment frequency, lead time for changes, change
  failure rate, time to restore service.
- **Trunk-based development** — short-lived branches, frequent integration to
  `main` as a delivery indicator.
- **SLSA / supply-chain provenance** — OIDC Trusted Publishing and SHA-pinned
  GitHub Actions as release-integrity signals.

## Findings

### F1 — Branch sprawl: 16 unmerged remote branches, several stale (~3 months)

- **Severity:** Low
- **Location:** `randsum-monorepo` — `git branch -r --no-merged main` (16),
  e.g. `origin/story/unify-notation-docs/s5-conformance-codegen` and
  `origin/story/unify-notation-docs/s3-single-entry-modifiers` (last commit
  2026-03-24, ~3 months old); five `origin/jarvis/p4-*` / `p5-*` branches
  (2026-06-13).
- **Evidence:** Squash-merge workflow leaves source branches behind; `for-each-ref`
  shows multiple `story/*` and `jarvis/p*` branches with no commits past March/June
  and no corresponding open PR activity.
- **Impact:** Cosmetic clutter and ambiguity about which branches are live work vs.
  abandoned. No correctness risk, but stale branches accrete confusion and can mask
  truly-in-flight work. Trunk-based hygiene favors pruning merged/abandoned branches.

### F2 — Branch-protection / required-status-checks on `main` not verifiable from worktree

- **Severity:** Low
- **Location:** `randsum-monorepo` — `.github/workflows/ci.yml` (`ci-gate` job),
  repo settings (not in-tree).
- **Evidence:** A well-formed aggregating gate exists (`ci-gate` needs all
  per-package jobs and fails on any failure/cancellation), and `arch`/`audit`
  jobs carry comments asserting they "cannot be bypassed with `--no-verify`"
  because they run in CI rather than only in lefthook. But whether GitHub
  _requires_ `ci-gate` (and review) before merge to `main` is a repo-settings
  fact not present in the checked-out tree.
- **Impact:** If the gate is configured-but-not-required, a direct push or an
  un-gated merge could land unverified code on `main` (which auto-deploys). The
  presence of the gate strongly suggests intent to enforce; confirm enforcement.

### F3 — Change failure rate and MTTR not measurable from git alone

- **Severity:** Low
- **Location:** `randsum-monorepo` — git history only.
- **Evidence:** No revert/rollback/hotfix commits in the last 90 days
  (`grep -ciE "revert|rollback|hotfix"` → 0 on first-parent `main`). Many
  `fix(ci):` commits exist but those are forward-fixes during the OIDC-publishing
  migration, not production incident recoveries. There is no incident-tracking
  artifact in-repo to derive restoration time.
- **Impact:** Two of the four DORA metrics are unobservable here. The zero-revert
  signal is mildly encouraging but not a substitute for measured CFR/MTTR. Collect
  these from deploy/incident tooling (Render deploy history, Netlify/EAS deploy
  logs, any incident log) for a complete DORA picture.

### F4 — Single-maintainer bus factor (delivery continuity risk)

- **Severity:** Low
- **Location:** `randsum-monorepo` — contributor history.
- **Evidence:** Inventory notes the primary contributor is Alex Jarvis (plus
  dependabot, Claude, github-actions bots). 91 commits in 90 days are
  near-entirely one human author.
- **Impact:** Delivery automation is excellent and would survive, but release
  decisions, secret rotation (OIDC/EXPO_TOKEN/Render), and incident response
  concentrate on one person. Not a CI/CD defect — a continuity note for the
  delivery system as a whole.

## Metrics

| Repo             | Metric                           | Value                                                                                    | Notes                                                                                                                                                           |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| randsum-monorepo | Deployment frequency proxy       | **High → Elite** (per-merge CD to 4 targets)                                             | Discord-bot Render `autoDeploy: true`; site/rdn Netlify on push; expo web+native via EAS workflows on push to `main`; npm via Changesets Release. LLM-estimated |
| randsum-monorepo | Lead time proxy                  | **Elite (<1 day)**                                                                       | Last ~30 merged PRs: most created→merged same day, many within minutes; a few feature PRs span 1–9 days. Median well under 1 day. From `gh pr list`             |
| randsum-monorepo | Merge/commit cadence             | 15 PRs merged in 90d; 76 first-parent commits to `main` in 90d                           | Squash-merge model — most work lands as single squashed commits, not merge commits (only 3 merge commits in 90d)                                                |
| randsum-monorepo | npm release automation           | **Full CD** (Changesets + OIDC Trusted Publishing)                                       | `publish.yml` gated on `workflow_run` success on `main`; no NPM_TOKEN — OIDC `id-token: write`. Recent (2026-06-23)                                             |
| randsum-monorepo | Change failure rate              | **Not measured** (v1 LLM-driven; git-only)                                               | 0 revert/rollback/hotfix commits in 90d, but CFR not reliably git-derivable. Collect from deploy/incident tooling                                               |
| randsum-monorepo | Time to restore (MTTR)           | **Not measured** (v1 LLM-driven; git-only)                                               | No in-repo incident record. Collect from Render/Netlify/EAS deploy history                                                                                      |
| randsum-monorepo | CI provider + automation level   | GitHub Actions — **full CD**                                                             | 7 workflows: ci, publish, security, auto-merge, claude, expo-native-deploy, expo-web-deploy                                                                     |
| randsum-monorepo | Stale / unmerged remote branches | 16 unmerged; ~7 stale (>90d or no recent activity)                                       | `git branch -r --no-merged main`                                                                                                                                |
| randsum-monorepo | Required checks on PRs           | `ci-gate` aggregating gate present; per-package jobs + bench + knip + arch + audit + SCA | Enforcement-as-required not verifiable from worktree (see F2)                                                                                                   |
| randsum-monorepo | Conventional-commit compliance   | ~95% (190/200 of recent first-parent commits)                                            | Strong `feat`/`fix`/`chore`/`docs(scope):` discipline; powers Changesets                                                                                        |
| randsum-monorepo | Force-push to `main`             | None observed                                                                            | Reflog `reset` entries are local worktree HEAD syncs to `origin/main`, not history rewrites                                                                     |

## CI/CD configuration quality (notable strengths)

- **Supply-chain hardening:** all third-party actions are pinned to full commit
  SHAs (not floating tags); npm publish uses OIDC Trusted Publishing with no
  long-lived token; the Release workflow carries an explicit "pwn-request"
  invariant comment forbidding checkout of PR refs and consumption of fork
  artifacts in the privileged `workflow_run` context.
- **Efficient gating:** `dorny/paths-filter` runs only the affected package jobs;
  `concurrency` with `cancel-in-progress` avoids wasted runs; a single `ci-gate`
  job aggregates results so branch protection needs one required check.
- **Quality gates in CI (not just local hooks):** bundle-size (`size-limit`),
  benchmark regression gate (fail-on-alert at 150%), `knip` dead-code, `arch:check`
  dependency-cruiser invariants, `bun audit` advisory gate, and OSV/SCA scan — with
  in-file comments noting `arch`/`audit` were relocated from local-only lefthook
  into CI specifically so `--no-verify` cannot bypass them.
- **Release safety:** a `publish (dry run)` job runs on changeset-touching PRs;
  bundle sizes are re-checked in the Release job before publish.
- **Dependency automation:** `dependabot.yml` (2 ecosystems) + `auto-merge.yml`
  auto-merges patch/minor dependabot PRs after checks (rebase), scoped to the
  `dependabot[bot]` actor.

## Recommendations

- **R1** — Confirm (and, if absent, enable) GitHub branch protection on `main`
  requiring the `ci-gate` status check and at least one review/approval; the
  workflows assume gated merges but enforcement is not in-tree. [Horizon: now] [Risk reduction: Med]
- **R2** — Begin collecting change-failure-rate and MTTR from deploy/incident
  tooling (Render deploy history, Netlify/EAS deploy logs, an incident log) so the
  two unmeasured DORA metrics become observable rather than inferred. [Horizon: next] [Risk reduction: Med]
- **R3** — Prune stale remote branches (delete-on-merge for squashed PRs; sweep the
  `story/*` and `jarvis/p*` branches that have no recent activity or open PR). [Horizon: now] [Risk reduction: Lo]
- **R4** — Document the secret-rotation and release-recovery runbook for the
  single-maintainer scenario (OIDC publisher config, `EXPO_TOKEN`, Render/Netlify
  credentials, `CODECOV_TOKEN`) to reduce bus-factor risk on the delivery path. [Horizon: later] [Risk reduction: Lo]

## Confidence

- **Deployment-frequency and lead-time buckets are LLM-estimated** from git
  history and `gh pr list` metadata (created→merged deltas), not from
  observed production deploy events. They are directionally robust — the
  same-day merge pattern and per-push deploy workflows are directly observable —
  but should be read as DORA _buckets_, not precise figures.
- **Deploy-on-push behavior** is read from workflow triggers and PaaS config
  (`expo-web-deploy.yml`/`expo-native-deploy.yml` `on: push: branches:[main]`,
  `render.yaml autoDeploy: true`, Netlify `command` build configs). Whether each
  target's deploy actually succeeds per push is not verified from the worktree.
- **Change failure rate and MTTR are explicitly not measured** (out of reach with
  git alone, per the skill's own guidance). The zero-revert observation is a weak
  proxy, not a measurement.
- **Branch-protection enforcement (F2)** is a repo-settings fact not present in the
  checked-out tree; the finding flags the gap rather than asserting a deficiency.
- **CI/CD config-quality observations are directly observed** from reading the
  seven workflow files in full — these are high-confidence, not estimated.
- Single repo, read exhaustively for delivery-relevant artifacts; no sampling
  shortcuts were taken on the workflow files.
