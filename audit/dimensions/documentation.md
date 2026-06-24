# Documentation & Onboarding

_Generated: 2026-06-23_
_Repos covered: randsum-monorepo_

## Summary

The randsum monorepo carries an exceptionally heavy and well-maintained documentation
investment that puts it in the top decile for a project of this size. The root `README.md`
hits every checklist item (purpose, badges, quickstart, architecture, contributing, docs links,
license); a complete contributor on-ramp exists via `CONTRIBUTING.md` plus a root and
per-package `CLAUDE.md` system; there are 19 well-indexed MADR-style ADRs; a real operational
runbook (`apps/DEPLOY.md`) with rollback/DR/token-rotation procedures and an RCA template; two
dedicated documentation sites (randsum.dev Starlight, notation.randsum.dev formal spec) with a
1,537-line RFC-2119 conformance spec; TypeDoc wired for API generation; and machine-readable
docs surfaces (`/docs` subpath, `llms.txt`). Onboarding friction is genuinely low — a new
contributor can go from clone to green build via a single documented `bun run check:all`.
Gaps are minor and hygienic: TypeDoc output is configured but not published, two READMEs
(`apps/cli`, `apps/rdn`) are thin, one known stale README (`apps/discord-bot` pm2 path) is
flagged but not yet fixed, and the `runbooks/incidents/` directory holds no real RCAs (greenfield).

**Overall grade:** A

## Framework anchors

- **ISO/IEC 25010 §6.4.1** — Appropriateness Recognisability (purpose is stated up front in
  every README and `CLAUDE.md`).
- **ISO/IEC 25010 §6.4.2** — Learnability (single-command setup; layered contributor guides).
- **Diátaxis** — the doc estate cleanly separates tutorial (getting-started pages), how-to
  (DEPLOY runbook, "Adding a New Game"), reference (ADRs, TypeDoc, formal spec, API-reference
  pages), and explanation (ADR rationale, RDN spec abstract).

## Findings

### F1 — Generated API reference (TypeDoc) is configured but never published

- **Severity:** Medium
- **Location:** `typedoc.json`, `tsconfig.typedoc.json`, root `package.json:66` (`"docs:api": "typedoc"`), `.gitignore:93` (`/docs/api/`)
- **Evidence:** TypeDoc is fully wired — entry points cover `packages/roller/src/index.ts`
  plus the 7 generated game modules, output to `docs/api/`, private/internal symbols excluded.
  But `docs/api/` is git-ignored and the root README explicitly states "publishing the
  generated output to randsum.dev is out of scope here — only the config + script are wired up."
  The hand-authored `*/api-reference.mdx` pages on randsum.dev are the de-facto public API
  reference and must be kept in sync with the code by hand.
- **Impact:** The authoritative, always-current generated API surface is invisible to
  consumers. Hand-maintained API-reference pages are a doc-rot vector — they can silently drift
  from the actual exported signatures since nothing regenerates or diffs them against TypeDoc.

### F2 — Known-stale `apps/discord-bot/README.md` flagged but not corrected

- **Severity:** Medium
- **Location:** `apps/discord-bot/README.md:182`; contradiction called out in `apps/DEPLOY.md:117-118`
- **Evidence:** The README still documents a self-hosted run path (`node dist/index.js  # or
via pm2 / systemd / docker`), but the committed infrastructure-as-code (`render.yaml`) hosts
  the bot as a Render worker. `apps/DEPLOY.md` already notes "treat Render as the source of
  truth for hosting," so the discrepancy is acknowledged in one doc while the other remains
  uncorrected.
- **Impact:** "Doc rot beats no docs" — a confidently-wrong hosting path can send an operator
  down a pm2/systemd route that does not match production. Low blast radius (private app, single
  maintainer) keeps this at Medium rather than High.

### F3 — Two thin READMEs: `apps/cli` and `apps/rdn`

- **Severity:** Low
- **Location:** `apps/cli/README.md` (62 lines) + `apps/cli/CLAUDE.md` (41 lines, thinnest of all); `apps/rdn/README.md` (26 lines)
- **Evidence:** `apps/cli` is the thinnest README+CLAUDE pair — adequate install/command
  reference but no architecture or test-pattern notes. `apps/rdn/README.md` is bare-minimum (26
  lines) and delegates almost everything to its `CLAUDE.md`. No file is below 20 lines, so there
  are no empty stubs.
- **Impact:** Minor onboarding friction for these two surfaces only; both are buffered by solid
  `CLAUDE.md` files, so a contributor is not blocked, just under-served relative to the
  monorepo's high baseline.

### F4 — Runbook coverage is template-only for incidents

- **Severity:** Low
- **Location:** `runbooks/incidents/.gitkeep` (empty), `runbooks/RCA-template.md`
- **Evidence:** A high-quality RCA template exists (timeline, root-cause vs trigger, detection
  gap, action items), and `apps/DEPLOY.md` documents the copy-to-`incidents/` workflow, but the
  `incidents/` directory contains only a `.gitkeep`. This is expected for a project with no
  recorded outages, not a defect — noted for completeness.
- **Impact:** None today. The process is documented and ready; there is simply no incident
  history to learn from. Flagged so it is not mistaken for missing runbook coverage.

### F5 — External dependencies the audit cannot verify (Discord, project board, password vault)

- **Severity:** Low
- **Location:** `README.md:165-169`, `apps/DEPLOY.md:54-55` (registrar/Netlify DNS + store
  credentials "in the team password vault")
