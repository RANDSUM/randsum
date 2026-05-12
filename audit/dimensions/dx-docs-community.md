# DX, Docs, Community, Roadmap Audit

_Audited: 2026-05-10_

---

## Summary

The RANDSUM project has a stronger documentation and DX foundation than most solo-authored OSS projects at its maturity level. The root README answers the "what/why/how/30-second example" bar. Per-package READMEs are thorough. TypeScript and JSDoc coverage on the public `roll()` function is genuinely excellent. The ADR index is well-structured and the AI-agent guidance section is a standout feature.

The gaps that hold back broader adoption are concentrated in three areas: (1) community infrastructure is mostly absent (no FUNDING, no PR template, no Discord invite, no roadmap link from the README); (2) changelog hygiene is split between a stale root CHANGELOG and thin per-package changelogs that record only the Changesets bootstrap entry; and (3) the `SECURITY.md` version table references the legacy monolith's semver (`3.x.x`) rather than the current scoped-package versions (`1.3.0`). There is also a documentation inconsistency where `CONTRIBUTING.md` and `CLAUDE.md` both instruct contributors to run `bun run check:all`, which does not exist in the root `package.json` — only `check` does.

---

## Findings

### F1. `check:all` command documented but does not exist — P0 — Onboarding

**Observation:** `CONTRIBUTING.md` (line 18: `bun run check:all`) and root `CLAUDE.md` (Commands section) both tell contributors to run `bun run check:all` to verify the repo is healthy. The root `package.json` has no `check:all` script — only `check` (which delegates to per-package `check` scripts via `--filter`). A first-time contributor following the documented onboarding path gets `error: script "check:all" not found`.

**Why it matters:** This is the single highest-friction onboarding failure: you follow the official instructions, immediately hit an error, and don't know whether the repo is broken or you are. It erodes trust before a contributor writes a single line of code.

**Recommendation:** Either add `"check:all": "bun run check"` alias to the root `package.json`, or update `CONTRIBUTING.md` and `CLAUDE.md` to use `bun run check`. The alias approach is safer — no doc churn if the command name changes again.

**Effort:** S

---

### F2. `SECURITY.md` references the legacy monolith semver — P1 — Docs

**Observation:** `SECURITY.md` says version `3.x.x` is the supported version. The git tag history shows the monolith topped out at `v9.0.3` before the packages were split. Current scoped packages (`@randsum/roller`, `@randsum/games`, `@randsum/cli`) are all at `1.3.0`. The supported-version table is wrong on two counts: the version family (should be `1.x.x`, or ideally `>= 1.3.0`) and the framing (should name the scoped packages, not an anonymous monolith). The reporting instructions are also minimal — a one-line email address is fine for a solo project, but the policy says nothing about SLA, disclosure timeline, or CVE process.

**Why it matters:** npm's security tooling and dependabot use the supported-versions table to decide whether to alert downstream consumers. An incorrect table undermines this. Security researchers who discover a real issue may not bother if the policy looks abandoned.

**Recommendation:** Update `SECURITY.md` to reference `@randsum/roller ≥ 1.3.0`, `@randsum/games ≥ 1.3.0`. Add a rough SLA sentence ("I aim to respond within 7 days"). Remove the monolith table.

**Effort:** S

---

### F3. Root CHANGELOG is frozen at `[3.0.0] — 2024` — P1 — Docs

**Observation:** `CHANGELOG.md` at the repo root documents the old monolith's `3.0.0` and `2.x` releases. Per-package changelogs (`packages/roller/CHANGELOG.md`, etc.) each contain exactly one entry: the Changesets bootstrap (`1.3.0` with note "Testing changes for 2.0.0 release"). There is no record of any changes between the monolith split and `1.3.0`. The git log shows ~269 commits in 90 days, none of which appear in a changelog. Changesets is configured and integrated into the publish workflow (which creates PRs with version bumps), so the infrastructure exists — it just has not been used.

**Why it matters:** Without a changelog, consumers cannot audit breaking changes during upgrades. The `1.3.0` entry's message ("Testing changes for 2.0.0 release") also actively misleads about the current version being a testing artifact rather than a stable release.

**Recommendation:** Write a retrospective `1.0.0`-through-`1.3.0` block in each per-package CHANGELOG covering the split from the monolith. Archive the root CHANGELOG with a header noting it covers the pre-split monolith. Going forward: open Changeset files on every PR that ships a user-visible change.

**Effort:** M

---

### F4. Issue templates are generic GitHub defaults — P1 — Community

