# Plan — Audit Top-30 Execution

run_id: 2026-05-10-audit-fixes
Source: `audit/synthesis-top-30.md`
Strategy: serial execution on `audit` branch; one consolidated PR at the end.

## Cycle decomposition (6 cycles)

Each cycle is a coherent commit-batch. Cycles are sequential, not parallel —
the audit items are mostly small, surgical, and cross-cutting; the overhead of
worktree-per-cycle isolation would dwarf the work. A worker dispatch with
`isolation: "worktree"` is unnecessary here because each cycle ends in a real
git commit on the audit branch, so subsequent cycles see the prior cycle's state
naturally.

### Cycle 1 — P0 CI / build foundations (4 items)

**ACs covered:** AC-1, AC-4, AC-5

| ID | File(s) | Action |
|----|---------|--------|
| #1 | `.github/workflows/publish.yml` | Add `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` env to changesets step |
| #3 | `package.json` (root) | Add `"check:all": "bun run check"` alias |
| #4 | `packages/roller/package.json` | `"sideEffects": ["./src/**/*"]` → `false` |
| #6 | `.github/workflows/ci.yml`, root scripts | Wire Codecov upload; investigate roller coverage scoping |

**Test strategy:** YAML/JSON syntactic validity; existing test suite unaffected. No new unit tests required (workflow changes verified by running CI).

### Cycle 2 — P0 game/app correctness (2 items)

**ACs covered:** AC-1, AC-4

| ID | File(s) | Action |
|----|---------|--------|
| #2 | `packages/games/fifth.randsum.json`, `packages/games/src/fifth.generated.ts`, `packages/games/__tests__/fifth.test.ts` | Switch crit field to `final`; regenerate; add advantage/disadvantage crit tests |
| #5 | `apps/expo/__tests__/IndexScreen.test.tsx` (or layout), `.github/workflows/ci.yml` | Fix or remove broken expo tests; add expo to CI test job |

**Test strategy:** New tests for crit-under-advantage. Expo tests reconciled with implementation.

### Cycle 3 — P1 roller engine fixes (5 items, incl. P2 #29)

**ACs covered:** AC-2, AC-3, AC-4

| ID | File(s) | Action |
|----|---------|--------|
| #11 | `packages/roller/src/modifiers/explode.ts` | Correct `description` field on `explodeSchema.docs` to state single-wave behavior |
| #12 | `packages/roller/src/modifiers/registry.ts`, registry/engine tests | Remove `parseModifiers` from registry; redirect tests to `notation/parse/parseModifiers` |
| #13 | `packages/roller/src/modifiers/explodeSequence.ts`, `registry.ts` | Fix guard: declare `randomFn` requirement, validate it, throw `ModifierError` on miss |
| #29 | `packages/roller/src/trace/traceRoll.ts`, `__tests__/trace.test.ts` | Add `integerDivide` and `modulo` to `ARITHMETIC_MODIFIERS`; cover in tests |

**Test strategy:** Unit tests for new behaviors (registry redirect, randomFn guard, trace arithmetic). Existing roller suite stays green.

### Cycle 4 — P1 coverage + game spec + bench gate (4 items)

**ACs covered:** AC-2, AC-4

| ID | File(s) | Action |
|----|---------|--------|
| #7 | `packages/games/__tests__/lib/*.test.ts` | Add targeted tests for `pipeline.ts`, `emitDetails.ts`, `refResolver.ts` to push lib coverage ≥ 80% |
| #8 | `apps/rdn/__tests__/vectors.test.ts` (new) | Bun test verifying conformance vectors integrity (no dup IDs, valid pool/total, valid conformanceLevels) |
| #16 | `.github/workflows/ci.yml` | Add bench regression gate (artifact JSON + threshold comparison) |
| #19 | `packages/games/root-rpg.randsum.json`, regen, `__tests__/root-rpg.test.ts` | Add `rollingWith: Advantage/Disadvantage` to root-rpg spec (mirror pbta) |

**Test strategy:** New unit + property tests where applicable.

### Cycle 5 — P1 apps + docs (6 items)

**ACs covered:** AC-2, AC-4

