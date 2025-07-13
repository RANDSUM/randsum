---
type: "agent_requested"
description: "Task Management Rules"
---

# Task Management Rules

## Moon Build System

This project uses [Moon](https://moonrepo.dev) as the primary task runner and build orchestrator:

- **Global tasks** defined in `.moon/tasks.yml` apply to all packages
- **Project-specific tasks** defined in individual `moon.yml` files
- **Workspace configuration** in `.moon/workspace.yml` defines project discovery

## Standard Task Patterns

### Core Tasks (Available in all packages)

- **`build`** - Compile TypeScript to JavaScript using bunup
- **`test`** - Run tests using Bun test framework
- **`lint`** - Code linting with ESLint
- **`format`** - Code formatting with Prettier
- **`formatCheck`** - Verify code formatting without changes
- **`tsCheck`** - TypeScript type checking without compilation

### Workflow Tasks

- **`ci`** - Complete CI pipeline (tsCheck + lint + formatCheck)
- **`style:fix`** - Fix both linting and formatting issues
- **`docs`** - Generate TypeDoc documentation

### Version Management Tasks

- **`version`** - Interactive version bumping
- **`patch`** - Bump patch version
- **`minor`** - Bump minor version
- **`major`** - Bump major version
- **`publish`** - Publish package to npm

## Task Dependencies

### Build Dependencies

- All tasks that need compiled code should depend on `build`
- Cross-package dependencies use `package-name:build` syntax
- Apps depend on all their package dependencies being built first

### Example Dependency Chain

```yaml
tsCheck:
  deps:
    - "roller:build" # Wait for roller package to build

test:
  deps:
    - "build" # Build current package first

publish:
  deps:
    - "test" # Run tests
    - "lint" # Check linting
    - "tsCheck" # Verify types
    - "build" # Build package
```

## Caching Strategy

### Cache-Friendly Tasks

- **Build tasks**: Cache for 24 hours with source file inputs
- **Test tasks**: Cache for 1 hour with test and source inputs
- **Lint tasks**: Cache for 6 hours with source file inputs
- **Format tasks**: Cache for 12 hours with source file inputs

### Cache-Disabled Tasks

- **CI tasks**: Always run fresh in CI environments
- **Version tasks**: Never cache version bumping
- **Publish tasks**: Never cache publishing operations

## Task Execution Patterns

### Development Workflow

```bash
bun moon :build        # Build all packages
bun moon :test         # Test all packages
bun moon :lint         # Lint all packages
bun moon :format       # Format all packages
```

### CI/CD Workflow

```bash
bun moon ci            # Run complete CI pipeline
```

### Package-Specific Tasks

```bash
bun moon roller:build  # Build only roller package
bun moon mcp:test      # Test only mcp app
```

## Task Configuration Best Practices

- Use appropriate cache lifetimes based on task frequency
- Define clear input/output patterns for reliable caching
- Set `runInCI: false` for tasks that shouldn't run in CI
- Use `allowFailure: true` for optional tasks
- Leverage `runDepsInParallel: true` for independent dependencies
