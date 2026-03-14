# Per-Package CI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic CI workflow with per-package CI streams, each gated by path filters, with a unified `check` script per package and publish gated on relevant package CIs.

**Architecture:** Each publishable package gets its own GitHub Actions workflow triggered by path changes to itself and its upstream dependencies. Each package gets a `check` script that runs the full validation pipeline locally. The publish workflow requires all package CIs to pass. Size-limit configs move from root into each package. `check:exports` runs per-package.

**Tech Stack:** GitHub Actions, bun workspaces, size-limit, ts-unused-exports, lefthook

---

## File Map

**Create:**
- `.github/workflows/ci-notation.yml`
- `.github/workflows/ci-roller.yml`
- `.github/workflows/ci-games.yml`
- `.github/workflows/ci-component-library.yml`
- `.github/workflows/ci-cli.yml`
- `.github/workflows/ci-site.yml`
- `.github/workflows/ci-skill.yml`

**Modify:**
- `packages/notation/package.json` — add `check`, `size`, `check:exports` scripts + `size-limit` config
- `packages/roller/package.json` — same
- `packages/games/package.json` — same (no `size` — has multiple dist files, handled differently)
- `packages/component-library/package.json` — same
- `packages/internal/display-utils/package.json` — add `check` script (local dev only, no CI workflow)
- `apps/cli/package.json` — add `check`, `check:exports` scripts (no size limit for CLI)
- `apps/site/package.json` — add `check`, `check:exports` scripts
- `apps/discord-bot/package.json` — add `check` script (private, no CI workflow)
- `package.json` (root) — remove `size-limit` array, update `check:all`, add root `check` script
- `.github/workflows/publish.yml` — gate on per-package CI workflows
- `.github/workflows/main.yml` — delete (replaced by per-package workflows)
- `lefthook.yml` — update pre-push to use `check` scripts

**Delete:**
- `.github/workflows/main.yml` (replaced by per-package CIs)

---

## Chunk 1: Add `check` scripts and distribute size-limit to packages

### Task 1: Add size-limit config and scripts to notation

**Files:**
- Modify: `packages/notation/package.json`

- [ ] **Step 1: Add size-limit config and scripts to package.json**

Add to `packages/notation/package.json`:
```json
"size-limit": [
  { "path": "dist/index.js", "limit": "13 KB" },
  { "path": "dist/index.d.ts", "limit": "4 KB" }
],
"scripts": {
  ...existing scripts...,
  "size": "size-limit",
  "check:exports": "ts-unused-exports ../../tsconfig.json --ignoreFiles='__tests__|test-utils|[\\\\/]dist[\\\\/]' --maxIssues=50",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run size && bun run check:exports"
}
```

- [ ] **Step 2: Verify locally**

Run: `cd packages/notation && bun run check`
Expected: All steps pass

- [ ] **Step 3: Commit**

```bash
git add packages/notation/package.json
git commit -m "feat(notation): add check script with size-limit and exports checking"
```

### Task 2: Add size-limit config and scripts to roller

**Files:**
- Modify: `packages/roller/package.json`

- [ ] **Step 1: Add size-limit config and scripts to package.json**

Add to `packages/roller/package.json`:
```json
"size-limit": [
  { "path": "dist/index.js", "limit": "10 KB" },
  { "path": "dist/index.d.ts", "limit": "5 KB" }
],
"scripts": {
  ...existing scripts...,
  "size": "size-limit",
  "check:exports": "ts-unused-exports ../../tsconfig.json --ignoreFiles='__tests__|test-utils|[\\\\/]dist[\\\\/]' --maxIssues=50",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run size && bun run check:exports"
}
```

- [ ] **Step 2: Verify locally**

Run: `cd packages/roller && bun run check`
Expected: All steps pass

- [ ] **Step 3: Commit**

```bash
git add packages/roller/package.json
git commit -m "feat(roller): add check script with size-limit and exports checking"
```

### Task 3: Add size-limit config and scripts to games

**Files:**
- Modify: `packages/games/package.json`

- [ ] **Step 1: Add size-limit config and scripts to package.json**

