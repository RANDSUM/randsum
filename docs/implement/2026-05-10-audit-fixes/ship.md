---
run_id: 2026-05-10-audit-fixes
phase: 5
status: complete
date: 2026-05-11
pr_strategy: one
pr_created: false
pr_creation_deferred_to_user: true
---

# Phase 5 — Ship

## Strategy

`pr_strategy: one` with `--no-pr-creation`. The user opens the PR manually after review — we do **not** invoke `gh pr create`.

## Final State

- **Branch:** `audit`
- **Base:** `main` at `b4eaa04f`
- **HEAD:** `e4163b0a`
- **Commits ahead:** 15
- **Working tree:** clean
- **Remote sync:** branch is pushable (no force-push needed)

## Commit Manifest (audit-fixes scope, oldest → newest)

| # | SHA | Subject |
|---|-----|---------|
| 1 | `a6d0ceb4` | docs(audit): add audit synthesis, dimensions, and implement plan |
| 2 | `abb38927` | fix(ci): wire NPM_TOKEN, codecov upload, check:all alias, roller sideEffects |
| 3 | `00855be7` | fix(games,expo,ci): 5e crit kept-die semantics; expo two-col layout; add expo to CI |
| 4 | `98b2e26a` | fix(roller): P1 engine fixes — explode docs, dead parser, randomFn guard, trace arith |
| 5 | `a6e7752d` | feat(games/root-rpg): add Advantage/Disadvantage (mastery / helping) |
| 6 | `fb7b5a69` | test(games): mock fetch in unreachable-URL externalRefResolver test |
| 7 | `12d6202c` | test(rdn): add conformance vector data integrity suite |
| 8 | `fc9b5b6e` | ci: add bench regression gate with deterministic JSON output |
| 9 | `5f21b274` | fix(cli): implement -i/--interactive flag and fix dist build |
| 10 | `5cfe9e1c` | chore(docs): roll back RDN claims, strip phantom Railway docs, refresh templates |
| 11 | `cb1b3dca` | chore(ci): serialize bun install before parallel pre-commit steps; drop claude-code-review workflow |
| 12 | `ded3fb1c` | chore(arch): consolidate TS via catalog (6.0.2), move ink to optional peer |
| 13 | `7c084d50` | feat(apps): stdin + exit codes (cli); ephemeral hidden option (discord-bot); storage cleanup (expo) |
| 14 | `edca459c` | docs: add Roadmap & Community section to README (#28) |
| 15 | `e4163b0a` | fix(build): revert roller sideEffects + bump pbta size limit |

## Gates at Ship Time

All `check:all` gates pass on `e4163b0a`:

- ✅ `bun run lint`
- ✅ `bun run typecheck`
- ✅ `bun run format:check`
- ✅ `bun run test` (3358 pass / 0 fail)
- ✅ `bun run build`
- ✅ `bun run size` (per-package; root `bun run size` is a no-op because the script is per-package)
- ✅ `bun run check:all` (exit 0)

## Next Steps for the User

1. `git push origin audit` (or `--force-with-lease` if any rebases happened locally).
2. Open the PR manually:
   ```
   gh pr create --base main --head audit --title "audit: ship 30-item codebase review" --body "<see review.md>"
   ```
3. Optional: attach `docs/implement/2026-05-10-audit-fixes/review.md` to the PR body for context on deferred items and the bunup `sideEffects` finding.

## Deferred Items (re-stated from review.md)

- **#21** changeset retrospective — M-effort paperwork; off-branch follow-up.
- **#27** TypeDoc setup — M-effort; requires URL/IA decisions; needs design pass.
- **F-1 (sideEffects)** — re-evaluate when bunup fixes subpath tree-shake bug for re-export-only modules.

## Outcome

`shipped` — branch is in a publishable state; PR creation is the user's manual step.
