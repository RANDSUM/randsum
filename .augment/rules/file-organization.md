---
type: "agent_requested"
description: "File Organization Rules"
---

# File Organization Rules

## Monorepo Structure

This project follows a strict monorepo pattern with clear separation of concerns:

- **`packages/`** - Library packages (reusable code)
  - Core functionality that can be shared across apps
  - Each package should have a focused, single responsibility
  - Examples: dice rolling engine, game system implementations

## Workspace Configuration

- Use Bun workspaces defined in root `package.json`
- Each package has its own `package.json` with proper metadata
- Workspace dependencies use `workspace:~` protocol for internal packages
- All packages follow consistent naming: `@randsum/package-name`

## Directory Conventions

### Package Structure

```
packages/package-name/
├── src/           # Source code
├── __tests__/     # Test files
├── dist/          # Build output (generated)
├── package.json   # Package configuration
├── tsconfig.json  # TypeScript configuration
├── moon.yml       # Moon task configuration
└── README.md      # Package documentation
```

## File Naming Conventions

- Use kebab-case for directories and files
- TypeScript files use `.ts` extension
- Test files use `.test.ts` or `.spec.ts` suffix
- Configuration files follow tool conventions (e.g., `moon.yml`, `tsconfig.json`)

## Import/Export Patterns

- Use barrel exports (`index.ts`) for clean package interfaces
- Prefer named exports over default exports
- Internal imports should use relative paths
- Cross-package imports should use workspace package names

## Documentation

- Each package/app must have a comprehensive README.md
- Use TypeDoc for API documentation generation
- Include usage examples and installation instructions
- Document any special configuration or setup requirements
