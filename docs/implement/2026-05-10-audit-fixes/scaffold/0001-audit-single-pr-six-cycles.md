# ADR-0001 — Audit execution as one PR, six serial cycles

Status: Accepted
Date: 2026-05-10
Run: 2026-05-10-audit-fixes

## Context

`audit/synthesis-top-30.md` enumerates 30 prioritized improvements across 7
dimensions. The user requested all of them shipped in a single PR on the
`audit` branch.

The `implement:develop` pipeline offers four PR strategies (`one`,
`per-cycle`, `per-cycle-stacked`, `none`) and supports parallel
worktree-isolated cycles for independent work. We must choose.

## Decision

- **PR strategy:** `one` — single PR opens against `main` at the end.
- **Cycle count:** 6, serial.
- **No worktrees.** Each cycle commits to the audit branch directly. The next
  cycle sees the previous cycle's state.
- **TDD where it helps; doc/workflow edits ship without ceremony.** Items
  like "fix README typo" or "add NPM_TOKEN env" don't have a testable contract;
  treating them as TDD targets is theater. Items with real logic (D&D crit fix,
  registry redirect, randomFn guard) get unit tests.
- **Aggregate budget raised to 30.** Default 12 is a per-feature cap; an
  audit-sweep run touches many files but the *change* per item is small.

## Alternatives considered

1. **Per-cycle PRs (30 PRs).** Rejected: user explicitly asked for one PR. Also,
   30 PRs of trivial size is review-fatigue inducing and the cross-cutting
   themes (decorative gates, doc drift) are best appreciated together.
2. **Parallel worktrees.** Rejected: most cycles touch overlapping
   infrastructure (`package.json`, `.github/workflows/`), so write conflicts
   are likely. The orchestration cost outweighs the wall-clock savings.
3. **Skip the audit-execution-as-deliver framing entirely.** Rejected: user
   explicitly said "stick to implement/deliver." The pipeline gives us a
   record-keeping skeleton (intent, plan, cycles, review, ship) even when the
   work doesn't fit the canonical "one feature, many cycles" shape.

## Consequences

**Positive:**
- Single reviewable diff for the whole audit
- Clean record at `docs/implement/2026-05-10-audit-fixes/`
- Failed items get explicit deferral notes (deferred-with-known-findings)
  rather than silent gaps

**Negative:**
- 6 commits is below the "one commit per task" ideal — some commits will
  bundle multiple unrelated dimensions (e.g., cycle 6 has 10 items across
  arch + community + P2 code)
- The verify-envelope.sh AC text-fragment check (designed for narrow features)
  is over-strict here; we accept that the orchestrator-side verification is
  best-effort.

## References

- `audit/synthesis-top-30.md` — the spec
- `docs/implement/2026-05-10-audit-fixes/plan.md` — cycle decomposition
- `implement:deliver` SKILL.md — orchestration contract
