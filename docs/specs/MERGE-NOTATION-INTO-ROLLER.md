# Merge @randsum/notation into @randsum/roller

Spec for issue #1000. `@randsum/notation` is fully absorbed into `@randsum/roller`. After this merge, `packages/notation/` is deleted and `@randsum/notation` is deprecated on npm. This document is the implementation reference.

## Goal and Rationale

Notation was extracted to allow independent consumption of parsing logic. In practice that benefit never materialized: only two packages outside roller (`@randsum/component-library` and `apps/cli`) imported notation directly, and both only used `tokenize` and `Token` types. The cost was high: 33 cross-package imports across 30 files, two build steps, coordinated versioning, and every modifier definition split across two packages. The merge eliminates all of that friction. Subpath exports on roller preserve the ability to import tokenization and comparison utilities without pulling in the full roll engine.

See ADR-005 for the full decision record.

## File Movement Plan

All notation source files move into `packages/roller/src/`. The directory layout after the move:

```
packages/roller/src/
  notation/                        # NEW — contains moved notation source
    comparison/                    # from packages/notation/src/comparison/
      index.ts
      (all files verbatim)
    definitions/                   # from packages/notation/src/definitions/
      arithmetic.ts                # internal factory used by plus.ts and minus.ts; not exported from barrel
      cap.ts
      compound.ts
      count.ts
      countFailures.ts
      countSuccesses.ts
      drop.ts
      explode.ts
      explodeSequence.ts
      index.ts
      integerDivide.ts
      keep.ts
      minus.ts
      modulo.ts
      multiply.ts
      multiplyTotal.ts
      penetrate.ts
      plus.ts
      replace.ts
      reroll.ts
      sort.ts
      unique.ts
      wildDie.ts
    parse/                         # from packages/notation/src/parse/
      listOfNotations.ts
      notationToOptions.ts
    transformers/                  # from packages/notation/src/transformers/
      modifiersToStrings.ts
      optionsToDescription.ts
      optionsToNotation.ts
      optionsToSidesFaces.ts
    constants.ts
    coreNotationPattern.ts
    formatHumanList.ts
    isDiceNotation.ts
    schema.ts
    suggestions.ts
    tokenize.ts
    types.ts
    validateNotation.ts
  lib/
    modifiers/
      behaviors/                   # unchanged
      definitions/                 # modifier definitions — see Modifier Unification below
      index.ts
      log.ts
      priorities.ts
      registry.ts
      schema.ts                    # update NotationSchema import; keep ModifierBehavior/ModifierDefinition here
    ...
```

### Files That Are Deleted

- `packages/notation/` — entire directory, after the move is complete and tests pass
- `packages/notation/CLAUDE.md` — gone with the package

## Test Migration Plan

`packages/notation/__tests__/` contains 24 test files. They all move to `packages/roller/__tests__/notation/`.

### Overlap check

Two notation test files share names with existing roller tests. Merge, do not duplicate:

| Notation test | Existing roller test | Action |
|---|---|---|
| `validateNotation.test.ts` | `__tests__/validateNotation.test.ts` | Merge into the existing roller file, then delete the notation copy |
| `dist.smoke.test.ts` | `__tests__/dist.smoke.test.ts` | Merge notation-specific smoke assertions, then delete the notation copy |

All other notation test files have no roller counterpart and move verbatim to `__tests__/notation/`.

### Import rewrite in moved tests

Notation test files import from `'../src/index'` or `'../src'`. After moving to `packages/roller/__tests__/notation/`, update to import from roller's source or public API:

```typescript
// Before (in packages/notation/__tests__/tokenize.test.ts):
import { tokenize } from '../src/index'

// After (in packages/roller/__tests__/notation/tokenize.test.ts):
import { tokenize } from '../../src/notation/tokenize'
// or, for public API tests:
import { tokenize } from '@randsum/roller/tokenize'
```

Use relative imports for unit tests that are testing internals; use the public subpath for integration/smoke tests.

### Also update roller's existing notation import

`packages/roller/__tests__/lib/notation.roundtrip.test.ts` imports from `@randsum/notation`. After the merge, change to:

```typescript
import { notationToOptions } from '../../src/notation'
```

## Import Rewriting Rules

### Inside roller (33 occurrences across 30 files)

Every `import ... from '@randsum/notation'` in roller's source becomes a relative import pointing into `src/notation/`. Full file list:

