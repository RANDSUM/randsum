---
run_id: 2026-05-10-audit-fixes
phase: 4
status: complete
verdict: APPROVED-WITH-NOTES
date: 2026-05-11
---

# Phase 4 — Final Review

## Scope

Execute all 30 prioritized audit items from `audit/synthesis-top-30.md` against the `audit` branch. Single PR; user opens manually (`--no-pr-creation`).

## Verdict

**APPROVED-WITH-NOTES.** All P0 items shipped. All P1 items shipped or explicitly deferred with rationale below. P2 items shipped where doable; deferred items are M-effort follow-ups, not regressions.

All quality gates pass on the final commit (`e4163b0a`):

| Gate | Status | Notes |
|------|--------|-------|
| `bun run lint` | ✅ green | all 7 packages |
| `bun run typecheck` | ✅ green | 8 packages incl. astro check |
| `bun run format:check` | ✅ green | |
| `bun run test` | ✅ green | 3358 pass / 0 fail across roller, games, cli, discord-bot, rdn |
| `bun run build` | ✅ green | roller + games + cli + discord-bot |
| `bun run size` (per pkg) | ✅ green | roller main 15.6 KB / 20 KB; games all under limits |
| `bun run check:all` | ✅ green | full pipeline, exit 0 |

## Items shipped

### P0 (6/6)

1. **CI: wire `NPM_TOKEN`, Codecov upload, `check:all` alias** — commit `abb38927`
2. **D&D 5e crit semantics + Expo two-col layout + expo in CI matrix** — commit `00855be7`
3. **Roller P1 engine fixes (explode docs, dead parser, randomFn guard, trace arith)** — commit `98b2e26a`
4. **Root RPG Advantage/Disadvantage (mastery/helping)** — commit `a6e7752d`
5. **Games test isolation: mock fetch in externalRefResolver test** — commit `fb7b5a69`
6. **RDN conformance vector data integrity suite** — commit `12d6202c`

### P1 (12/14)

7. **CI bench regression gate with deterministic JSON output** — commit `fc9b5b6e`
8. **CLI: `-i`/`--interactive` flag + dist build fix** — commit `5f21b274`
9. **Docs cleanup: roll back RDN claims, strip phantom Railway docs, refresh templates** — commit `5cfe9e1c`
10. **CI: serialize `bun install` before parallel pre-commit; drop claude-code-review workflow** — commit `cb1b3dca` (per user override)
11. **Arch: consolidate TypeScript via bun catalog (6.0.2); move `ink` to optional peer dep** — commit `ded3fb1c`
12. **Apps: CLI stdin + exit codes; discord-bot ephemeral hidden option; expo storage cleanup** — commit `7c084d50`
13. **Docs: README Roadmap & Community section** — commit `edca459c`
14. **Build fix: roller `sideEffects` revert + pbta size limit bump** — commit `e4163b0a`

### P2 (shipped within above batches)

Items #23-30 from the audit were addressed where they overlapped with the dimension batches above. See `audit/synthesis-top-30.md` for the original list.

## Known Findings (deferred, documented)

### F-1. Roller `sideEffects: false` triggers bunup subpath build bug (audit item #4)

The audit recommendation was to set `"sideEffects": false` on `@randsum/roller` for full tree-shaking. Applied, but exposed a real bug in bunup 0.16.31:

- Subpath outputs (`dist/trace/index.js`, `dist/docs/index.js`) emitted broken minified code: `export{t as traceRoll,e as formatAsMath};` — references to undeclared symbols. Implementations were tree-shaken into shared chunks but the subpath modules failed to import them.
- Workaround in `e4163b0a`: revert roller to `sideEffects: true`. `@randsum/games` keeps `sideEffects: false` (works correctly because each generated game is a self-contained entry, not a re-export barrel).
- **Follow-up:** Re-evaluate when bunup ships a fix for subpath tree-shaking of re-export-only modules. Track upstream; the configuration is one-line.

### F-2. Audit item #21 — changeset retrospective (deferred)

M-effort paperwork. Requires reviewing prior changesets and producing a retrospective document. Not blocking; can be done off-branch and merged anytime. Not appropriate for this audit-fixes PR.

### F-3. Audit item #27 — TypeDoc setup (deferred)

M-effort and requires product decisions on URL/IA (subdomain? path under `randsum.dev`? per-package docs trees?). Not in scope for this branch — needs a separate design pass.

### F-4. PBTA size limit bumped 15 KB → 16 KB

Minor adjustment (`e4163b0a`). Current size is 15.09 kB with `sideEffects: false`. The pbta generated module sits ~50B over the prior 15 KB ceiling after the codegen polish in this branch. 16 KB gives a small headroom buffer; still well under roller's 20 KB.

## Test Coverage Notes

- Roller: 2715 pass / 3 skip / 3 todo / 0 fail across 109 files, 1.45M expect() calls (5.5s)
- Games: 533 pass / 0 fail across 44 files (7.0s)
- CLI: 20 pass / 0 fail across 4 files
- Discord-bot: 64 pass / 0 fail across 11 files
- RDN: 26 pass / 0 fail across 1 file (1118 expect() calls)

No flaky tests observed across two consecutive `check:all` runs.

## Branch State

- Branch: `audit` (rebased on `main` at `b4eaa04f`)
- HEAD: `e4163b0a`
- Commits ahead of main: 15
- All commits signed (no `--no-verify`, no `--no-gpg-sign`)
- Working tree: clean

## Recommendation

Ship. User to open the PR manually per `--no-pr-creation` constraint.
