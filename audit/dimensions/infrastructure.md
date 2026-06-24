# Infrastructure

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo_

## Summary

This repo has **no IaC, no containers, and no self-managed orchestration** — its
deploy surface is entirely **managed PaaS** (Render worker, two Netlify Astro
sites, Expo/EAS native+web, npm via OIDC Trusted Publishing). Scoped to
managed-platform posture, the configuration is **mature and well above the norm**:
every deploy surface is config-as-code (`render.yaml`, two `netlify.toml`,
`eas.json`/`app.json`), build toolchains are version-pinned (`BUN_VERSION=1.3.14`
tracking `.bun-version`, `NODE_VERSION`, EAS CLI pinned to `^20.1.0`), all GitHub
Actions are SHA-pinned, no secrets are committed (Render env vars use `sync:false`;
`.env*` gitignored), npm publishing uses tokenless OIDC, and a dedicated
`runbooks/DEPLOY.md` documents deploy/rollback/DR/token-rotation for **every**
surface. The residual findings are inherent platform tradeoffs (single-instance
Discord worker, deliberately pinned) and one self-flagged dashboard-drift risk on
`BUN_VERSION`, plus the absence of any drift-detection/IaC-scan tooling to convert
the declared posture into a confirmed one. **Overall grade: A-.**

**Overall grade:** A

## Framework anchors

- **AWS Well-Architected — Operational Excellence** (config-as-code, reproducible deploys, runbooks)
- **AWS Well-Architected — Reliability** (single points of failure, DR/rollback, fixed-size workloads)
- **AWS Well-Architected — Cost Optimization / FinOps** (plan-tier right-sizing, build-minute discipline)
- **AWS Well-Architected — Security** (secret handling, least-privilege publish credentials)
- **CIS Software Supply Chain Benchmark** (pinned actions, pinned toolchains, OIDC publishing)
- **NIST SP 800-190** — N/A (no containers)
- **CIS Kubernetes / OWASP Kubernetes Top 10** — N/A (no orchestrator)

## Findings

### F1 — Single-instance Discord worker is a single point of failure

- **Severity:** Low
- **Location:** `render.yaml:11` (`numInstances: 1`)
- **Evidence:** The Render worker is pinned to one instance. The inline comment
  documents this is **mandatory**: a Discord gateway connection must be held by a
  single process — multiple instances double-process events. `plan: starter`,
  `region: oregon` (single region).
- **Impact:** If the single worker / Oregon region is down, the bot is offline
  until Render reschedules it (no hot standby, no multi-AZ). This is an **accepted,
  correct** architectural constraint for a singleton gateway consumer, not a defect —
  but it remains a genuine availability SPOF with no failover. Severity is Low
  because the workload is a non-revenue Discord bot and the constraint is
  intrinsic; horizontal redundancy is not safely available for this service class.

### F2 — `BUN_VERSION` dashboard-drift risk between blueprint and live service

- **Severity:** Low
- **Location:** `render.yaml:18-22`
- **Evidence:** The repo self-flags this: the comment states "The live service was
  on 1.3.8 — if this blueprint is not auto-synced, update the dashboard env var
  too." Render Blueprints only apply env-var values on sync; a manually-edited
  dashboard value can silently diverge from the committed `1.3.14`.
- **Impact:** Build toolchain drift between code-declared and provisioned state —
  the canonical "config-as-code vs. dashboard drift" gap. A divergent live Bun
  version could produce build/runtime behavior that does not match CI. Already
  partially mitigated by the explicit pin + warning comment; the residual risk is
  that no automated check confirms the dashboard matches the blueprint.

### F3 — No automated drift detection or config-scan tooling

- **Severity:** Low
- **Location:** across all platform configs (`render.yaml`, `apps/*/netlify.toml`, `apps/expo/eas.json`)
- **Evidence:** Findings here are **hypothesis-grade** — they read declared config,
  not provisioned state. There is no `checkov`/`tfsec`-equivalent for PaaS configs
  in CI, no Render Blueprint sync-check, and no Netlify/EAS config linting. The
  `bun audit` security workflow covers dependency CVEs, not platform config.
- **Impact:** The strong declared posture (pinning, `sync:false`, runbooks) cannot
  be automatically confirmed against the live platforms. Drift (F2-class) would go
  undetected until a deploy breaks. Low because the surface is small (3 platforms)
  and the runbook documents manual verification paths.

### F4 — Expo app version source is `remote`; native builds not store-submitted

- **Severity:** Low
- **Location:** `apps/expo/eas.json:3` (`"appVersionSource": "remote"`), `:19-26` (`submit.production`)
- **Evidence:** `appVersionSource: remote` means the build/version number is owned
  by EAS servers, not the repo — version state lives off-git. The native deploy
  workflow builds on manual dispatch only and the Android submit track is
  `internal` / `draft`; iOS has no `submit` config at all. `DEPLOY.md` confirms
  native builds are "not yet store-submitted."