| ID | File(s) | Action |
|----|---------|--------|
| #14 | `apps/cli/src/parseArgs.ts`, `apps/cli/README.md` | Implement `-i/--interactive` flag → route to interactive renderer, OR strip from README |
| #15 | `apps/rdn/*`, `apps/cli/README.md`, `apps/discord-bot/README.md` | Reconcile RDN v1.0 vs v0.9.0 Draft claims (roll claims back to v0.9.0 Draft until v1.0 lands) |
| #17 | `apps/discord-bot/README.md`, `apps/discord-bot/railway.json` (new), or remove docs | Either commit a real `railway.json` or replace README section with what's actually used |
| #18 | `.github/workflows/expo-native-deploy.yml` | Add manual-dispatch gate to native build (avoid burning EAS minutes); defer `eas submit` step with a TODO referencing credentials needed |
| #20 | `SECURITY.md` | Reference `@randsum/roller ≥ 1.3.0`, scoped packages; add 1-line SLA |
| #22 | `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/PULL_REQUEST_TEMPLATE.md` (new), `custom.md` | RANDSUM-specific bug template; add PR template; remove or replace blank custom |

### Cycle 6 — P1 architecture + P2 remainder (10 items)

**ACs covered:** AC-2, AC-3, AC-4

| ID | File(s) | Action |
|----|---------|--------|
| #9 | `package.json` catalog, packages/games/package.json, apps/rdn/package.json | Consolidate TypeScript to single catalog version |
| #10 | `packages/dice-ui/package.json` | Move `ink` to `peerDependencies` + `peerDependenciesMeta.ink.optional: true` |
| #21 | per-package `CHANGELOG.md`, root `CHANGELOG.md` | Retrospective 1.0–1.3 block per package; archive root with monolith header |
| #23 | `.github/workflows/claude-code-review.yml` | Author-gate (`author_association ∈ MEMBER/OWNER/COLLABORATOR`); add `pull-requests: write` perm |
| #24 | `apps/expo/package.json`, `apps/expo/src/storage.native.ts` | Remove 4 unused deps (`@expo/vector-icons`, `expo-constants`, `expo-crypto`, `expo-linking`); delete unused storage |
| #25 | `apps/cli/src/index.ts`, `apps/cli/src/parseArgs.ts` | `process.exit(1)` on throws; read stdin when no args + non-TTY |
| #26 | `apps/discord-bot/src/commands/roll.ts`, game commands | Add `hidden: boolean` option → `MessageFlags.Ephemeral` |
| #27 | `package.json` (root), `apps/site/...` | Add `docs:build` script; wire into site deploy pipeline |
| #28 | `README.md` | Add Roadmap + Discord invite + Community section |
| #30 | `lefthook.yml` | Move `install` to priority-1 step; serialize before lint/format/typecheck/codegen-check |

## Dep graph

```
cycle-1 (foundations) → cycle-2 (game/app fixes) → cycle-3 (roller) → cycle-4 (coverage+bench) → cycle-5 (apps+docs) → cycle-6 (arch+P2)
```

Serial, monotone. Each cycle leaves the tree green before the next starts.

## Aggregate budget

- Planned cycles: 6
- Soft cap: 8
- Aggregate budget: 30 (raised from default 12 — audit-execution runs touch
  many files but each "cycle" here is logically a batch, not a single feature)

## Out of scope

- Items in "Honorable mentions" (the 19 items below the top-30 cut line)
- Backwards-incompatible API changes beyond what the audit items demand
- New features / game packages not enumerated in the audit
- Re-running the audit

## Deferral candidates (predicted before execution)

Items likely to land as `deferred-with-known-findings` because they need external
credentials or larger architectural moves:

- **#18 eas submit** — needs ASC API key + Play service account. Will gate the
  native build behind manual dispatch; the actual submit step is deferred.
- **#5 expo IndexScreen** — if the tests describe a UI layout that doesn't exist,
  we'll delete the broken tests rather than implement the full layout to keep
  the audit PR scoped. The intent's AC-1 lets us pick either resolution.
- **#27 TypeDoc publishing** — adding the `docs:build` script + Netlify wiring is
  feasible. Publishing under `randsum.dev/api` requires DNS or site-deploy
  config that may need separate review — will at minimum add the script and
  CI step.
