---
type: "always_apply"
---

## Build System & Tooling

- Use Moon for task orchestration and dependency management
- Use Bun for JavaScript runtime, package manager, and testing
- Build with `bunup` tool: `bunup --entry src/index.ts -o dist --format esm,cjs -m -d -s -t node -c`
- All packages must have these Moon tasks: build, test, lint, tsCheck, publish, ci
- Game packages depend on dice package: include `dependsOn: ['roller']` in moon.yml
- Use consistent task dependencies: test/lint/tsCheck depend on build
- Enable caching for all tasks with `options: { cache: false }`
