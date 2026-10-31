# @randsum/notation-spec — the RDN specification

## Overview

Published (`@randsum/notation-spec`, public) home of the RANDSUM Dice Notation spec, its conformance vectors and the `rdn-conformance` runner. It is the source of truth for all three, and `scripts/sync-notation-spec.ts` mirrors it to github.com/RANDSUM/notation-spec (see "Mirror" below). Its `README.md` is the mirror's front page, written for other roller authors, not for this monorepo.

- `spec/v<version>.md` — the specification. `apps/site` renders it at `/spec` through its `specs` content collection, whose glob loader reads this directory. Edit a version in place for a revision: bump `revision` in the front matter and add a row to Section 1.5 and to `CHANGELOG.md`. Add a new file only for a new version.
- `vectors/v<version>.json` — the conformance vectors, hand-edited. `conformanceLevels` is stored, and `__tests__/vectors.test.ts` fails unless it equals `levelsOf(vectors)` (`src/levels.ts`), so a vector's `conformanceLevel` is the only place its level is decided. notation.randsum.dev serves the file verbatim at `/conformance/v<version>.json` (its `$id`) from `apps/site/src/pages/spec/conformance/[file].ts`; add a new version's file to that page's `FILES`.
- `schema/conformance.schema.json` — JSON Schema for the vectors file, served at `/conformance/conformance.schema.json`. The vectors test holds every field to it.
- `src/runner.ts` — `runConformance()`, `judge()` and `score()`: the protocol types, the comparison rules (spec Section 11.3, including the `unseeded` checks) and level scoring. `src/cli.ts` is the bin: it bundles the latest vectors file and drives an adapter process over JSON Lines.
- `examples/randsum-roller/` — the reference adapter. `evaluate.ts` maps a request onto `roll()` and `createQueueRandom` from `@randsum/roller/random` (a devDependency, used only here and in tests); `adapter.ts` is its stdio loop. `examples/skeleton/adapter.py` is the starting point the README offers other languages.

`src/types.ts` is the vectors' TypeScript shape. Keep it, the schema and the spec's Section 11.3 field list in step.

## Tests

`__tests__/runner.test.ts` runs every vector through the reference adapter and requires Level 4, which is the spec's claim for `@randsum/roller` (Section 11.5); a roller change that breaks a vector fails here. `__tests__/cli.test.ts` runs the built bin with `node` against both adapters, so it needs `bun run build` first (it builds if `dist/cli.js` is missing).

## Mirror

`.github/workflows/sync-notation-spec.yml` runs after green CI on main. It writes the tree with `scripts/sync-notation-spec.ts`, which rewrites `package.json` (the root build toolchain, `private`) and `tsconfig.json` (inlined root options) so the mirror builds alone, adds `scripts/notation-spec-mirror/` (its CI workflow), and vendors roller's build at `vendor/roller/` (`@randsum/roller` is `file:./vendor/roller` there). The vectors can need a roller change before it is released, so the mirror tests the roller it was synced beside, not the one on npm. It pushes to the mirror's `main` and tags `v<version>-rev.<n>`.

The mirror's `check` job is required there and must never go red. `bun run check:notation-mirror` (`scripts/check-notation-mirror.ts`) runs that job's commands on a fresh tree; the notation-spec CI leg runs it, so it gates `CI Success`, and the sync runs it again on the exact tree before pushing. Preview the tree with `bun scripts/sync-notation-spec.ts <dir>`.

## Commands

```bash
bun run build       # bunup → dist/index.js + dist/cli.js (ESM), then chmod +x
bun run test        # bun test
bun run typecheck   # tsc --noEmit
node dist/cli.js -- bun examples/randsum-roller/adapter.ts   # the runner against roller
```
