# Scaffold context — audit-fixes run

## Repo layout (relevant slices)

- `audit/synthesis-top-30.md` — the spec for this run
- `audit/dimensions/*.md` — 7 dimension reports; per-item detail lives here
- `packages/roller/` — zero-dep dice engine (notation + modifiers + traceRoll)
- `packages/games/` — codegen-driven game packages (root spec → `.generated.ts`)
  - `*.randsum.json` — source-of-truth specs (alongside generated files)
  - `src/*.generated.ts` — generated, checked into git
- `apps/cli/`, `apps/discord-bot/`, `apps/expo/`, `apps/rdn/`, `apps/site/` — apps
- `.github/workflows/` — CI matrix
- `lefthook.yml` — git hooks (pre-commit, pre-push)
- `packages/games/codegen.ts` — runs `gen` and `gen:check`

## Codegen contract

Any `.randsum.json` edit needs `bun run --filter @randsum/games gen` to
regenerate `*.generated.ts`. `gen:check` runs in pre-push to catch drift.
Hand-edits to `*.generated.ts` are forbidden — the source of truth is the JSON.

## Test commands

- `bun run lint` — ESLint across workspace
- `bun run typecheck` — TS strict check across workspace
- `bun run test` — bun:test recursive (all packages)
- `bun test packages/games/__tests__/fifth.test.ts` — single file
- `bun run --filter @randsum/roller test` — single package
- `bun run build` — bunup ESM/CJS/DTS for all publishable packages
- `bun run size` — size-limit checks
- `bun run check` — composite lint + format + typecheck (the actual command;
  the audit asks us to alias `check:all` → `check`)

## Commit hygiene

- Conventional commits (`fix(ci):`, `feat(roller):`, `docs(community):`, …)
- One commit per cycle (or finer-grained if the cycle splits naturally)
- Avoid `--no-verify` — pre-commit and pre-push hooks are mandatory

## Coverage scoping note (audit #6)

Current `bun test --coverage` shows games `lib/` at 35.6% but roller invisible.
The likely cause is that bun's coverage reporter only instruments paths
matching the test-file directory structure; running per-package and merging
may be needed. Investigate but don't block on a perfect solution — adding
the upload step with a known imperfection is still progress per AC-4.

## Decisions deferred to ADRs

Only one architectural decision merits an ADR:

- **ADR 0001 — Audit execution as one PR, six cycles**: rationale for the
  single-PR strategy, cycle batching by dimension, and serial execution
  rather than parallel worktrees.

The other decisions (which file edits to make per item) are mechanical
applications of the audit's "Fix:" lines.
