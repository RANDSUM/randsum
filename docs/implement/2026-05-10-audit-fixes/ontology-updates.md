# Ontology updates — 2026-05-10-audit-fixes

## Proposed terms

- **audit-item**
  - Definition: A discrete fix listed in `audit/synthesis-top-30.md`, identified by its top-30 ordinal (#1..#30).
  - Slice: implement
  - Rationale: Lets us refer to individual fixes by stable ID across commits, review.md, and PR description.

- **deferred-with-known-findings**
  - Definition: Terminal state of an audit-item that is intentionally not shipped in the current run but is documented with rationale in `review.md`.
  - Slice: implement
  - Rationale: Aligns with `implement:develop`'s existing terminal status of the same name. We may invoke it for items requiring credentials we don't have (e.g. EAS submit step needs ASC API key).

- **priority-batch**
  - Definition: A logically grouped commit covering one or more audit-items of the same priority (P0/P1/P2) and/or the same dimension (roller, games, apps, dx, build, architecture, testing).
  - Slice: implement
  - Rationale: Names the commit-grouping strategy used to keep the audit PR diff reviewable.