- **Impact:** Version provenance for native binaries is not reproducible from git
  alone (mitigated: `autoIncrement: true` + remote source is the EAS-recommended
  pattern). The half-configured submit path means a native release still requires
  manual console steps — documented, but not codified. Low / informational.

## Metrics

| Repo             | Metric                              | Value              | Notes                                                                             |
| ---------------- | ----------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| randsum-monorepo | IaC tool(s) present                 | None               | Managed PaaS only — no Terraform/Pulumi/CDK/CFN                                   |
| randsum-monorepo | Container images defined            | 0                  | No Dockerfile/compose/.dockerignore                                               |
| randsum-monorepo | Containers running as root          | N/A                | No containers                                                                     |
| randsum-monorepo | K8s workloads w/o resource limits   | N/A                | No orchestrator                                                                   |
| randsum-monorepo | Managed-PaaS surfaces               | 4                  | Render (worker), Netlify ×2, EAS (web+native) + npm publish                       |
| randsum-monorepo | Config-as-code coverage             | 100% of surfaces   | Every deploy target has a committed config file                                   |
| randsum-monorepo | Build-toolchain version pinning     | Full               | `BUN_VERSION` 1.3.14, `NODE_VERSION` 22/24, EAS CLI `^20.1.0`, actions SHA-pinned |
| randsum-monorepo | Committed plaintext secrets         | 0                  | Render `sync:false`; `.env*` gitignored; OIDC publish (no NPM_TOKEN)              |
| randsum-monorepo | Single-points-of-failure (prod)     | 1                  | Discord worker `numInstances:1` (intrinsic, documented)                           |
| randsum-monorepo | Documented rollback path            | Yes (all surfaces) | `runbooks/DEPLOY.md` covers Netlify/EAS/Render/npm rollback                       |
| randsum-monorepo | DR documentation                    | Yes                | Per-surface DR notes + reproducible-from-git statements                           |
| randsum-monorepo | Cost/FinOps signals                 | Right-sized        | `plan: starter`, native builds gated to manual dispatch to save EAS minutes       |
| randsum-monorepo | Drift-detection / config-scan in CI | No                 | No checkov/tfsec equivalent; Blueprint sync unchecked                             |

## Recommendations

- **R1** — Add a CI guard that the Render dashboard `BUN_VERSION` matches the
  committed `render.yaml` value (e.g. a scheduled job hitting the Render API, or
  enforce Blueprint auto-sync), closing the self-flagged drift gap in F2.
  [Horizon: next] [Risk reduction: Med]
- **R2** — Confirm the hypothesis-grade declarations against live state once:
  verify Render env vars are all `sync:false` in the dashboard, Netlify build
  env matches the `.toml`, and EAS project bindings are current. Record the
  verification date in `runbooks/DEPLOY.md`. [Horizon: now] [Risk reduction: Med]
- **R3** — If/when bot availability becomes a concern, document the
  single-instance constraint as an explicit ADR (the intrinsic Discord-gateway
  reason) and consider a lightweight external uptime check (the worker has no
  inbound URL, so monitor via a heartbeat the bot emits). [Horizon: later] [Risk reduction: Lo]
- **R4** — Codify the Expo native submit path (add an iOS `submit.production`
  block; promote Android beyond `internal`/`draft` when ready) so a store release
  is fully config-as-code rather than partly manual. [Horizon: later] [Risk reduction: Lo]
- **R5** — Add a Sentry DSN (the `errorTracker` seam at
  `apps/discord-bot/src/utils/errorTracker.ts` is already wired) so the
  single-instance worker has runtime observability for its outage-prone SPOF.
  [Horizon: next] [Risk reduction: Lo]

## Confidence

- **Findings are hypothesis-grade, not provisioned-state-confirmed.** This dimension
  reads committed declarations (`render.yaml`, `netlify.toml`, `eas.json`,
  workflows); it does not call the Render/Netlify/EAS/npm APIs. The live platforms
  may have drifted from these files — F2 is exactly this risk, self-flagged in the
  repo. R2 recommends a one-time live confirmation.
- **Scope was correctly narrowed to managed-PaaS posture** per the inventory: there
  is no IaC, container, or k8s artifact, so the CIS Docker/K8s, IAM/VPC, and
  encryption-at-rest sweeps are **Not Applicable**, not failures. Grading reflects
  managed-platform maturity, not cloud/k8s maturity.
- **All config files were read in full** (the four PaaS configs, six workflows, the
  `bun-setup` composite action, `runbooks/DEPLOY.md`, both `.env.example` files,
  and `.gitignore`). The "no committed secrets" finding is directly observed (grep
  scan + `sync:false` confirmation + gitignored `.env*`), not estimated.
- **The single-instance SPOF (F1) severity is a judgment call**: rated Low because
  the constraint is intrinsic to a Discord gateway singleton and the workload is
  non-revenue; a reader prioritizing availability could reasonably rate it Medium.
- The unusually strong runbook + inline-comment culture (audit-conscious comments
  citing prior audit findings X4/L5/L7/F-series) raised confidence that the
  declared posture reflects deliberate engineering rather than accidental defaults.