Games has multiple dist files with different limits. Add:
```json
"size-limit": [
  { "path": "dist/blades.generated.js", "limit": "8 KB" },
  { "path": "dist/fifth.generated.js", "limit": "8 KB" },
  { "path": "dist/daggerheart.generated.js", "limit": "8.1 KB" },
  { "path": "dist/pbta.generated.js", "limit": "8.2 KB" },
  { "path": "dist/root-rpg.generated.js", "limit": "8 KB" },
  { "path": "dist/salvageunion.generated.js", "limit": "100 KB" }
],
"scripts": {
  ...existing scripts...,
  "size": "size-limit",
  "check:exports": "ts-unused-exports ../../tsconfig.json --ignoreFiles='__tests__|test-utils|[\\\\/]dist[\\\\/]' --maxIssues=50",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run size && bun run check:exports"
}
```

- [ ] **Step 2: Verify locally**

Run: `cd packages/games && bun run check`
Expected: All steps pass

- [ ] **Step 3: Commit**

```bash
git add packages/games/package.json
git commit -m "feat(games): add check script with size-limit and exports checking"
```

### Task 4: Add size-limit config and scripts to component-library

**Files:**
- Modify: `packages/component-library/package.json`

- [ ] **Step 1: Add size-limit config and scripts to package.json**

```json
"size-limit": [
  { "path": "dist/index.js", "limit": "50 KB" }
],
"scripts": {
  ...existing scripts...,
  "size": "size-limit",
  "check:exports": "ts-unused-exports ../../tsconfig.json --ignoreFiles='__tests__|test-utils|[\\\\/]dist[\\\\/]' --maxIssues=50",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run size && bun run check:exports"
}
```

- [ ] **Step 2: Verify locally**

Run: `cd packages/component-library && bun run check`
Expected: All steps pass

- [ ] **Step 3: Commit**

```bash
git add packages/component-library/package.json
git commit -m "feat(component-library): add check script with size-limit and exports checking"
```

### Task 5: Add check scripts to cli, site, display-utils, discord-bot

**Files:**
- Modify: `apps/cli/package.json`
- Modify: `apps/site/package.json`
- Modify: `packages/internal/display-utils/package.json`
- Modify: `apps/discord-bot/package.json`

- [ ] **Step 1: Add scripts to cli**

CLI is published but has no bundle size limit. Add:
```json
"scripts": {
  ...existing scripts...,
  "check:exports": "ts-unused-exports ../../tsconfig.json --ignoreFiles='__tests__|test-utils|[\\\\/]dist[\\\\/]' --maxIssues=50",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run check:exports"
}
```

- [ ] **Step 2: Add scripts to site**

Site uses astro check for typecheck and astro build for build. No size limit. Add:
```json
"scripts": {
  ...existing scripts...,
  "check:exports": "ts-unused-exports ../../tsconfig.json --ignoreFiles='__tests__|test-utils|[\\\\/]dist[\\\\/]' --maxIssues=50",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run check:exports"
}
```

Note: site's `typecheck` is already `astro check` and `build` is already `astro build`.

- [ ] **Step 3: Add check script to display-utils (local dev only)**

```json
"scripts": {
  ...existing scripts...,
  "size": "size-limit",
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test && bun run size"
}
```

Add size-limit config:
```json
"size-limit": [
  { "path": "dist/index.js", "limit": "20 KB" },
  { "path": "dist/index.d.ts", "limit": "2 KB" }
]
```

- [ ] **Step 4: Add check script to discord-bot (local dev only)**

```json
"scripts": {
  ...existing scripts...,
  "check": "bun run typecheck && bun run format:check && bun run lint && bun run build && bun run test"
}
```

- [ ] **Step 5: Verify each locally**

Run each:
```bash
cd apps/cli && bun run check
cd apps/site && bun run check
cd packages/internal/display-utils && bun run check
cd apps/discord-bot && bun run check
```
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add apps/cli/package.json apps/site/package.json packages/internal/display-utils/package.json apps/discord-bot/package.json
git commit -m "feat: add check scripts to cli, site, display-utils, discord-bot"
```

### Task 6: Clean up root package.json

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Remove size-limit array from root**

Delete the entire `"size-limit": [...]` array from the root package.json.

- [ ] **Step 2: Update root scripts**

Replace:
```json
"size": "size-limit",
"size:check": "size-limit --json",
"check:exports": "ts-unused-exports tsconfig.json ...",
"check:all": "bun run lint && bun run format:check && bun run typecheck && bun test && bun run build && bun run size && bun run check:exports && bun run site:build"
```

With:
```json
"check": "bun run --filter '*' check",
"check:all": "bun run check"
```

Keep `build`, `test`, `lint`, `format`, `format:check`, `typecheck` scripts as-is (still useful for targeted runs).

- [ ] **Step 3: Verify root check works**

Run: `bun run check`
Expected: All packages run their check scripts

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: move size-limit configs to packages, add root check script"
```