- **Evidence:** Roadmap/community routing points to a GitHub project board and Discord; DR notes
  correctly externalize DNS records and store credentials to a password vault. These are sound
  practices but live outside the repo and cannot be confirmed by this read-only audit.
- **Impact:** Negligible — flagged per the skill's "linked external resources count, but note
  the gap" guidance. Bus-factor risk concentrates on the single maintainer who holds vault access.

## Metrics

| Repo             | Metric                     | Value                                                                                                  | Notes                                                                                                                                                                                     |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| randsum-monorepo | README completeness (root) | 5/5                                                                                                    | Purpose, quickstart, architecture, contributing link, license — all present, plus CI/version/coverage-adjacent badges                                                                     |
| randsum-monorepo | README count / coverage    | 14 README files                                                                                        | Every published package + private app has one; quality ranges from comprehensive (roller 199L, discord-bot 212L) to thin (rdn 26L)                                                        |
| randsum-monorepo | API doc presence           | Generated (config) + hand-authored reference                                                           | TypeDoc configured but output gitignored/unpublished; `*/api-reference.mdx` pages on randsum.dev are the live, hand-maintained surface — Partial-to-Generated, not "generated + reviewed" |
| randsum-monorepo | ADR count + recency        | 19 ADRs; most recent commit 2026-06-21                                                                 | Consistent MADR-ish format, indexed `docs/adr/README.md` with categories, status tracking (Accepted/Superseded/Amended), and an "For AI Agents" consult-before-task map                   |
| randsum-monorepo | Runbook coverage           | Comprehensive (deploy + rollback + DR + token rotation) for all 6 surfaces; incident log empty         | `apps/DEPLOY.md` last verified 2026-06-13; covers Netlify, EAS, Render, npm; RCA template present, no recorded incidents                                                                  |
| randsum-monorepo | Onboarding friction        | Low — est. minutes-to-first-build                                                                      | `git clone && bun install && bun run check:all` is the entire documented path; prerequisites (Bun, Node, Git) listed; layered CLAUDE.md guides per package                                |
| randsum-monorepo | Documentation freshness    | High — 32 doc-touching commits in last 90 days; most key docs touched within ~2-10 days of audit       | README/CONTRIBUTING/DEPLOY/ADRs all updated June 2026; no stale `@randsum/notation` refs in user-facing docs                                                                              |
| randsum-monorepo | Dedicated doc sites        | 2 (randsum.dev: 29 MDX pages; notation.randsum.dev: 1,537-line formal spec + 48 conformance vectors)   | Both current; no removed-package references                                                                                                                                               |
| randsum-monorepo | Machine-readable docs      | `llms.txt` (root, 41L), `/docs` subpath (`NOTATION_DOCS`/`MODIFIER_DOCS`/`DICE_DOCS`), `llms-full.txt` | Notably mature LLM/tooling doc surface                                                                                                                                                    |

## Recommendations

- **R1** — Publish the TypeDoc output (currently git-ignored `docs/api/`) to a stable URL and
  link it from the README, OR generate it in CI and diff against the hand-authored
  `*/api-reference.mdx` pages to catch signature drift. Closes the only structural doc-rot
  vector (F1). [Horizon: next] [Risk reduction: Med]
- **R2** — Correct `apps/discord-bot/README.md` to make Render the documented hosting path (or
  explicitly mark the pm2/systemd/docker block as "alternative self-host, not production"),
  resolving the contradiction already noted in `apps/DEPLOY.md` (F2). [Horizon: now] [Risk reduction: Med]
- **R3** — Expand the two thin surfaces: add architecture/test-pattern notes to
  `apps/cli/CLAUDE.md` and a brief structure/deploy section to `apps/rdn/README.md` so they meet
  the monorepo's own baseline (F3). [Horizon: later] [Risk reduction: Lo]
- **R4** — Capture vault/DNS/store-credential ownership and the bus-factor mitigation in a
  short access/ownership note (the DR sections reference the vault but not who holds it) (F5).
  [Horizon: later] [Risk reduction: Lo]

## Confidence

- **Directly observable (high confidence):** README/CONTRIBUTING/SECURITY/DEPLOY/ADR contents
  and line counts, ADR count (19) and recency (git-dated 2026-06-21), TypeDoc config and its
  git-ignored output, the `apps/discord-bot` pm2-vs-Render contradiction (read in both files),
  doc-site page counts (29 MDX on randsum.dev, 1,537-line rdn spec), and the absence of stale
  `@randsum/notation` references in user-facing docs (grep-verified; the only matches were the
  CHANGELOG history and a roller `CLAUDE.md` line that itself documents the package's removal).
- **LLM-estimated (treat as judgment, not measurement):** the "README completeness 5/5" score
  and the per-file quality assessments are checklist judgments, not a docs linter (no vale /
  markdownlint run, per skill v1 scope). "Onboarding friction: Low" is an inference from reading
  the documented setup path, not a timed clone-to-commit rehearsal. Documentation-freshness
  figures derive from `git log` commit dates over `*.md`/`docs/`/`runbooks/`, which reflect when
  files were last touched, not whether their content is semantically current.
- **Sampling note:** Package/app READMEs and all 9 `CLAUDE.md` files were surveyed via a
  read-pass (not every line of every file re-read into this report); the two doc sites were
  inventoried by structure and spot-read rather than page-by-page. ADR _bodies_ beyond the index
  were not all read individually — the index, format consistency, and recency were verified, but
  per-ADR content accuracy was not exhaustively cross-checked against the code.
- **Unverifiable (external):** Discord server, GitHub project board, and the team password vault
  referenced in DR notes are outside the repo and were not inspected (F5).
