---
type: "agent_requested"
description: "Environment and Dependencies Rules"
---

# Environment and Dependencies Rules

## Package Manager: Bun

This project exclusively uses [Bun](https://bun.sh) as the package manager and runtime:

- **Installation**: Use `bun install` for dependency installation
- **Scripts**: Use `bun run <script>` or `bun <script>` for running scripts
- **Workspaces**: Configured in root `package.json` with `workspaces` field
- **Lock file**: `bun.lock` is the authoritative dependency lock file

### Dependency Management

- Use `bun add <package>` to add dependencies
- Use `bun add -d <package>` for development dependencies
- Use `workspace:~` protocol for internal package dependencies
- Never manually edit `package.json` dependencies - use Bun commands

## TypeScript Configuration

### Base Configuration

- Root `tsconfig.json` provides base configuration for all packages
- Each package extends the root configuration with package-specific settings
- Target ES2022 with Node.js 18+ compatibility
- Strict type checking enabled across all packages

### Package TypeScript Setup

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "__tests__", "node_modules"]
}
```

## Build Tooling

### Bunup (Build Tool)

- Primary build tool for compiling TypeScript packages
- Generates both ESM and CommonJS outputs
- Includes source maps and type declarations
- Configuration: `bunup --entry src/index.ts -o dist --format esm,cjs -m -d -s -t node -c --sm inline`

### Output Formats

- **ESM**: Primary module format for modern environments
- **CommonJS**: Compatibility format for legacy Node.js
- **Type Declarations**: Generated `.d.ts` files for TypeScript consumers
- **Source Maps**: Inline source maps for debugging

## Code Quality Tools

### ESLint Configuration

- Shared configuration in `eslint.config.js` at repository root
- TypeScript-aware linting with `@typescript-eslint`
- Security rules with `eslint-plugin-security`
- Import sorting with `eslint-plugin-simple-import-sort`
- React-specific rules for React components

### Prettier Configuration

- Shared configuration in `.prettierrc` at repository root
- Consistent formatting across all TypeScript, JavaScript, JSON, and Markdown files
- Integrated with ESLint for conflict-free operation

## Runtime Requirements

### Node.js Compatibility

- Minimum Node.js version: 18.0.0
- Minimum Bun version: 1.0.0
- Target modern JavaScript features (ES2022)

### Package Exports

- Use modern `exports` field in `package.json`
- Provide both ESM and CommonJS entry points
- Include type declarations for TypeScript consumers
- Support React Native with source field

## Development Environment

### Required Tools

- **Bun**: Package manager and runtime
- **Moon**: Task runner and build orchestrator
- **TypeScript**: Type checking and compilation
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Optional Tools

- **TypeDoc**: API documentation generation
- **Lighthouse**: Performance auditing (for web apps)
- **Sharp**: Image processing (for apps with image handling)

## Environment Variables

- Use `.env` files for local development configuration
- Never commit sensitive environment variables
- Document required environment variables in package README files
- Use TypeScript for environment variable validation where needed

## Package Publishing

### NPM Configuration

- All packages are public (`"private": false`)
- Use scoped package names: `@randsum/package-name`
- Include proper metadata: author, license, repository, homepage
- Specify engine requirements for Node.js and Bun compatibility
