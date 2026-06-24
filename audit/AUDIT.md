# Audit — randsum / randsum-monorepo

_June 23, 2026_

## Verdict

**Risk level:** healthy

**Headline:** A mature, uniformly strong TypeScript dice-library monorepo with no critical or high-severity findings — remaining work is observability "last-mile" and polish.

**Framing:** Every remediation item is Medium or Low; the codebase is ready to build on, not to fix.

## Executive Summary

`randsum` is a single Bun-workspace TypeScript monorepo (~53.6k LOC across the
zero-dependency `@randsum/roller` engine, the code-generated `@randsum/games`
packages, the `@randsum/dice-ui` React-Native library, and five apps — CLI,
Discord bot, two Astro doc sites, and an Expo playground). It publishes a dice
ecosystem to npm under `@randsum`.

The headline finding is that there is **no headline problem**. Across nine
quality dimensions the scorecard is uniformly strong — seven A-band, two
B-band — with **zero Critical or High-severity findings**. Architectural
invariants are mechanically enforced rather than merely documented
(`dependency-cruiser` `arch:check` ran clean: 275 modules, 0 cycles, 0
cross-package violations); the untrusted-notation parser is ReDoS-resistant
with hard input bounds; the test estate is genuinely deep (193 files, ~2,700
roller tests with property-based + 9999-iteration stress + RFC-2119 conformance
layers); delivery is Elite-tier (Changesets + npm OIDC Trusted Publishing,
SHA-pinned CI with bench/SCA gates); and the documentation estate is top-decile
for the project's size (19 MADR ADRs, two doc sites, a real ops runbook).

The two B-grade dimensions — maintainability and reliability — are dragged by a
small number of contained issues rather than systemic weakness: the
`@randsum/dice-ui` web/native component pairs have diverged badly (the
`QuickReferenceGrid` `.tsx`/`.native.tsx` differ by ~1,459 lines), and the
single long-running service (`apps/discord-bot`) has its observability "last
mile" unfinished — the Sentry error tracker is a no-op stub and there is no
liveness signal, SLO, or alert for the single-instance gateway worker.

**Highest-leverage recommendation:** finish the bot's observability last mile
(activate the error tracker, add a liveness check + one symptom-based alert +
a minimal SLO, and unit-test the failure-path utilities). This is one bounded
effort that lifts the bot's reliability posture from B to A and closes the only
cluster of findings sourced by more than one dimension.

## Methodology & Limitations

This audit is **LLM-driven (v1)** — Claude reads code, manifests, configs, git
history, and supplied artifacts and reasons about quality dimensions without
running a full static-analysis toolchain. Findings are hypothesis-grade and
should be confirmed with measurement before significant remediation. Where
tools _were_ run to ground a conclusion (`dependency-cruiser`, `knip`, `bun
audit`, `size-limit`, and a clean `bun run build` + test pass), the report says
so.

All nine dimensions ran; none were skipped. The **Infrastructure** dimension
ran and is graded on managed-PaaS posture only — the repo has no IaC,
containers, or self-managed orchestration, so those sub-checks are genuinely
N/A (not failures). Several infrastructure and delivery conclusions are
"configured but unverified" — derived from declared config (`render.yaml`,
`netlify.toml`, branch-protection assumptions) rather than confirmed live
state — and are flagged as such.

One cross-report discrepancy was reconciled against source: the performance
report's draft claim that "no benchmark regression gate exists" was **incorrect**
— `.github/workflows/ci.yml` does run a `bench (regression gate)` job
(`fail-on-alert: true`, 150% threshold), matching the delivery report. The
performance report has been corrected and that recommendation dropped as
already-satisfied.

Anchored frameworks: ISO/IEC 25010, ISO/IEC 5055, OWASP ASVS / SAMM,
DORA / Accelerate, Robert C. Martin package metrics, _Your Code as a Crime
Scene_.

## Scorecard

