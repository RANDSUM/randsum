# Game Packages Subfolder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all game packages into `packages/gamePackages/` and wire up the monorepo so everything continues to work.

**Architecture:** Create `packages/gamePackages/` as a new workspace glob, move 6 game packages there, then update all relative paths (tsconfig extends, references, script flags) and root config references (workspace glob, size-limit paths, tsconfig references, create-game-package script).

**Tech Stack:** Bun workspaces, TypeScript project references, bunup, size-limit

---

## Game packages to move

- `packages/blades`
- `packages/daggerheart`
- `packages/fifth`
- `packages/pbta`
- `packages/root-rpg`
- `packages/salvageunion`

Staying in `packages/`: `roller`, `component-library`

---

### Task 1: Create the destination directory and move packages

**Files:**
- Create: `packages/gamePackages/` (directory)

**Step 1: Create destination directory**

```bash
mkdir -p packages/gamePackages
```

**Step 2: Move each game package**

```bash
mv packages/blades packages/gamePackages/blades
mv packages/daggerheart packages/gamePackages/daggerheart
mv packages/fifth packages/gamePackages/fifth
mv packages/pbta packages/gamePackages/pbta
mv packages/root-rpg packages/gamePackages/root-rpg
mv packages/salvageunion packages/gamePackages/salvageunion
```

**Step 3: Verify**

```bash
ls packages/gamePackages/
```

Expected: `blades  daggerheart  fifth  pbta  root-rpg  salvageunion`

---

### Task 2: Update each game package's `tsconfig.json`

All 6 game packages have:
- `"extends": "../../tsconfig.packages.json"` → must become `"../../../tsconfig.packages.json"`
- `"references": [{ "path": "../roller" }]` → must become `"../../roller"`

Do this for each package. Example for blades:

**File:** `packages/gamePackages/blades/tsconfig.json`

```json
{
  "extends": "../../../tsconfig.packages.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "references": [{ "path": "../../roller" }]
}
```

Repeat the same depth change (`../../` → `../../../` for `extends`, `../roller` → `../../roller` for references) for:
- `packages/gamePackages/daggerheart/tsconfig.json`
- `packages/gamePackages/fifth/tsconfig.json`
- `packages/gamePackages/pbta/tsconfig.json`
- `packages/gamePackages/root-rpg/tsconfig.json`
- `packages/gamePackages/salvageunion/tsconfig.json`

> Note: salvageunion may have a different tsconfig — read it before editing.

---

### Task 3: Update each game package's `package.json` scripts

All 6 game packages have scripts with `../../` references to root config files:
- `eslint . -c ../../eslint.config.js` → `eslint . -c ../../../eslint.config.js`
- `--ignore-path ../../.prettierignore` → `--ignore-path ../../../.prettierignore`
- `--config ../../.prettierrc` → `--config ../../../.prettierrc`

For each of the 6 game packages, update the `scripts` block in `package.json`. Read the file first, then apply the depth change from `../../` to `../../../` in the `lint`, `format`, and `format:check` script values.

Also update the `repository.directory` field from `packages/<name>` → `packages/gamePackages/<name>` (cosmetic but accurate).

---

### Task 4: Update root `package.json`

**File:** `package.json`

**Step 1: Add `packages/gamePackages/*` to workspaces**

Change:
```json
"workspaces": [
  "packages/*",
  "apps/cli",
  "apps/discord-bot",
  "apps/site"
]
```

To:
```json
"workspaces": [
  "packages/*",
  "packages/gamePackages/*",
  "apps/cli",
  "apps/discord-bot",
  "apps/site"
]
```

**Step 2: Update `size-limit` paths**

Change each game package path from `packages/<name>/dist/...` to `packages/gamePackages/<name>/dist/...`:

```json
"size-limit": [
  { "path": "packages/roller/dist/index.js", "limit": "10 KB" },
  { "path": "packages/gamePackages/blades/dist/index.js", "limit": "8 KB" },
  { "path": "packages/gamePackages/fifth/dist/index.js", "limit": "8 KB" },
  { "path": "packages/gamePackages/daggerheart/dist/index.js", "limit": "8 KB" },
  { "path": "packages/gamePackages/root-rpg/dist/index.js", "limit": "8 KB" },
  { "path": "packages/gamePackages/salvageunion/dist/index.js", "limit": "240 KB" },
  { "path": "packages/gamePackages/pbta/dist/index.js", "limit": "8 KB" },
  { "path": "packages/roller/dist/index.d.ts", "limit": "1 KB" },
  { "path": "packages/gamePackages/blades/dist/index.d.ts", "limit": "6 KB" },
  { "path": "packages/gamePackages/fifth/dist/index.d.ts", "limit": "6 KB" },
  { "path": "packages/gamePackages/daggerheart/dist/index.d.ts", "limit": "6 KB" },
  { "path": "packages/gamePackages/root-rpg/dist/index.d.ts", "limit": "6 KB" },
  { "path": "packages/gamePackages/pbta/dist/index.d.ts", "limit": "6 KB" }
]
```

---

### Task 5: Update root `tsconfig.json` references

**File:** `tsconfig.json`

Change game package references from `packages/<name>` to `packages/gamePackages/<name>`:

```json
"references": [
  { "path": "packages/roller" },
  { "path": "packages/gamePackages/blades" },
  { "path": "packages/gamePackages/daggerheart" },
  { "path": "packages/gamePackages/fifth" },
  { "path": "packages/gamePackages/pbta" },
  { "path": "packages/gamePackages/root-rpg" },
  { "path": "packages/gamePackages/salvageunion" },
  { "path": "packages/component-library" }
]
```

---

### Task 6: Update `scripts/create-game-package.ts`

**File:** `scripts/create-game-package.ts`

Change line:
```typescript
const packageDir = join(process.cwd(), 'packages', packageName)
```

To:
```typescript
const packageDir = join(process.cwd(), 'packages', 'gamePackages', packageName)
```

Also update the `repository.directory` template in the generated `packageJson`:
```typescript
directory: `packages/gamePackages/${packageName}`
```

And update the `tsconfig` template `extends` path:
```typescript
const tsconfig = {
  extends: '../../../tsconfig.packages.json',
  ...
}
```

And update the generated scripts paths (lint, format, format:check) to use `../../../` instead of `../../`.

---

### Task 7: Reinstall and verify

**Step 1: Reinstall to sync workspace symlinks**

```bash
bun install
```

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors

**Step 3: Run tests**

```bash
bun test
```

Expected: all tests pass

**Step 4: Run build**

```bash
bun run build
```

Expected: all packages build successfully

**Step 5: Run size check**

```bash
bun run size
```

Expected: no size limit violations

---

### Task 8: Update CLAUDE.md

**File:** `CLAUDE.md`

Update the Architecture section to reflect the new directory layout. The game packages line should now read:

```
**Game packages** live in `packages/gamePackages/` — each wraps roller with game-specific interpretation:
`blades`, `daggerheart`, `fifth`, `root-rpg`, `salvageunion`, `pbta`
```

Also update the `create:game` command note to mention it targets `packages/gamePackages/`.

---

### Task 9: Commit

```bash
git add -A
git commit -m "refactor: move game packages into packages/gamePackages/ subfolder"
```
