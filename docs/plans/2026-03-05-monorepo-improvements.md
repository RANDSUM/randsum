# Monorepo Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply 17 targeted improvements across config, types, exports, and build tooling — making the monorepo leaner, stricter, and more ergonomic for downstream consumers — without any breaking changes to public APIs.

**Architecture:** Single branch, all changes in one PR on `jarvis/skill-roller`. Changes are ordered so config cleanup comes first (zero blast radius), then type improvements, then export surface changes, then build/CI gates. No new packages are introduced.

**Tech Stack:** Bun workspaces, TypeScript 5.9, bunup, ESLint + typescript-eslint, Prettier, Lefthook, size-limit, codecov

**Pre-checks (already done, skip):**
- #8 Shared validation utilities — `validateFinite`, `validateRange` etc. are already exported from roller and imported by game packages ✓
- #14 TypeScript project references — all game packages already have `references: [{ "path": "../roller" }]` ✓
- #20 JSDoc on `createMultiRollGameRoll` — comprehensive JSDoc already exists ✓

---

## Task 1: Document CLI intentional npm dependency (#2)

**Files:**
- Modify: `apps/cli/CLAUDE.md`

**Step 1: Add note to CLI CLAUDE.md**

Add a section explaining the dependency is intentional:

```markdown
## Dependency Note

`@randsum/roller` is intentionally listed as a versioned npm dependency (`^1.1.0`) rather than `workspace:~`.
This is because the CLI is built as a standalone binary that consumers install globally via npm/bun.
The workspace protocol resolves only at build time within the monorepo — the published artifact must
reference a real npm version. When upgrading roller, bump this version manually alongside the release.
```

**Step 2: Commit**

```bash
git add apps/cli/CLAUDE.md
git commit -m "docs(cli): document intentional npm ref for roller dependency"
```

---

## Task 2: Remove binaries from .prettierignore (#9)

**Files:**
- Modify: `.prettierignore`

**Step 1: Remove lines 49–60**

Delete the entire "Binary files" block:
```
# Binary files
*.png
*.jpg
*.jpeg
*.gif
*.ico
*.webp
*.svg
*.woff
*.woff2
*.ttf
*.eot
```

Prettier ignores binary files by default. These lines add no value.

**Step 2: Verify Prettier still runs cleanly**

```bash
bun run format:check
```
Expected: no errors

**Step 3: Commit**

```bash
git add .prettierignore
git commit -m "chore: remove redundant binary patterns from .prettierignore"
```

---

## Task 3: Remove `react-native` field from all package.json files (#11)

**Files:**
- Modify: `packages/blades/package.json`
- Modify: `packages/daggerheart/package.json`
- Modify: `packages/fifth/package.json`
- Modify: `packages/pbta/package.json`
- Modify: `packages/root-rpg/package.json`
- Modify: `packages/salvageunion/package.json`
- Modify: `packages/roller/package.json`

**Step 1: Remove the `react-native` field from each**

In each `package.json`, delete the line:
```json
"react-native": "./src/index.ts",
```

**Step 2: Verify builds still work**

```bash
bun run build
```
Expected: all packages build successfully

**Step 3: Commit**

```bash
git add packages/*/package.json
git commit -m "chore: remove unused react-native field from all package.json files"
```

---

## Task 4: Soften ESLint member accessibility rule (#6)

**Files:**
- Modify: `eslint.config.js:82-94`

**Step 1: Change `accessors` override from `'explicit'` to `'no-public'`**

Current:
```js
'@typescript-eslint/explicit-member-accessibility': [
  'error',
  {
    accessibility: 'explicit',
    overrides: {
      accessors: 'explicit',
      constructors: 'no-public',
      methods: 'explicit',
      properties: 'explicit',
      parameterProperties: 'explicit'
    }
  }
],
```

Change `accessors: 'explicit'` to `accessors: 'no-public'`:
```js
'@typescript-eslint/explicit-member-accessibility': [
  'error',
  {
    accessibility: 'explicit',
    overrides: {
      accessors: 'no-public',
      constructors: 'no-public',
      methods: 'explicit',
      properties: 'explicit',
      parameterProperties: 'explicit'
    }
  }
],
```

**Step 2: Run lint to surface any files that need updating**

```bash
bun run lint
```

Fix any violations (remove redundant `public` from accessors).

**Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore(eslint): soften explicit-member-accessibility for accessors"
```

---

## Task 5: Add `satisfies` to `ERROR_CODES` (#7)

**Files:**
- Modify: `packages/roller/src/errors.ts:5-14`

**Step 1: Add `satisfies` to ERROR_CODES**

Current:
```typescript
export const ERROR_CODES = {
  INVALID_NOTATION: 'INVALID_NOTATION',
  MODIFIER_ERROR: 'MODIFIER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ROLL_ERROR: 'ROLL_ERROR'
} as const
```

Change to:
```typescript
export const ERROR_CODES = {
  INVALID_NOTATION: 'INVALID_NOTATION',
  MODIFIER_ERROR: 'MODIFIER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ROLL_ERROR: 'ROLL_ERROR'
} as const satisfies Record<string, string>
```

**Step 2: Typecheck**

```bash
bun run --filter @randsum/roller typecheck
```
Expected: no errors

**Step 3: Commit**

```bash
git add packages/roller/src/errors.ts
git commit -m "chore(roller): add satisfies to ERROR_CODES for compile-time shape validation"
```

---

## Task 6: Fix test-utils internal import (#3)

**Files:**
- Modify: `packages/roller/test-utils/src/index.ts:2`

**Step 1: Change internal path to public API**

Current:
```typescript
export type { RandomFn } from '../../src/lib/random'
```

Change to:
```typescript
export type { RandomFn } from '../../src'
```

`RandomFn` is already exported from `packages/roller/src/index.ts` via `./internal/publicTypes`. Verify it's in the public export list (it is, line 41 of roller's index.ts).

**Step 2: Run tests to confirm nothing breaks**

```bash
bun run --filter @randsum/roller test
```
Expected: all tests pass, no shape changes to test values

**Step 3: Commit**

```bash
git add packages/roller/test-utils/src/index.ts
git commit -m "fix(roller): fix test-utils RandomFn re-export to use public API path"
```

---

## Task 7: Make `ErrorCode` extensible (#13)

**Files:**
- Modify: `packages/roller/src/errors.ts`

**Step 1: Widen `ErrorCode` to allow custom codes**

Current:
```typescript
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
```

Change to:
```typescript
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES] | (string & Record<never, never>)
```

The `string & Record<never, never>` trick widens the type to accept any string while keeping IDE autocomplete for the known codes. This is non-breaking — all existing usage still type-checks.

**Step 2: Typecheck**

```bash
bun run --filter @randsum/roller typecheck
```
Expected: no errors

**Step 3: Run tests**

```bash
bun run --filter @randsum/roller test
```
Expected: all pass, no value changes

**Step 4: Commit**

```bash
git add packages/roller/src/errors.ts
git commit -m "feat(roller): make ErrorCode extensible for game package custom error codes"
```

---

## Task 8: Export comparison utilities from roller public API (#18)

**Files:**
- Modify: `packages/roller/src/internal/api.ts`
- Modify: `packages/roller/src/index.ts`

**Step 1: Add comparison exports to api.ts**

In `packages/roller/src/internal/api.ts`, add after the existing exports:

```typescript
export {
  matchesComparison,
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation,
  hasConditions
} from '../lib/comparison'
export type { ExtendedComparisonOptions } from '../lib/comparison'
```

**Step 2: Re-export from index.ts**

In `packages/roller/src/index.ts`, add after the existing exports:

```typescript
export {
  matchesComparison,
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation,
  hasConditions
} from './internal/api'
export type { ExtendedComparisonOptions } from './internal/api'
```

**Step 3: Check unused exports**

```bash
bun run check:exports
```
Expected: no new issues

**Step 4: Typecheck**

```bash
bun run --filter @randsum/roller typecheck
```

**Step 5: Commit**

```bash
git add packages/roller/src/internal/api.ts packages/roller/src/index.ts
git commit -m "feat(roller): export comparison utilities from public API"
```

---

## Task 9: Add subpath exports to roller (#4)

**Files:**
- Modify: `packages/roller/package.json`

**Step 1: Add `./types` subpath export**

In `packages/roller/package.json`, add to the `exports` map:

```json
"exports": {
  ".": {
    "import": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "require": {
      "types": "./dist/index.d.cts",
      "default": "./dist/index.cjs"
    }
  },
  "./types": {
    "import": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "require": {
      "types": "./dist/index.d.cts",
      "default": "./dist/index.cjs"
    }
  },
  "./package.json": "./package.json"
}
```

Note: `./types` points to the same entry as `.` since all types are co-located with runtime. This gives consumers a semantic import path (`@randsum/roller/types`) that signals type-only usage intent.

**Step 2: Verify exports check passes**

```bash
bun run check:exports
```

**Step 3: Commit**

```bash
git add packages/roller/package.json
git commit -m "feat(roller): add ./types subpath export"
```

---

## Task 10: Re-export core types from game packages (#10)

**Files:**
- Modify: `packages/blades/src/index.ts`
- Modify: `packages/daggerheart/src/index.ts`
- Modify: `packages/fifth/src/index.ts`
- Modify: `packages/pbta/src/index.ts`
- Modify: `packages/root-rpg/src/index.ts`
- Modify: `packages/salvageunion/src/index.ts`

**Step 1: Add core type re-exports to each game package**

Each game package should re-export the types a consumer needs when using that package, so they don't need to separately import `@randsum/roller`.

For each `packages/<game>/src/index.ts`, add:

```typescript
export type { GameRollResult, RollRecord } from '@randsum/roller'
```

**Step 2: Typecheck all packages**

```bash
bun run typecheck
```
Expected: no errors

**Step 3: Check for unused export issues**

```bash
bun run check:exports
```

**Step 4: Commit**

```bash
git add packages/blades/src/index.ts packages/daggerheart/src/index.ts packages/fifth/src/index.ts packages/pbta/src/index.ts packages/root-rpg/src/index.ts packages/salvageunion/src/index.ts
git commit -m "feat: re-export GameRollResult and RollRecord from all game packages"
```

---

## Task 11: Add no-restricted-imports rule for internal paths (#16)

**Files:**
- Modify: `eslint.config.js`

**Step 1: Add rule to the main rules block**

In the `rules` object in `eslint.config.js`, add after the existing `no-restricted-syntax` rule:

```js
'no-restricted-imports': [
  'error',
  {
    patterns: [
      {
        group: ['*/src/lib/*', '*/src/internal/*', '*/src/roll/*'],
        message: 'Import from the package public API instead (e.g. @randsum/roller, not internal paths).'
      }
    ]
  }
],
```

**Step 2: Run lint to find any violations**

```bash
bun run lint
```

Fix any violations — these would be legitimate internal imports that need to be updated to use the public API.

**Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore(eslint): add no-restricted-imports rule to prevent internal path imports"
```

