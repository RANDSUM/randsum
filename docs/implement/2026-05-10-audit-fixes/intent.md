---
run_id: 2026-05-10-audit-fixes
source:
  kind: spec
  ref: audit/synthesis-top-30.md
intent: |
  Execute every prioritized improvement enumerated in audit/synthesis-top-30.md
  (30 items across P0/P1/P2) and ship the result as a single PR on the `audit`
  branch targeting `main`. Each item's "Fix:" line is the canonical requirement.
out_of_scope:
  - Items in the "Honorable mentions" section that did not make the top 30
  - API-breaking changes beyond those an individual audit item explicitly demands
  - New game packages, modifiers, or features not enumerated in the audit
  - Re-running the audit itself or expanding it with new findings
proposed_ontology_terms:
  - audit-item
  - deferred-with-known-findings
  - priority-batch
acceptance_criteria:
  - id: AC-1
    text: |
      All six P0 audit items (#1–#6) are implemented and verified — NPM_TOKEN wired,
      D&D 5e crit field fixed, check:all alias added, roller sideEffects corrected,
      expo IndexScreen tests fixed and added to CI, and Codecov upload wired.
  - id: AC-2
    text: |
      All sixteen P1 audit items (#7–#22) are either implemented or explicitly
      marked deferred-with-known-findings in the run's review.md with concrete
      rationale (e.g. blocked on external credentials, larger refactor required).
  - id: AC-3
    text: |
      All eight P2 audit items (#23–#30) are either implemented or explicitly
      marked deferred-with-known-findings with rationale.
  - id: AC-4
    text: |
      `bun run check:all` (or its component subset: lint, typecheck, test, build,
      size, knip) passes locally on the final commit of the audit branch with no
      regressions versus pre-audit baseline.
  - id: AC-5
    text: |
      No publishable package exceeds its declared size-limit budget. Bundle-size
      checks pass on the final commit.
  - id: AC-6
    text: |
      Work lands in logically batched conventional commits on branch `audit`
      (e.g. `fix(ci):`, `fix(roller):`, `docs(community):`) — not one mega-commit.
  - id: AC-7
    text: |
      A single PR is opened against `main` whose description summarizes every
      audit-item disposition (shipped / deferred-with-rationale) by ID and links
      back to audit/synthesis-top-30.md.
---

# Audit Execution — Top-30 Improvements

## Source

`audit/synthesis-top-30.md` (synthesized 2026-05-10 from 7 dimension audits in
`audit/dimensions/`). Treated as the spec.

## Intent

Drive all 30 prioritized improvements to terminal state — shipped or
deferred-with-known-findings — and integrate the result as a single PR.

## Approach

P0 first (blockers for publish/correctness), then P1 (real friction), then P2
(polish). Commits batched by dimension (build/CI, roller, games, apps, dx, arch)
to keep the diff reviewable.

## Acceptance Criteria

See YAML frontmatter above. Seven criteria covering:
- AC-1..3: per-priority completion
- AC-4: check:all green
- AC-5: bundle size compliance
- AC-6: commit hygiene
- AC-7: single PR with disposition summary

## Out of Scope

See YAML frontmatter. Notably: items in "Honorable mentions" (the 19 items below
the top-30 cut line), new feature work, and re-auditing.

## Proposed Ontology Terms

- **audit-item** — a discrete fix listed in audit/synthesis-top-30.md, identified
  by its #N number.
- **deferred-with-known-findings** — terminal state when an item is acknowledged
  but not shipped this run, accompanied by concrete rationale in review.md.
- **priority-batch** — commit grouping by audit priority (P0/P1/P2) and/or
  affected dimension (roller, games, apps, etc).
