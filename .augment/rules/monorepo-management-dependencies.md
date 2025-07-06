---
type: "agent_requested"
description: "Monorepo dependency management"
---

# Monorepo Dependencies

## Workspace Structure

- Use `@randsum/package-name` naming convention
- Organize packages logically: core (roller) and game packages
- Use Moon for task orchestration and build management

## Dependency Management

- Internal dependencies: `"@randsum/roller": "workspace:~"`
- External dependencies: Use consistent version ranges
- TypeScript project references for proper build order

## Moon Configuration

```yaml
# Package-level moon.yml
type: 'library'
tasks:
  build:
    command: 'bun run build'
    inputs: ['src/**/*', 'package.json', 'tsconfig.json']
    outputs: ['dist']
```

## Build Order

Moon automatically determines build order based on dependencies:
roller → game packages → mcp server


