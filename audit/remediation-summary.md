# Remediation Summary

_Generated: 2026-06-23_

This is a healthy, mature, single-maintainer TypeScript dice-library monorepo.
The scorecard is uniformly strong (architecture, delivery, documentation,
infrastructure all A; test-quality, security, performance A−; maintainability and
reliability B). **There are no Critical or High-severity findings** — every
remediation item is Medium or Low polish, hygiene, or observability "last-mile"
work. The "Now" bucket is highest-leverage quick wins, not emergencies.

## Top 5 risks

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

## Top 5 recommendations

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

## Cross-cutting themes

- **Bot observability "last mile"** — Reliability F1–F4 and Infrastructure F1/R5
  all collapse into one effort: activate the tracker (N7), add liveness/alerting
  (N8, N9), and test the failure-path utilities (N10). Fixing this once lifts the
  bot's reliability posture from B to A.
- **Single-maintainer bus factor** — recurs across Delivery, Documentation, and
  Infrastructure; one ownership + secret-rotation runbook (L9) addresses all three.
- **Doc-vs-reality drift** — the stale bot README (N1) and unpublished TypeDoc
  (N11) are the only structural doc-rot vectors in an otherwise top-decile doc
  estate.
- **"Configured but unverified" platform posture** — branch protection (N2),
  PaaS-vs-live state (N3), and `BUN_VERSION` drift (N13) all convert declared
  config into confirmed state.

## Confidence

Most items rest on **directly observable** evidence (file reads, `knip`, `bun
audit`, `dependency-cruiser`, `size-limit`, grep sweeps). LLM judgment was used
for severity/risk-reduction _ranking_ and for maintainability complexity buckets
(function lengths are ±10% heuristics, not `lizard`-grade). One source-level
discrepancy was reconciled against `ci.yml`: the performance report's claim that
"no benchmark regression gate exists" is **incorrect** — the gate exists
(`bench (regression gate)`, fail-on-alert at 150%), matching the delivery report;
that recommendation is dropped as already-satisfied and only its residual nuance
(roller-path-only trigger) is carried (L6). **Effort, duration, and team-shape
estimates are deliberately out of scope** — this audit does not produce them; the
Now/Next/Later buckets are priority groupings, not time buckets.