---

## Task 12: Add `.d.ts` size limits (#15)

**Files:**
- Modify: `package.json` (size-limit section, lines 34-63)

**Step 1: Add declaration file entries**

Add entries for `.d.ts` files after the existing JS entries:

```json
"size-limit": [
  { "path": "packages/roller/dist/index.js", "limit": "10 KB" },
  { "path": "packages/blades/dist/index.js", "limit": "7 KB" },
  { "path": "packages/fifth/dist/index.js", "limit": "7 KB" },
  { "path": "packages/daggerheart/dist/index.js", "limit": "7 KB" },
  { "path": "packages/root-rpg/dist/index.js", "limit": "7 KB" },
  { "path": "packages/salvageunion/dist/index.js", "limit": "170 KB" },
  { "path": "packages/pbta/dist/index.js", "limit": "7 KB" },
  { "path": "packages/roller/dist/index.d.ts", "limit": "15 KB" },
  { "path": "packages/blades/dist/index.d.ts", "limit": "5 KB" },
  { "path": "packages/fifth/dist/index.d.ts", "limit": "5 KB" },
  { "path": "packages/daggerheart/dist/index.d.ts", "limit": "5 KB" },
  { "path": "packages/root-rpg/dist/index.d.ts", "limit": "5 KB" },
  { "path": "packages/pbta/dist/index.d.ts", "limit": "5 KB" }
]
```

Note: salvageunion `.d.ts` excluded since its JS is 170 KB (data-heavy); limits should be set after running size to see actuals.

**Step 2: Build and run size check to calibrate limits**

```bash
bun run build && bun run size
```

Adjust limits to be 20% above actual sizes (headroom without being useless).

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add .d.ts size limits to size-limit config"
```

---

## Task 13: Add benchmarks to pre-push hook (#12)

**Files:**
- Modify: `lefthook.yml`

**Step 1: Add bench step to pre-push**

Current `pre-push`:
```yaml
pre-push:
  commands:
    test:
      run: bun test
    exports:
      run: bun run check:exports
    skill-verify:
      run: npx skills-ref validate skills/dice-rolling/SKILL.md
```

Add bench command:
```yaml
pre-push:
  commands:
    test:
      run: bun test
    exports:
      run: bun run check:exports
    skill-verify:
      run: npx skills-ref validate skills/dice-rolling/SKILL.md
    bench:
      run: bun run bench
