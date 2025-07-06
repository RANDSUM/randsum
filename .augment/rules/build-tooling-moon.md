---
type: "always_apply"
description: "Moon build system essentials for RANDSUM monorepo"
---

# Build System - Moon + Bun

## Key Commands

- `bun moon :build` - Build all packages
- `bun moon :test` - Run all tests
- `bun moon :lint` - Lint all packages
- `bun moon package-name:build` - Build specific package

## Package Structure

- All packages need `moon.yml` with `id` and `language: 'typescript'`
- Game packages depend on `roller` package
- Build outputs go to `dist/` with dual ESM/CJS format
- Use `bunup` for building with source maps and declarations

## Task Dependencies

Game packages must declare dependency on roller:

```yaml
dependsOn: ['roller']
tasks:
  build:
    deps: ['roller:build']
```