**Observation:** `.github/ISSUE_TEMPLATE/bug_report.md` uses the out-of-the-box GitHub template with fields like "Browser [e.g. chrome, safari]", "Device [e.g. iPhone6]", and "OS: [e.g. iOS]". These fields are irrelevant for a dice-rolling library. There is no `labels:` front-matter set on any template, no assignees, and `custom.md` is a blank stub. There is no PR template (`.github/PULL_REQUEST_TEMPLATE.md` does not exist), so PRs arrive with no guidance on what to include.

**Why it matters:** Browser/device fields on a dice engine bug report signal to potential contributors that the project hasn't invested in contributor tooling. Missing PR template means every PR requires back-and-forth to establish basic context (what does it change, does it have tests, does it affect the notation spec).

**Recommendation:** Replace `bug_report.md` with a RANDSUM-specific template: notation string that reproduced the bug, expected vs actual `roll()` output, `@randsum/roller` version. Add `labels: bug` front-matter. Create a minimal PR template with checkboxes: tests added, `bun run check` passes, CHANGELOG entry added if user-visible.

**Effort:** S

---

### F5. No FUNDING.yml — missing sponsorship signal — P2 — Community

**Observation:** `.github/FUNDING.yml` does not exist. The project has 8 years of history, a growing npm download base, and active maintenance. There is no visible path for users who want to support the project financially. The root README has no "Sponsor" or "Support" section.

**Why it matters:** This is a low-effort signal that matters for sustainability perception. OSS consumers increasingly look for maintainer funding transparency. GitHub shows a "Sponsor" button only when FUNDING.yml is present.

**Recommendation:** Create `.github/FUNDING.yml` with at minimum `github: alxjrvs`. Add a brief "Support" line or badge to the root README near the bottom badges block.

**Effort:** S

---

### F6. No PR template — P1 — Community / Onboarding

**Observation:** Covered in F4 above, but worth a separate finding due to distinct impact. Without a PR template, maintainer review time increases and contributor expectations are unclear. Combined with the "custom" blank issue template, the message received is that the project accepts ad-hoc contributions without a defined process.

**Why it matters:** A PR template is a low-cost investment that pays back in review quality. It also communicates that the project is serious about maintaining code quality, which attracts higher-quality contributions.

**Recommendation:** Create `.github/PULL_REQUEST_TEMPLATE.md` with sections: Summary, Type of change (bug/feature/docs/chore), Checklist (tests, `bun run check` passes, CHANGELOG if applicable, ADR updated if architectural).

**Effort:** S

---

### F7. TypeDoc configuration exists but output is not published — P2 — Docs

**Observation:** `typedoc.json` is fully configured with entry points for `@randsum/roller` and all six game subpaths. It outputs to `docs/api/`. However, that directory does not exist in the working tree (TypeDoc has never been run here), there is no `typedoc` script in the root `package.json`, it is not invoked in any CI workflow, and no URL (`randsum.dev/api/`, `gh-pages`, etc.) is linked from any README or the docs site.

The `@randsum/roller` `roll()` function has excellent JSDoc (full `@param`/`@returns`/`@example` coverage: ~250 JSDoc blocks found), which means the raw material for generated API docs is high quality. It is just never rendered for consumers.

**Why it matters:** API reference docs dramatically reduce the support burden for consumers integrating the library. The JSDoc is written — the gap is the publication step.

**Recommendation:** Add a `docs:build` script to root `package.json` (`typedoc --options typedoc.json`). Publish to `randsum.dev/api/` either via the Netlify build pipeline (`bun run docs:build && bun run site:build`) or as a GitHub Pages site. Link from the roller README and docs site nav.

**Effort:** M

---

### F8. Root README has no roadmap link, Discord invite, or community section — P2 — Community / Roadmap