---

## Chunk 2: Create per-package CI workflows

### Task 7: Create ci-notation.yml

**Files:**
- Create: `.github/workflows/ci-notation.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI - Notation
on:
  push:
    paths:
      - 'packages/notation/**'
      - '.github/workflows/ci-notation.yml'
  pull_request:
    paths:
      - 'packages/notation/**'
      - '.github/workflows/ci-notation.yml'

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: notation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Read Bun version
        id: bun-version
        run: echo "version=$(cat .bun-version)" >> $GITHUB_OUTPUT
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ steps.bun-version.outputs.version }}
      - uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}
          restore-keys: ${{ runner.os }}-bun-
      - run: bun install --frozen-lockfile
      - run: bun run --filter '@randsum/notation' check
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci-notation.yml
git commit -m "ci: add per-package CI workflow for notation"
```

### Task 8: Create ci-roller.yml

**Files:**
- Create: `.github/workflows/ci-roller.yml`

- [ ] **Step 1: Write the workflow**

Same structure as notation but with paths:
```yaml
paths:
  - 'packages/notation/**'
  - 'packages/roller/**'
  - '.github/workflows/ci-roller.yml'
```

Job runs: `bun run --filter '@randsum/roller' check`

Needs notation built first:
```yaml
- run: bun run --filter '@randsum/notation' build
- run: bun run --filter '@randsum/roller' check
```

- [ ] **Step 2: Commit**

### Task 9: Create ci-games.yml

**Files:**
- Create: `.github/workflows/ci-games.yml`

- [ ] **Step 1: Write the workflow**

Paths:
```yaml
paths:
  - 'packages/notation/**'
  - 'packages/roller/**'
  - 'packages/games/**'
  - '.github/workflows/ci-games.yml'
```

Job steps:
```yaml
- run: bun run --filter '@randsum/notation' build
- run: bun run --filter '@randsum/roller' build
- run: bun run --filter '@randsum/games' check
- name: gen:check (blades)
  run: cd packages/games && bun run codegen.ts --check --only blades
- name: gen:check (daggerheart)
  run: cd packages/games && bun run codegen.ts --check --only daggerheart
- name: gen:check (fifth)
  run: cd packages/games && bun run codegen.ts --check --only fifth
- name: gen:check (pbta)
  run: cd packages/games && bun run codegen.ts --check --only pbta
- name: gen:check (root-rpg)
  run: cd packages/games && bun run codegen.ts --check --only root-rpg
- name: gen:check (salvageunion)
  continue-on-error: true
  run: cd packages/games && bun run codegen.ts --check --only salvageunion
```

Note: The `--only` flag needs to be added to `codegen.ts`. If that's too much scope, run `gen:check` as a single step with `continue-on-error: true` for now.

**Simplified alternative (recommended):** Run `gen:check` as one step with `continue-on-error: true` since salvageunion is the only one that needs network:
```yaml
- name: gen:check
  continue-on-error: true
  run: bun run --filter '@randsum/games' gen:check
```

- [ ] **Step 2: Commit**

### Task 10: Create ci-component-library.yml

**Files:**
- Create: `.github/workflows/ci-component-library.yml`

- [ ] **Step 1: Write the workflow**

Paths:
```yaml
paths:
  - 'packages/notation/**'
  - 'packages/roller/**'
  - 'packages/internal/display-utils/**'
  - 'packages/component-library/**'
  - '.github/workflows/ci-component-library.yml'
```

Job steps:
```yaml
- run: bun run --filter '@randsum/notation' build
- run: bun run --filter '@randsum/roller' build
- run: bun run --filter '@randsum/display-utils' build
- run: bun run --filter '@randsum/component-library' check
```

- [ ] **Step 2: Commit**

### Task 11: Create ci-cli.yml

**Files:**
- Create: `.github/workflows/ci-cli.yml`

- [ ] **Step 1: Write the workflow**

Paths:
```yaml
paths:
  - 'packages/notation/**'
  - 'packages/roller/**'
  - 'packages/internal/display-utils/**'
  - 'apps/cli/**'
  - '.github/workflows/ci-cli.yml'
```

Job steps:
```yaml
- run: bun run --filter '@randsum/notation' build
- run: bun run --filter '@randsum/roller' build
- run: bun run --filter '@randsum/display-utils' build
- run: bun run --filter '@randsum/cli' check
```

