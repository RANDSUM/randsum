# Scripts Reference

Complete reference for all development scripts in the RANDSUM monorepo.

## Quick Reference

### Most Used Commands

```bash
bun run help         # Show this help summary
bun run check:all    # Full CI pipeline (before PR)
bun run fix:all      # Auto-fix lint + format issues
bun run test         # Run all tests
bun run build        # Build all packages
```

### Package-Specific Commands

```bash
bun run --filter @randsum/roller test      # Test single package
bun run --filter @randsum/fifth build      # Build single package
bun run --filter @randsum/mcp typecheck    # Typecheck single package
```

## Script Categories

### Development Workflow

| Script      | Purpose                    | When to Use                           |
| ----------- | -------------------------- | ------------------------------------- |
| `help`      | Show available commands    | When you forget a command             |
| `prepare`   | Install lefthook git hooks | Auto-runs after `bun install`         |
| `fix:all`   | Lint --fix + format        | Before committing, or when hooks fail |
| `check:all` | Full CI locally            | Before opening PR                     |

### Testing

| Script          | Purpose                | Output                   |
| --------------- | ---------------------- | ------------------------ |
| `test`          | Run all tests          | Pass/fail in terminal    |
| `test:coverage` | Tests + coverage       | `./coverage/lcov.info`   |
| `bench`         | Performance benchmarks | Timing results           |
| `bench:ci`      | Benchmarks for CI      | `benchmark-results.json` |

### Profiling (Bun 1.3+)

| Script       | Purpose                 | Output                            |
| ------------ | ----------------------- | --------------------------------- |
| `profile`    | CPU profile benchmarks  | `.cpuprofile` (Chrome DevTools)   |
| `profile:md` | CPU profile as Markdown | `.cpuprofile.md` (LLM-friendly)   |

### Code Quality

| Script          | Purpose                | Auto-fix?          |
| --------------- | ---------------------- | ------------------ |
| `lint`          | ESLint all packages    | No (use `fix:all`) |
| `format`        | Prettier all packages  | Yes                |
| `format:check`  | Check formatting       | No                 |
| `typecheck`     | TypeScript strict mode | No                 |
| `check:exports` | Find unused exports    | No                 |

### Building

| Script       | Purpose              | Output             |
| ------------ | -------------------- | ------------------ |
| `build`      | Build all packages   | `packages/*/dist/` |
| `size`       | Check bundle sizes   | Size report        |
| `size:check` | Bundle sizes as JSON | JSON output        |
| `docs`       | Generate TypeDoc     | `docs/api/`        |

### Site Development

| Script       | Purpose          | URL                       |
| ------------ | ---------------- | ------------------------- |
| `site:dev`   | Astro dev server | `http://localhost:4321`   |
| `site:build` | Production build | `packages/site/dist/`     |

### Release Management

| Script              | Purpose                          | Notes                         |
| ------------------- | -------------------------------- | ----------------------------- |
| `changeset`         | Create a new changeset           | Interactive prompt            |
| `changeset:version` | Version packages from changesets | Updates package.json files    |
| `changeset:publish` | Publish packages to NPM          | Requires NPM auth             |
| `publish`           | Full publish flow                | Build → test → lint → publish |

### Package Creation

| Script               | Purpose                   | Example                          |
| -------------------- | ------------------------- | -------------------------------- |
| `create:game <name>` | Scaffold new game package | `bun run create:game mothership` |

### MCP Server Distribution (Bun 1.3+)

| Script            | Purpose                           | Output                                    |
| ----------------- | --------------------------------- | ----------------------------------------- |
| `mcp:compile`     | Build standalone MCP binary       | `dist/randsum-mcp` (current OS)           |
| `mcp:compile:all` | Build MCP for all platforms       | Linux, Windows, and current OS binaries   |

## Pre-commit Hooks (Lefthook)

These run automatically on `git commit`:

1. **lint** - ESLint with auto-fix (stages fixed files)
2. **format** - Prettier (stages fixed files)
3. **typecheck** - TypeScript checking

On `git push`:

1. **test** - All tests must pass
2. **exports** - Check for unused exports

If hooks fail, run `bun run fix:all` to auto-fix issues.

## Common Workflows

### Starting a New Feature

