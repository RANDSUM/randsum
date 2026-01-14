---
name: CI Coverage Size-Limit
overview: Add size-limit bundle checks and Codecov coverage integration to the existing CI pipeline, including coverage badges in package READMEs and coverage thresholds to prevent regressions.
todos:
  - id: install-deps
    content: Install size-limit dependencies and add scripts to root package.json
    status: completed
  - id: size-limit-config
    content: Create .size-limit.json with limits for each publishable package
    status: completed
  - id: codecov-config
    content: Create codecov.yml with coverage thresholds (80% project, 70% patch)
    status: completed
  - id: update-ci
    content: Update .github/workflows/main.yml with coverage generation, Codecov upload, and size-limit check
    status: completed
  - id: update-readmes
    content: Add Codecov coverage badge to 7 package READMEs (roller, blades, fifth, daggerheart, root-rpg, salvageunion, mcp)
    status: completed
---

# CI/CD Enhancement: Coverage + Size-Limit

## Current State

Your repo already has solid CI/CD:

- [main.yml](.github/workflows/main.yml) - CI on push (ubuntu + macOS)
- [publish.yml](.github/workflows/publish.yml) - NPM publish after CI passes
- [auto-merge.yml](.github/workflows/auto-merge.yml) - Auto-merge Dependabot PRs
- [dependabot.yml](.github/dependabot.yml) - Weekly dependency updates

## Changes Required

### 1. Add Size-Limit for Bundle Size Checks

Install size-limit and configure for publishable packages:

**Root package.json additions:**

```json
{
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.x"
  },
  "scripts": {
    "size": "size-limit",
    "size:check": "size-limit --json"
  }
}
```

**Create `.size-limit.json`** at repo root:

```json
[
  { "path": "packages/roller/dist/index.js", "limit": "15 KB" },
  { "path": "packages/blades/dist/index.js", "limit": "2 KB" },
  { "path": "packages/fifth/dist/index.js", "limit": "3 KB" },
  { "path": "packages/daggerheart/dist/index.js", "limit": "3 KB" },
  { "path": "packages/root-rpg/dist/index.js", "limit": "2 KB" },
  { "path": "packages/salvageunion/dist/index.js", "limit": "2 KB" },
  { "path": "packages/mcp/dist/index.js", "limit": "10 KB" }
]
```

### 2. Add Codecov Integration

**Update [main.yml](.github/workflows/main.yml):**

Add coverage generation and upload step (only on ubuntu to avoid duplicate uploads):

```yaml
- name: Run tests with coverage
  if: matrix.os == 'ubuntu-latest'
  run: bun test --coverage --coverage-reporter=lcov --coverage-dir=./coverage

- name: Upload coverage to Codecov
  if: matrix.os == 'ubuntu-latest'
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/lcov.info
    fail_ci_if_error: false

- name: Run tests (no coverage)
  if: matrix.os != 'ubuntu-latest'
  run: bun test
```

**Create `codecov.yml`** at repo root for coverage thresholds:

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

comment:
  layout: "reach,diff,flags,files"
  behavior: default
  require_changes: true
```

### 3. Add Size-Limit Check to CI

**Update [main.yml](.github/workflows/main.yml):**

Add after build step (only on ubuntu):

```yaml
- name: Check bundle sizes
  if: matrix.os == 'ubuntu-latest'
  run: bun run size
```

### 4. Update Root package.json Scripts

```json
{
  "scripts": {
    "test:coverage": "bun test --coverage --coverage-reporter=lcov --coverage-dir=./coverage",
    "size": "size-limit",
    "check:all": "bun run lint && bun run format:check && bun run typecheck && bun run test && bun run build && bun run size && bun run site:build"
  }
}
```

### 5. Add Coverage Badge to READMEs

Add to each publishable package README (roller, blades, fifth, daggerheart, root-rpg, salvageunion, mcp):

```markdown
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)
```

For [packages/roller/README.md](packages/roller/README.md), add after line 9:

```markdown
[![codecov](https://codecov.io/gh/RANDSUM/randsum/branch/main/graph/badge.svg)](https://codecov.io/gh/RANDSUM/randsum)
```

## Files to Create/Modify

| File | Action |

| -------------------------------- | ------------------------- |

| `.size-limit.json` | Create |

| `codecov.yml` | Create |

| `package.json` | Add devDeps + scripts |

| `.github/workflows/main.yml` | Add coverage + size steps |

| `packages/*/README.md` (7 files) | Add coverage badge |

## Required GitHub Setup

1. **Codecov**: Connect repo at codecov.io and add `CODECOV_TOKEN` to repository secrets
2. **Size-limit**: No additional setup needed

## Verification

After implementation:

- `bun run test:coverage` generates coverage locally
- `bun run size` checks bundle sizes locally
- CI uploads coverage to Codecov on main branch
- CI fails if bundle sizes exceed limits
- Coverage badge shows current coverage percentage