- [ ] **Step 2: Commit**

### Task 12: Create ci-site.yml

**Files:**
- Create: `.github/workflows/ci-site.yml`

- [ ] **Step 1: Write the workflow**

Site depends on everything, so broad path filter:
```yaml
paths:
  - 'packages/**'
  - 'apps/site/**'
  - '.github/workflows/ci-site.yml'
```

Needs Node 22 for Astro:
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
  - uses: oven-sh/setup-bun@v2
    ...
  - run: bun install --frozen-lockfile
  - run: bun run build
  - run: bun run --filter '@randsum/site' check
```

Note: `bun run build` builds all packages first (site depends on component-library which depends on roller etc). Then site check runs `astro check` + `astro build` + lint + format + test + check:exports.

- [ ] **Step 2: Commit**

### Task 13: Create ci-skill.yml

**Files:**
- Create: `.github/workflows/ci-skill.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI - Skill
on:
  push:
    paths:
      - 'skills/**'
      - '.github/workflows/ci-skill.yml'
  pull_request:
    paths:
      - 'skills/**'
      - '.github/workflows/ci-skill.yml'

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: skill-verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Read Bun version
        id: bun-version
        run: echo "version=$(cat .bun-version)" >> $GITHUB_OUTPUT
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ steps.bun-version.outputs.version }}
      - run: npx skills-ref validate skills/dice-rolling/SKILL.md
```

- [ ] **Step 2: Commit**

---

## Chunk 3: Update publish workflow and clean up

### Task 14: Update publish.yml to gate on package CIs

**Files:**
- Modify: `.github/workflows/publish.yml`

- [ ] **Step 1: Restructure publish workflow**

The publish workflow should:
1. Trigger via `workflow_dispatch`
2. First job: run all package checks (not relying on separate workflow runs)
3. Second job: publish (depends on check job)

```yaml
name: Publish
on:
  workflow_dispatch: {}

permissions:
  contents: write
  id-token: write

jobs:
  check-all:
    name: Pre-publish checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Read Bun version
        id: bun-version
        run: echo "version=$(cat .bun-version)" >> $GITHUB_OUTPUT
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ steps.bun-version.outputs.version }}
      - uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}
          restore-keys: ${{ runner.os }}-bun-
      - run: bun install --frozen-lockfile
      - run: bun run build
      - run: bun run check
      - run: bun audit --audit-level high

  publish:
    name: Publish to npm
    needs: check-all
    runs-on: ubuntu-latest
    steps:
      ... existing publish steps ...
```

- [ ] **Step 2: Commit**

### Task 15: Delete main.yml

**Files:**
- Delete: `.github/workflows/main.yml`

- [ ] **Step 1: Delete the monolithic CI workflow**

```bash
git rm .github/workflows/main.yml
```

- [ ] **Step 2: Commit**

```bash
git commit -m "ci: remove monolithic CI workflow (replaced by per-package CIs)"
```

### Task 16: Update lefthook.yml

**Files:**
- Modify: `lefthook.yml`

- [ ] **Step 1: Update pre-push to use check scripts**

```yaml
pre-push:
  commands:
    build:
      run: bun run build
      priority: 1
    check:
      run: bun run check
      priority: 2
    audit:
      run: bun audit --level=high
```

This replaces the individual test/exports/build/skill-verify/gen-check commands with the unified `check` that each package defines. Build runs first (priority 1) so packages have dist files, then check runs (priority 2) which includes exports checking.

Note: `gen:check` is included via the games package's check or can remain as a separate pre-push step if desired.

- [ ] **Step 2: Commit**

```bash
git add lefthook.yml
git commit -m "chore: simplify pre-push hooks to use package check scripts"
```

---

## Dependency Graph for Workflows

```
ci-notation.yml     ← packages/notation/**
ci-roller.yml       ← packages/notation/**, packages/roller/**
ci-games.yml        ← packages/notation/**, packages/roller/**, packages/games/**
ci-component-library.yml ← packages/notation/**, packages/roller/**, packages/internal/display-utils/**, packages/component-library/**
ci-cli.yml          ← packages/notation/**, packages/roller/**, packages/internal/display-utils/**, apps/cli/**
ci-site.yml         ← packages/**, apps/site/**
ci-skill.yml        ← skills/**
publish.yml         ← workflow_dispatch → runs ALL checks → publishes
```