```bash
git checkout -b feature/my-feature
# make changes
bun run fix:all          # Fix any issues
bun run check:all        # Verify everything passes
git add . && git commit  # Hooks run automatically
```

### Adding a New Game Package

```bash
bun run create:game my-game
cd packages/my-game
# Edit src/types.ts with game-specific types
# Implement src/rollMyGame/index.ts
bun install              # Link workspace dependencies
bun run --filter @randsum/my-game test
```

See [game-packages.md](game-packages.md) for detailed patterns.

### Debugging Test Failures

```bash
bun run --filter @randsum/roller test           # Run specific package
bun test packages/roller/__tests__/roll.test.ts # Run specific file
bun test --watch                                 # Watch mode
```

### Checking Bundle Impact

```bash
bun run build
bun run size        # Human-readable
bun run size:check  # JSON for CI comparison
```

### Working on the Documentation Site

```bash
bun run site:dev    # Start dev server at localhost:4321
# Make changes to packages/site/
bun run site:build  # Verify production build works
```

### Profiling Performance

```bash
bun run profile      # Generate Chrome DevTools profile
# Open chrome://tracing and load the .cpuprofile file

bun run profile:md   # Generate Markdown profile
# Analyze in terminal or share with LLM for insights
```

### Building Standalone MCP Server

```bash
bun run mcp:compile      # Build for current OS
./dist/randsum-mcp       # Run without Bun installed

bun run mcp:compile:all  # Build for all platforms
# Creates: dist/randsum-mcp, dist/randsum-mcp-linux, dist/randsum-mcp.exe
```

## Script Implementation Details

### `check:all` Pipeline

Runs in sequence:

1. `lint` - ESLint checks
2. `format:check` - Prettier verification
3. `typecheck` - TypeScript compilation
4. `test` - All tests
5. `build` - Build all packages
6. `size` - Bundle size checks
7. `site:build` - Documentation site build

### `create:game` Generator

Located at `scripts/create-game-package.ts`. Creates:

```text
packages/{game-name}/
  src/
    index.ts              # Main exports
    types.ts              # Game-specific types
    roll{GameName}/
      index.ts            # Roll implementation
  __tests__/
    {game-name}.test.ts   # Initial test file
  AGENTS.md               # Package documentation
  LICENSE
  README.md
  package.json
  tsconfig.json
```

## Environment Requirements

- **Bun**: >= 1.3.8 (primary runtime)
- **Node.js**: >= 18.0.0 (for compatibility)

All scripts use Bun for execution. The monorepo uses Bun workspaces for dependency management.

## Bun-Native Features

This monorepo takes advantage of Bun 1.3+ features:

### Test Configuration (`bunfig.toml`)

```toml
[test]
timeout = 30000              # 30s timeout
coverage = true              # Enable coverage
retry = 2                    # Retry flaky tests (Bun 1.3.3+)
concurrentTestGlob = "..."   # Parallel tests (Bun 1.3+)
```

### Concurrent Testing

Integration tests run in parallel for faster execution. Use `test.concurrent` for I/O-bound tests:

```typescript
import { describe, test } from 'bun:test'

describe.concurrent('API tests', () => {
  test('endpoint A', async () => { /* ... */ })
  test('endpoint B', async () => { /* ... */ })
})
```

### Fake Timers

For deterministic timing tests (Bun 1.3.4+):

```typescript
import { test, setSystemTime } from 'bun:test'

test('time-dependent logic', () => {
  setSystemTime(new Date('2025-01-01'))
  // test code
  setSystemTime() // reset
})
```

### Standalone Executables

The MCP server can be compiled to a standalone binary:

```bash
bun run mcp:compile     # Current OS
bun run mcp:compile:all # Cross-platform (Linux, Windows)
```

This creates executables that run without Bun installed.

### CPU Profiling

Profile performance with native Bun profiler:

```bash
bun run profile      # Chrome DevTools format
bun run profile:md   # Markdown format (LLM-friendly)
```

### Native APIs Available

These Bun APIs are available for future use:

- `Bun.JSON5.parse()` / `Bun.JSONC.parse()` - Parse JSON with comments
- `Bun.YAML.parse()` - Native YAML support
- `Bun.stripANSI()` - 30-80x faster than npm packages
- `Bun.wrapAnsi()` - ANSI-aware text wrapping
- `Bun.build()` - Native bundler API
