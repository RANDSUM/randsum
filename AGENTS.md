# RANDSUM Monorepo

## Architecture

This is a Bun workspace monorepo containing dice rolling packages for tabletop RPGs.

**Core Package:**
- `@randsum/roller` - Core dice rolling engine with advanced notation support

**Game Packages** (all depend on `@randsum/roller`):
- `@randsum/blades` - Blades in the Dark system mechanics
- `@randsum/daggerheart` - Daggerheart RPG system support
- `@randsum/fifth` - D&D 5th Edition mechanics
- `@randsum/root-rpg` - Root RPG system implementation
- `@randsum/salvageunion` - Salvage Union mechanics

**Tools & Applications:**
- `@randsum/mcp` - Model Context Protocol server for AI integration
- `@randsum/site` - Documentation and marketing website (Astro)

## Development Commands

```bash
bun install          # Install all dependencies
bun run build        # Build all packages
bun run test         # Run all tests
bun run lint         # Lint all packages
bun run format       # Format all packages
bun run typecheck    # Type check all packages
bun run check:all    # Full CI pipeline (lint, format, typecheck, test, site build)
```

## TypeScript Conventions

- Strict mode enabled globally (`tsconfig.json`)
- Use `type` imports: `import type { X } from 'package'`
- Export types separately from implementations
- Explicit return types on exported functions
- PascalCase for types/interfaces, camelCase for functions
- No `any` - use `unknown` if type is truly unknown

## Package Patterns

### Build Output
All packages produce ESM + CJS dual packages:
- `dist/index.js` (ESM)
- `dist/index.cjs` (CommonJS)
- `dist/index.d.ts` and `dist/index.d.cts` (type definitions)

### Dependencies
- Internal dependencies use `workspace:~` version specifier
- Game packages depend on `@randsum/roller`
- All packages specify `engines.node` and `engines.bun` requirements

### Testing
- Use `bun:test` (describe, expect, test)
- Test files in `__tests__/` directories
- Stress tests use 9999 iterations
- Test boundary conditions and error cases

## Dice Notation

Complete reference: `packages/roller/RANDSUM_DICE_NOTATION.md`

Quick examples:
- `roll("2d6")` - Roll 2 six-sided dice
- `roll("4d6L")` - Roll 4d6, drop lowest (D&D ability scores)
- `roll("2d20H")` - Roll 2d20, keep highest (advantage)
- `roll("1d20+5")` - Roll 1d20, add 5

## File Structure

```
packages/
  {package-name}/
    src/
      index.ts           # Main exports
      types.ts           # Type definitions
      {feature}/         # Feature implementations
    __tests__/           # Test files
    dist/                # Build output (gitignored)
    package.json
    tsconfig.json        # Extends ../../tsconfig.packages.json
```