```

**Step 2: Verify the bench command runs**

```bash
bun run bench
```
Expected: benchmark output, no errors

**Step 3: Commit**

```bash
git add lefthook.yml
git commit -m "chore(ci): add benchmark run to pre-push hook"
```

---

## Task 14: Inject CLI version from package.json (#17)

**Files:**
- Modify: `apps/cli/src/index.ts:4`
- Modify: `apps/cli/tsconfig.json` (verify `resolveJsonModule: true` is inherited)

**Step 1: Replace hardcoded version with import**

Current:
```typescript
const VERSION = '0.1.0'
```

Change to:
```typescript
import { version as VERSION } from '../package.json'
```

The root `tsconfig.json` has `"resolveJsonModule": true` which is inherited. Bun also supports JSON imports natively.

**Step 2: Verify CLI typecheck**

```bash
bun run --filter @randsum/cli typecheck
```
Expected: no errors

**Step 3: Test version output**

```bash
bun run dev -- --version
```
Expected: prints the version from `apps/cli/package.json`

**Step 4: Commit**

```bash
git add apps/cli/src/index.ts
git commit -m "fix(cli): inject version from package.json instead of hardcoding"
```

---

## Task 15: Raise codecov coverage targets (#19)

**Files:**
- Modify: `codecov.yml`

**Step 1: Update thresholds**

Current:
```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
    patch:
      default:
        target: 70%
        threshold: 5%
```

Change to:
```yaml
coverage:
  status:
    project:
      default:
        target: 85%
        threshold: 2%
    patch:
      default:
        target: 75%
        threshold: 5%
```

**Step 2: Commit**

```bash
git add codecov.yml
git commit -m "chore(ci): raise codecov coverage targets to 85%/75%"
```

---

## Task 16: Add app dependencies to bun catalog (#5)

**Files:**
- Modify: `package.json` (catalog section, line 28-33)
- Modify: `apps/cli/package.json`

**Step 1: Add react to catalog**

In root `package.json`, expand the `catalog`:
```json
"catalog": {
  "fast-check": "4.5.3",
  "@types/bun": "1.3.10",
  "mitata": "1.0.34",
  "typescript": "5.9.3",
  "react": "^18.3.1",
  "@types/react": "^18.3.18"
}
```

**Step 2: Update CLI to use catalog references**

In `apps/cli/package.json`:
```json
"dependencies": {
  "@randsum/roller": "^1.1.0",
  "ink": "^5.2.0",
  "ink-text-input": "^6.0.0",
  "react": "catalog:"
},
"devDependencies": {
  "@types/react": "catalog:"
}
```

**Step 3: Install to verify lockfile updates**

```bash
bun install
```
Expected: lockfile updates, no errors

**Step 4: Commit**

```bash
git add package.json apps/cli/package.json bun.lock
git commit -m "chore: add react to bun catalog, use catalog: in CLI package"
```

---

## Task 17: Add root tsconfig references (#14 — partial remaining work)

**Files:**
- Modify: `tsconfig.json`

**Step 1: Add references to root tsconfig**

Add `references` array to `tsconfig.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    ...existing...
  },
  "references": [
    { "path": "packages/roller" },
    { "path": "packages/blades" },
    { "path": "packages/daggerheart" },
    { "path": "packages/fifth" },
    { "path": "packages/pbta" },
    { "path": "packages/root-rpg" },
    { "path": "packages/salvageunion" }
  ]
}
```

**Step 2: Verify typecheck still works**

```bash
bun run typecheck
```
Expected: no errors

**Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore(ts): add project references to root tsconfig for incremental compilation"
```

---

## Task 18: Version sync across packages (#1)

**Files:**
- Modify: `apps/cli/package.json`

**Step 1: Align CLI version**

The game packages and roller are at `1.1.0`. The CLI is at `0.2.2` — this is actually appropriate for an app rather than a library, so we should just ensure it's clearly intentional. Bump CLI to `1.0.0` to signal it's stable:

In `apps/cli/package.json`:
```json
"version": "1.0.0"
```

The site is a private app; its version doesn't matter for consumers.

**Step 2: Commit**

```bash
git add apps/cli/package.json
git commit -m "chore(cli): bump version to 1.0.0"
```

---

## Final: Run full CI pipeline

**Step 1: Run all checks**

```bash
bun run check:all
```
Expected: all lint, format, typecheck, test, build, size, and site checks pass

**Step 2: Verify no test values changed**

```bash
bun test --recursive 2>&1 | grep -E "fail|error" | grep -v "# fail 0"
```
Expected: no failures

**Step 3: Push**

```bash
git push
```

---

## Notes

- **Do not modify test assertions** — only update imports/shapes if the new API forces it, never change expected values
- **#8 already done**: validation utilities (`validateFinite`, `validateRange`, etc.) are already exported from roller and imported by game packages
- **#14 mostly done**: game packages already have `references: [{ "path": "../roller" }]`; Task 17 adds the root-level references
- **#20 already done**: `createMultiRollGameRoll` already has comprehensive JSDoc
