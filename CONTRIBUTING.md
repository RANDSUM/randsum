# Contributing to RANDSUM

Thank you for your interest in contributing to RANDSUM! This guide will help you get started.

## Development Setup

### Prerequisites

- **Bun**: Version 1.0.0 or higher ([Install Bun](https://bun.sh))
- **Node.js**: Version 18.0.0 or higher (for compatibility)
- **Git**: For version control

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RANDSUM/randsum.git
   cd randsum
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Verify setup**
   ```bash
   bun run check:all
   ```

This runs the full CI pipeline: lint, format check, typecheck, test, build, and site build.

## Project Structure

### Monorepo Architecture

RANDSUM is a Bun workspace monorepo with the following structure:

```
packages/
  roller/          # Core dice rolling engine (all other packages depend on this)
  blades/          # Blades in the Dark mechanics
  daggerheart/     # Daggerheart RPG support
  fifth/           # D&D 5th Edition mechanics
  root-rpg/        # Root RPG implementation
  salvageunion/    # Salvage Union mechanics
  pbta/            # Powered by the Apocalypse mechanics
  mcp/             # Model Context Protocol server
apps/
  discord-bot/     # Discord bot (discord.js + Bun)
  site/            # Documentation website (Astro)
```

### Package Patterns

Each package follows a consistent structure:

```
packages/{package-name}/
  src/
    index.ts           # Main exports
    types.ts           # Type definitions
    {feature}/         # Feature implementations
  __tests__/           # Test files
  dist/                # Build output (gitignored)
  package.json
  tsconfig.json        # Extends ../../tsconfig.packages.json
```

## Coding Conventions

### TypeScript

- **Strict mode**: Enabled globally - all code must pass strict type checking
- **Type imports**: Use `import type { X } from 'package'` for type-only imports
- **Explicit return types**: All exported functions must have explicit return types
- **Naming**: PascalCase for types/interfaces, camelCase for functions
- **No `any`**: Use `unknown` if type is truly unknown, then narrow with type guards

### Type Safety Best Practices

- **Prefer type guards over `as` assertions**: Use `is` type predicates instead of `as` casts
- **Avoid `as unknown as T`**: This pattern is banned by ESLint - use proper type guards
- **Use switch statements for type narrowing**: When handling union types, use switch statements that TypeScript can narrow

**Good:**
```typescript
function isRollConfig(arg: unknown): arg is RollConfig {
  return (
    arg !== null &&
    typeof arg === 'object' &&
    'randomFn' in arg &&
    !('sides' in arg)
  )
}
```

**Bad:**
```typescript
const config = arg as unknown as RollConfig  // ❌ Banned by ESLint
```

### Code Style

- **Formatting**: Prettier is configured - run `bun run format` before committing
- **Linting**: ESLint with TypeScript rules - run `bun run lint` to check
- **Imports**: Sort imports according to ESLint rules (type imports separate)

### Testing

- **Test framework**: Use `bun:test` (describe, expect, test)
- **Test location**: Place tests in `__tests__/` directories
- **Property-based testing**: Use `fast-check` for property-based tests (see `roll.property.test.ts`)
- **Coverage**: Aim for high test coverage, especially for core `roller` package
- **Stress tests**: Use 9999 iterations for stress tests
- **Boundary conditions**: Always test edge cases and error conditions

**Example test structure:**
```typescript
import { describe, test, expect } from 'bun:test'
import { roll } from '../src/roll'

describe('roll()', () => {
  test('rolls dice within valid range', () => {
    const result = roll({ sides: 20, quantity: 1 })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
  })
})
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding conventions above
   - Add tests for new functionality
   - Update documentation as needed

3. **Run checks locally**
   ```bash
   bun run check:all
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build/tooling changes

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pre-commit Hooks

Lefthook runs automatically on commit:
- **Lint**: Auto-fixes linting issues
- **Format**: Formats code with Prettier
- **Typecheck**: Runs TypeScript type checking

These hooks will stage fixed files automatically.

### Package-Specific Development

**Working on a single package:**
```bash
# Run tests for one package
bun run --filter @randsum/roller test

# Build one package
bun run --filter @randsum/roller build

# Type check one package
bun run --filter @randsum/roller typecheck
```

**Working on the core `roller` package:**
- This is the foundation - changes here affect all game packages
- Ensure backward compatibility when possible
- Add comprehensive tests
- Update documentation for new features

**Working on a game package:**
- Use `createGameRoll` or `createMultiRollGameRoll` factories when possible
- Follow the pattern established in `@randsum/fifth` or `@randsum/daggerheart`
- Keep game-specific logic isolated

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] All tests pass (`bun run test`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code is formatted (`bun run format:check`)
- [ ] All packages build successfully (`bun run build`)
- [ ] New features have tests
- [ ] Documentation is updated (if needed)
- [ ] Commit messages follow conventional format
- [ ] No `as unknown as` type assertions (use type guards instead)

## Adding a New Game Package

Use the generator script to scaffold a new game package:

```bash
bun run create:game <game-name>
```

This creates a complete package structure with all required files:

```
packages/{game-name}/
  src/
    index.ts              # Main exports
    types.ts              # Game-specific types (customize this)
    roll{GameName}/
      index.ts            # Roll implementation (customize this)
  __tests__/
    {game-name}.test.ts   # Initial test file
  AGENTS.md
  LICENSE
  README.md
  package.json
  tsconfig.json
```

After generation:

1. **Edit `src/types.ts`** with your game-specific types
2. **Implement `src/roll{GameName}/index.ts`** with your game logic
3. **Add tests** in `__tests__/` directory
4. **Run `bun install`** to link workspace dependencies
5. **Update root `AGENTS.md`** to list the new package
6. **Add to site documentation** in `apps/site/` (optional)

For detailed patterns, see [AGENTS/game-packages.md](AGENTS/game-packages.md).

## Common Tasks

### Running Benchmarks

```bash
bun run bench
```

### Checking Bundle Sizes

```bash
bun run size
```

### Building the Documentation Site

```bash
bun run site:build
bun run site:dev  # Development server
```

### Checking for Unused Exports

```bash
bun run check:exports
```

## Getting Help

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check package README files and the main README

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something great together.

---

Thank you for contributing to RANDSUM! 🎲