**Observation:** The root README covers installation, examples, development setup, and has a personal "Why did you make this?" section. It does not link to: the GitHub Project board (referenced in CONTRIBUTING.md, which consumers don't typically read), the Discord bot (only listed as an internal app with no invite link), or any community channel. There is also no "Roadmap" or "What's coming" teaser that would indicate to a potential adopter that the project is actively evolving.

**Why it matters:** First-time visitors to the README decide within seconds whether to invest attention. A community section (Discord, project board, or even just "check the GitHub issues for what's coming") converts curious visitors into engaged users or contributors.

**Recommendation:** Add a brief Community / Roadmap section to the root README: link to the GitHub Project board, a Discord invite once the bot is listed (epic #939), and a one-liner on upcoming game packages (Fate Core, PF2e, Ironsworn). The Discord invite link on `randsum.dev/discord/` already exists in the site `llms.txt` — use that URL in the README.

**Effort:** S

---

### F9. CONTRIBUTING.md omits the "adding a modifier" contributor path — P2 — Onboarding

**Observation:** `CONTRIBUTING.md` describes two contribution paths: adding a game (4 steps with a reference to `packages/games/CLAUDE.md`) and general code style. There is no guidance for the other natural contribution surface: adding or fixing a modifier in `@randsum/roller`. A contributor who wants to add a `cap` modifier or fix `reroll` behavior has no documented starting point. The CLAUDE.md (root) mentions `packages/roller/src/modifiers/index.ts` as the single source of truth, but this is AI-agent guidance, not public contributor documentation.

**Why it matters:** Modifier contributions are likely the highest-value external contribution type. The notation spec at `notation.randsum.dev` explicitly defines the modifier taxonomy, which means informed contributors from the TTRPG community could show up with well-scoped PRs — but only if they know how the modifier registry works.

**Recommendation:** Add a "Adding or modifying a modifier" section to `CONTRIBUTING.md`: (1) read the relevant ADRs (ADR-007, ADR-014), (2) add a file in `packages/roller/src/modifiers/` following the co-location pattern, (3) register in `RANDSUM_MODIFIERS` array, (4) add tests, (5) update notation spec if applicable.

**Effort:** S

---

### F10. `llms.txt` at repo root is a minimal stub; no `llms-full.txt` — P2 — Docs

**Observation:** The root `llms.txt` is 42 lines of quick-start content: package listing, roll examples, and four links. The notation spec site (`apps/rdn/public/llms-full.txt`) provides the full RDN specification text but covers only the notation spec, not the `@randsum/roller` API surface, game packages, or codegen schema. The site `llms.txt` (in `apps/site/dist/`) is a URL index with no prose content. No `llms-full.txt` exists at `randsum.dev` (only at `notation.randsum.dev`). An AI agent trying to understand how to use `@randsum/games/blades` gets no machine-readable prose — only links to docs pages.

**Why it matters:** LLM-native discoverability is increasingly a first-class concern. The `llms.txt` standard exists specifically to give AI tools the information they need to correctly use a library without hallucinating APIs. Given RANDSUM's investment in AI tooling (Claude Code skills, LLM statement in README), this is a natural area to polish.

**Recommendation:** Expand root `llms.txt` to cover the game packages (each with a brief consumer example and result type), the error-handling contract, and the codegen schema. Optionally add a `llms-full.txt` at the root that concatenates the roller JSDoc summary + game package summaries + notation spec reference.

**Effort:** M

---

### F11. Issue template labels not set; `custom.md` is a blank stub — P3 — Community

**Observation:** All three issue templates (`bug_report.md`, `feature_request.md`, `custom.md`) have `labels: ''` (empty) in their front-matter. GitHub issue labels are not applied automatically, so all incoming issues land unlabeled. `custom.md` has a placeholder about-string ("Describe this issue template's purpose here.") and empty body — it was never completed and should be removed or replaced.

**Why it matters:** Unlabeled issues are harder to triage and filter. The blank template adds noise to the template picker without providing value.

**Recommendation:** Add `labels: bug` to `bug_report.md`, `labels: enhancement` to `feature_request.md`. Delete `custom.md` or replace it with a "notation question / spec clarification" template. Ensure the corresponding labels exist on the GitHub repo.

**Effort:** S

---

### F12. Roadmap epics lack public-facing entry points; project board not linked from README — P2 — Roadmap

**Observation:** The GitHub Project board exists and is referenced in `CONTRIBUTING.md`. The active epics (#939–#947 per memory) have defined scope and priority. However: (1) the board URL is buried in CONTRIBUTING, not in the README; (2) there is no `ROADMAP.md` or roadmap section in the README; (3) the root `llms.txt` and docs site do not mention upcoming game systems. External contributors and potential adopters have no easy way to discover what is being worked on or where to contribute.

**Why it matters:** A visible roadmap converts users into contributors ("I use Pathfinder 2e, I see it's on the roadmap, I want to help") and signals project health to evaluators. RANDSUM's roadmap is actively maintained — it just isn't surfaced.

**Recommendation:** Add a "Roadmap" section or badge to the root README with a single sentence and the project board link. No need for a full `ROADMAP.md` — the board is already doing that work. Optionally add upcoming game names (Fate Core, PF2e, Ironsworn) as a one-liner teaser.

**Effort:** S