| Dimension       | Grade | Headline                                                                                                                                                                                                                       |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Maintainability | B     | Well-maintained and highly modular (zero dead code per `knip`); dragged only by diverged `dice-ui` web/native component pairs and a 157-line codegen emitter function. (Report grade: B+)                                      |
| Test Quality    | A     | ~1.21:1 test-to-code ratio across 193 files with property, 9999-iter stress, and conformance layers; thin app-layer e2e is the only real gap. (Report grade: A−)                                                               |
| Security        | A     | No hardcoded secrets, ReDoS-resistant notation parser with hard bounds, zero-dependency core, clean `bun audit`; minor gaps are a missing commit-time secret scanner and a `Math.random` RNG boundary note. (Report grade: A−) |
| Reliability     | B     | Excellent error hierarchy and a deliberately hardened bot, but the Sentry tracker is a no-op stub and there is no liveness/SLO/alert for the single-instance worker.                                                           |
| Performance     | A     | Pure-compute engine with every unbounded loop (explode/reroll/unique/repeat) explicitly capped and enforced bundle budgets; two roller entry points sit near their size ceiling. (Report grade: A−)                            |
| Architecture    | A     | Mechanically enforced stable-core DAG (`dependency-cruiser` clean: 0 cycles, 0 cross-game imports), genuinely zero-dep core, 19 MADR ADRs.                                                                                     |
| Delivery        | A     | Elite lead time; Changesets + npm OIDC Trusted Publishing, SHA-pinned path-filtered CI with bench/SCA gates; soft spots are stale branches and single-maintainer bus factor.                                                   |
| Documentation   | A     | Top-decile doc estate (root + per-package CLAUDE.md, 19 ADRs, two doc sites, a real ops runbook); drift risks are a stale bot README and unpublished TypeDoc.                                                                  |
| Infrastructure  | A     | 100% config-as-code across Render/Netlify×2/EAS+npm with full toolchain pinning, SHA-pinned actions, and zero committed secrets (OIDC + `sync:false`); minor drift-detection gaps. (Report grade: A−)                          |

_Grades shown as the schema's A–F letter; the dimension reports carry the finer +/- grade noted in parentheses. Verdict derivation: 7 A-band + 2 B-band, all A or B → **healthy**._

## Top 5 Risks

1. **Bot error tracker is a no-op stub** — `forwardToSentry` is empty, so even
   with a DSN set, exceptions never leave Render logs; the single-instance worker
   has no runtime error aggregation. Source: Reliability, Infrastructure.
2. **No liveness signal / SLO / alert for the single-instance bot** — a
   stuck-but-alive gateway is invisible until a user reports it; metrics flush but
   nothing closes the detection loop. Source: Reliability, Infrastructure.
3. **`dice-ui` web/native duplication** — `QuickReferenceGrid` `.tsx`/`.native.tsx`
   differ by ~1,459 lines; every change is made twice and silently lands on one
   platform. The repo's top modifiability risk. Source: Maintainability.
4. **Doc-vs-reality drift** — `apps/discord-bot/README.md` documents a pm2/systemd
   self-host path the production Render blueprint contradicts; TypeDoc is wired but
   unpublished, leaving hand-authored API pages to drift. Source: Documentation.
5. **Single-maintainer bus factor** — release decisions, secret rotation, DNS, and
   vault access concentrate on one person; automation survives, human-held
   knowledge does not. Source: Delivery, Documentation, Infrastructure.

## Top 5 Recommendations

1. **Fix the stale bot README hosting path (pm2 → Render)** — one-file fix closing
   a known, already-acknowledged doc-rot vector. Risk reduction: Med. (N1)
2. **Activate the error tracker + add a Sentry DSN** — wire `forwardToSentry` to a
   real transport so the SPOF worker has runtime error visibility. Risk reduction:
   Med. (N7)
3. **Add liveness + one symptom-based alert + a minimal SLO for the bot** — turn
   existing metrics into incident _detection_. Risk reduction: Med. (N8, N9)
4. **Confirm branch protection requires `ci-gate` on `main`, and confirm PaaS
   declarations against live state once** — close the two "configured but
   unverified" gaps on an auto-deploying main. Risk reduction: Med. (N2, N3)
5. **Publish TypeDoc (or diff it in CI) and extract shared `dice-ui` logic** — kill
   the two largest doc-rot and duplication vectors. Risk reduction: Med. (N11, L1)

## Sub-reports

- [Inventory](inventory.md)
- [Maintainability](dimensions/maintainability.md)
- [Test Quality](dimensions/test-quality.md)
- [Security](dimensions/security.md)
- [Reliability](dimensions/reliability.md)
- [Performance](dimensions/performance.md)
- [Architecture](dimensions/architecture.md)
- [Delivery Health](dimensions/delivery.md)
- [Documentation & Onboarding](dimensions/documentation.md)
- [Infrastructure & Platform](dimensions/infrastructure.md)
- [Domain Ontology](ontology.md)
- [Remediation Plan](remediation.md)
- [Remediation Summary (1-page)](remediation-summary.md)
