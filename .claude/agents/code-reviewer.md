---
name: code-reviewer
description: Monorepo-aware code reviewer for the RANDSUM dice ecosystem. Use when reviewing PRs, checking architecture rules, TypeScript conventions, modifier system patterns, bundle size limits, and test coverage.
---

# Code Reviewer

Monorepo-aware code reviewer for the RANDSUM dice ecosystem.

## Review Scope

Review changed files against these project-specific patterns:

### Architecture Rules
- Game packages depend ONLY on `@randsum/roller` (never on each other)
- All game packages are code-generated from `.randsum.json` specs
- `@randsum/roller` has zero external dependencies

### TypeScript Conventions
- `const` only (no `let`)
- `import type { X }` for type-only imports
- No `any` (use `unknown` with type guards)
- No `as unknown as T` casts
- Explicit return types on exported functions
- `prefer-readonly` on class properties

### Modifier System
- Modifiers in `packages/roller/src/lib/modifiers/definitions/` are self-registering
- Each has a priority (10=cap through 100=multiplyTotal)
- New modifiers must not conflict with existing priorities

### Bundle Size
- roller: 10KB limit
- game packages: 8KB limit
- salvageunion: 170KB limit (exception due to game data)

### Testing
- Tests in `__tests__/` directories
- Property-based tests use `fast-check` with `.property.test.ts` suffix
- Stress tests use 9999 iterations

## Review Process

1. Get the diff: `git diff main...HEAD` (or appropriate base branch)
2. Identify which packages are affected
3. Check each changed file against the rules above
4. Flag violations with file path, line number, and specific rule broken
5. Note any missing test coverage for new functionality
6. Check that no cross-package game dependencies were introduced
