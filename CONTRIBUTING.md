# Contributing to RANDSUM

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Node.js](https://nodejs.org) v18+ (for compatibility)
- Git

## Setup

```bash
git clone https://github.com/RANDSUM/randsum.git
cd randsum
bun install
bun run check:all  # Verify everything works
```

## Project Structure

- `packages/roller/` -- Core dice engine (all packages depend on this)
- `packages/notation/` -- Dice notation parser (zero dependencies)
- `packages/games/` -- Game system packages (subpath exports per game)
- `packages/display-utils/` -- Browser utilities for step visualization and StackBlitz integration
- `apps/site/` -- Documentation site (Astro)

## Adding a New Game

Game packages are code-generated from `.randsum.json` specs. To add a game:

1. Create `packages/games/<shortcode>.randsum.json` with the game spec
2. Run `bun run --filter @randsum/games gen` to generate the TypeScript module
3. Add tests in `packages/games/__tests__/<shortcode>.test.ts`
4. Add a subpath export to `packages/games/package.json`

See `packages/games/CLAUDE.md` for detailed patterns and conventions.

## Testing

- Framework: `bun:test` (`import { describe, expect, test } from 'bun:test'`)
- Tests go in `__tests__/` directories
- Property-based tests use `fast-check` (suffix: `.property.test.ts`)
- Coverage target: 80% project, 70% patch
- Run all tests: `bun run test`
- Run one package: `bun run --filter @randsum/roller test`

## Code Style

- TypeScript strict mode with `isolatedDeclarations` and `exactOptionalPropertyTypes`
- `const` only (no `let`), `import type` for type-only imports
- No `any`, no `as unknown as T` -- use type guards
- Explicit return types on exported functions
- Prettier: no semicolons, single quotes, no trailing commas

See the root `CLAUDE.md` for the full TypeScript conventions reference.

Run `bun run fix:all` to auto-fix lint and format issues.

## Pull Request Process

1. Branch from `main`
2. Make focused changes with tests
3. Run `bun run check:all` before pushing
4. Use conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`)
5. Open a PR with a clear description of what and why

### Pre-commit Hooks

Lefthook runs on commit: ESLint, Prettier, and typecheck. If hooks fail, run `bun run fix:all`.

## Resources

- [GitHub Issues](https://github.com/RANDSUM/randsum/issues) -- bugs and feature requests
- [Project Board](https://github.com/orgs/RANDSUM/projects/2/views/1) -- roadmap and priorities
- [Dice Notation Spec](packages/roller/RANDSUM_DICE_NOTATION.md) -- notation syntax reference
- [Architecture Decisions](docs/adr/) -- key design decisions and rationale