| Importing file | New import path |
|---|---|
| `src/errors.ts` | `'./notation/isDiceNotation'` (re-exports `NotationParseError`) |
| `src/validate.ts` | specific subpaths in `'./notation/'` |
| `src/types/index.ts` | `'./notation/types'` |
| `src/types/core.ts` | `'./notation/types'` |
| `src/types/modifiers.ts` | `'./notation/types'` |
| `src/roll/parseArguments.ts` | `'../notation'` (barrel) |
| `src/lib/comparison/index.ts` | `'../../notation/comparison'` |
| `src/lib/transformers/index.ts` | `'../../notation'` (barrel) |
| `src/lib/modifiers/schema.ts` | `'../../notation/schema'` |
| `src/lib/modifiers/definitions/*.ts` (22 files) | `'../../../notation/definitions/<mod>'` |

Concrete rule: replace `from '@randsum/notation'` with the relative path from the importing file. For modifier definition files, import from the specific schema file rather than the barrel to minimize the graph.

### roller `src/validate.ts`

Currently re-exports `isDiceNotation`, `notation`, and `validateNotation` from `@randsum/notation`. After the move, the re-exports reference local paths:

```typescript
export { isDiceNotation, notation } from './notation/isDiceNotation'
export { validateNotation } from './notation/validateNotation'
```

The `export { ... } from` form is correct here — this file is a re-export barrel, not a consumer. The public API of `@randsum/roller/validate` is unchanged.

### roller `src/lib/modifiers/schema.ts`

The `NotationSchema` type import changes from `@randsum/notation` to:

```typescript
import type { NotationSchema } from '../../notation/schema'
```

`ModifierBehavior` and `ModifierDefinition` stay in this file unchanged.

### Modifier definition files

Each of the 22 files in `src/lib/modifiers/definitions/` imports its schema. The pattern changes from:

```typescript
import { capSchema } from '@randsum/notation'
```

to:

```typescript
import { capSchema } from '../../../notation/definitions/cap'
```

Import from the specific definition file, not from the notation barrel, to avoid pulling the entire notation module into each modifier's chunk.

### component-library

Two files to update:

```typescript
// packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx
// Before:
import { tokenize } from '@randsum/notation'
// After:
import { tokenize } from '@randsum/roller/tokenize'

// packages/component-library/__tests__/tokenize.test.ts
// Before:
import { tokenize, type Token } from '@randsum/notation'
// After:
import { tokenize, type Token } from '@randsum/roller/tokenize'
```

Also remove `@randsum/notation` from `packages/component-library/package.json` dependencies. Remove or update the `noExternal` entry in `packages/component-library/bunup.config.ts` (currently lists `'@randsum/notation'` at line 15).

### CLI (`apps/cli`)

Eight files to update. All switch from `@randsum/notation` to `@randsum/roller/tokenize`. Both `tokenize` and the `Token` / `TokenType` types are exported from that subpath.

```typescript
// apps/cli/src/tui/App.tsx
import { tokenize } from '@randsum/roller/tokenize'

// apps/cli/src/tui/helpers/tokenColors.ts
import type { Token } from '@randsum/roller/tokenize'

// apps/cli/src/tui/hooks/useCursorPosition.ts
import type { Token } from '@randsum/roller/tokenize'

// apps/cli/src/tui/components/NotationDescriptionRow.tsx
import type { Token } from '@randsum/roller/tokenize'

// apps/cli/src/tui/components/NotationHighlight.tsx
import type { Token } from '@randsum/roller/tokenize'

// apps/cli/__tests__/tui/tokenize.test.ts
import { tokenize } from '@randsum/roller/tokenize'

// apps/cli/__tests__/tui/useCursorPosition.test.ts
import type { Token } from '@randsum/roller/tokenize'
```

Also:
- Remove `@randsum/notation` from `apps/cli/package.json` dependencies.
- Update `apps/cli/bunup.config.ts` — remove `'@randsum/notation'` from the `noExternal` array (line 11); replace with `'@randsum/roller'` if it is not already present.

## Subpath Export Configuration

### roller `package.json` exports (after merge)

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    },
    "./roll": {
      "import": {
        "types": "./dist/roll/index.d.ts",
        "default": "./dist/roll/index.js"
      }
    },
    "./errors": {
      "import": {
        "types": "./dist/errors.d.ts",
        "default": "./dist/errors.js"
      }
    },
    "./validate": {
      "import": {
        "types": "./dist/validate.d.ts",
        "default": "./dist/validate.js"
      }
    },
    "./tokenize": {
      "import": {
        "types": "./dist/notation/tokenize.d.ts",
        "default": "./dist/notation/tokenize.js"
      }
    },
    "./comparison": {
      "import": {
        "types": "./dist/notation/comparison/index.d.ts",
        "default": "./dist/notation/comparison/index.js"
      }
    },
    "./package.json": "./package.json"
  }
}
```

The `./validateNotation` subpath from notation is not replicated — `validateNotation` is already accessible from `@randsum/roller` (main barrel) and `@randsum/roller/validate`.

### roller `bunup.config.ts` (after merge)

```typescript
import { defineConfig } from 'bunup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/roll/index.ts',
    'src/errors.ts',
    'src/validate.ts',
    'src/notation/tokenize.ts',
    'src/notation/comparison/index.ts'
  ],
  format: ['esm'],
  dts: true,
  exports: true,
  minify: true,
  sourcemap: 'external',
  target: 'node',
  clean: true
})
```

### roller `package.json` dependencies (after merge)

Remove `@randsum/notation` from `dependencies`. Roller becomes zero-dependency:

```json
{
  "dependencies": {}
}
```

## Modifier Unification Strategy

Each modifier currently has a split definition:

- **Schema** in `packages/notation/src/definitions/<mod>.ts` — regex pattern, parse, toNotation, toDescription, priority
- **Behavior** in `packages/roller/src/lib/modifiers/behaviors/<mod>.ts` — apply, validate, requiresRollFn, requiresParameters
- **Combined** in `packages/roller/src/lib/modifiers/definitions/<mod>.ts` — imports schema from notation, spreads both

After the move, the combined files change only their import path. The schemas move to `src/notation/definitions/` and are imported from there. The spread pattern is unchanged.

Example for `cap` after the move:

```typescript
// src/lib/modifiers/definitions/cap.ts
import type { ComparisonOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { capSchema } from '../../../notation/definitions/cap'
import { capBehavior } from '../behaviors/cap'

export const capModifier: ModifierDefinition<ComparisonOptions> = {
  ...capSchema,
  ...capBehavior
}
```

This pattern applies identically to all 22 modifier definition files. Only the import path for the schema changes.

## Bundle Size Strategy

### Main barrel

`src/index.ts` already re-exports everything from validate, errors, and types. Those re-exports now resolve locally instead of through the notation package. No change to the export surface.

### Subpath isolation

`@randsum/roller/tokenize` and `@randsum/roller/comparison` are isolated entry points with no dependency on the roll engine, random number generation, or modifier registry. Consumers who only need notation parsing (e.g., UI components, form validators) can import from these subpaths without the full engine in their bundle.

### size-limit adjustment

The `notation 8KB` entry disappears. Roller's limits increase to absorb notation's footprint. Starting targets (adjust after first build):

```json
"size-limit": [
  { "path": "dist/index.js", "limit": "20 KB" },
  { "path": "dist/index.d.ts", "limit": "10 KB" },
  { "path": "dist/notation/tokenize.js", "limit": "6 KB" },
  { "path": "dist/notation/comparison/index.js", "limit": "3 KB" }
]
```

## Build System Changes

### Remove notation from workspace

1. Delete `packages/notation/` after source is moved and tests pass.
2. The root workspace glob (`packages/*`) stops including notation automatically. No manual edit to `package.json` needed unless notation is listed explicitly.
3. `bun.lock` will update on the next `bun install` after deletion.

### Root `package.json` script changes

Any root-level `build` or `check` scripts that call `--filter '@randsum/notation'` explicitly must have that filter removed. Notation is now built as part of roller — no separate filter step is needed. Check the root `scripts` block for any such references.

### Build order

Notation no longer builds before roller. The build ordering constraint that caused "dist not built" errors in multi-agent worktrees is eliminated. All remaining packages build in parallel (subject to their own dependency graph — games still depend on roller).

## CI Workflow Changes

Two workflow files contain references to `@randsum/notation` that must be removed.

### `.github/workflows/ci.yml` (7 occurrences)

The CI file has a `notation` job with a path filter and four build steps. Remove the entire job and its downstream references:

1. Remove `notation` from the `changes` filter paths (lines ~33–46).
2. Remove the `notation` output from the `changes` job.
3. Delete the `notation:` job block entirely (~lines 65–88).
4. Remove `bun run --filter '@randsum/notation' build` from all jobs that include it as a setup step (lines ~109, 135, 165, 191) — notation no longer needs a separate build step since it is part of roller.
5. Remove `notation` from the `needs:` list of the final summary job (line ~245).

### `.github/workflows/publish.yml` (6 occurrences)

1. Remove the `bun run --filter '@randsum/notation' size` call from the pre-publish size check step (line ~35).
2. Remove `bun run --filter '@randsum/notation' check:exports` (line ~37).
3. Delete the `# ── @randsum/notation ──` publish block (lines ~62–83) — the entire step that compares npm version and publishes notation.

After these removals, the workflows reference only the packages that remain: roller, games, component-library, CLI, site.

## What Gets Deleted

| Path | Reason |
|---|---|
| `packages/notation/` | Entire package — source moved to roller |
| `packages/notation/CLAUDE.md` | Package is gone |

## Site Docs Follow-Up (Out of Scope for This PR)

`apps/site/` contains 12 files that reference `@randsum/notation` (API references, guides, package pages). These are documentation pages, not build-time consumers, so they do not block the merge. They should be updated in a follow-up PR after this merge lands. Track as a separate task: "Update site docs: replace @randsum/notation references with @randsum/roller".

## Breaking Changes Summary

| Consumer | What breaks | Migration |
|---|---|---|
| Any `@randsum/notation` direct import | Package deprecated | Switch to `@randsum/roller` |
| `import { tokenize } from '@randsum/notation'` | Package gone | `import { tokenize } from '@randsum/roller/tokenize'` |
| `import type { Token } from '@randsum/notation'` | Package gone | `import type { Token } from '@randsum/roller/tokenize'` |
| `import type { TokenType } from '@randsum/notation'` | Package gone | `import type { TokenType } from '@randsum/roller/tokenize'` |
| `import { ... } from '@randsum/notation/comparison'` | Subpath gone | `import { ... } from '@randsum/roller/comparison'` |
| `import { ... } from '@randsum/notation/validateNotation'` | Subpath gone | `import { validateNotation } from '@randsum/roller/validate'` |
| `import { ... } from '@randsum/notation/tokenize'` | Subpath gone | `import { ... } from '@randsum/roller/tokenize'` |
| `apps/cli` (8 files) | Direct notation dependency | See CLI section above |
| `packages/component-library` (2 source files + 1 test) | Direct notation dependency | See component-library section above |

The roller's public API surface is unchanged. All notation types and functions that roller already re-exported continue to be available from `@randsum/roller`.

## npm Deprecation

After the new roller version publishes:

```bash
npm deprecate @randsum/notation "Merged into @randsum/roller. Import from @randsum/roller or @randsum/roller/tokenize instead."
```

## Step-by-Step Checklist

1. Create `packages/roller/src/notation/` and copy all files from `packages/notation/src/`
2. Update internal imports within moved notation files (they are already self-contained with relative imports — verify none reference `@randsum/notation`)
3. Update all `import ... from '@randsum/notation'` in roller to relative paths (33 occurrences across 30 files — see Import Rewriting Rules)
4. Update `src/lib/modifiers/schema.ts` to import `NotationSchema` from `'../../notation/schema'`
5. Update each `src/lib/modifiers/definitions/*.ts` (22 files) to import its schema from `'../../../notation/definitions/<mod>'`
6. Add `src/notation/tokenize.ts` and `src/notation/comparison/index.ts` as entry points in `bunup.config.ts`
7. Add `./tokenize` and `./comparison` to roller's `package.json` exports
8. Remove `@randsum/notation` from roller's `package.json` dependencies
9. Update `packages/component-library`:
   - `RollerPlayground.tsx` and `__tests__/tokenize.test.ts` — change `from '@randsum/notation'` to `from '@randsum/roller/tokenize'`
   - Remove `@randsum/notation` from `packages/component-library/package.json` dependencies
   - Remove `'@randsum/notation'` from `packages/component-library/bunup.config.ts` `noExternal` array
10. Update `apps/cli` (8 files) — change all `from '@randsum/notation'` to `from '@randsum/roller/tokenize'`
    - Remove `@randsum/notation` from `apps/cli/package.json` dependencies
    - Remove `'@randsum/notation'` from `apps/cli/bunup.config.ts` `noExternal` array
11. Move `packages/notation/__tests__/` (24 files) to `packages/roller/__tests__/notation/`
    - Merge `validateNotation.test.ts` into the existing roller copy
    - Merge `dist.smoke.test.ts` into the existing roller copy
    - Update import paths in all moved test files (see Test Migration Plan)
    - Update `packages/roller/__tests__/lib/notation.roundtrip.test.ts` import
12. Update CI workflows:
    - `.github/workflows/ci.yml` — remove the `notation` job and all `--filter '@randsum/notation'` build steps
    - `.github/workflows/publish.yml` — remove notation size check, exports check, and publish block
13. Update roller `size-limit` entries in `package.json`
14. Check root `package.json` scripts for any `--filter '@randsum/notation'` references and remove
15. Run `bun install` to update lockfile after dependency changes
16. Run `bun run typecheck` — fix residual import errors
17. Run `bun run --filter @randsum/roller test` — all tests must pass
18. Run `bun run --filter @randsum/component-library test` — verify component-library still works
19. Run `bun run --filter @randsum/cli test` — verify CLI still works
20. Run `bun run build` — confirm all subpath dist files are generated
21. Run `bun run size` — confirm new limits pass
22. Delete `packages/notation/`
23. Run `bun install` again to remove notation from lockfile
24. Run full `bun run check:all`
25. Bump roller to a new major version (notation absorption is a breaking change for direct notation consumers)
26. Publish roller
27. Run `npm deprecate @randsum/notation "Merged into @randsum/roller. Import from @randsum/roller or @randsum/roller/tokenize instead."`
