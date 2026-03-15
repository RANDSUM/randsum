# ADR-001: Unified games package with subpath exports

## Status

Accepted

## Context

Originally each game system was published as a separate npm package (e.g., `@randsum/blades`, `@randsum/fifth`). This led to high maintenance overhead: each game required its own package.json, version management, CI configuration, and publishing workflow. Adding a new game meant scaffolding an entire package.

## Decision

Consolidate all game packages into a single `@randsum/games` package with subpath exports. Consumers import per-game functionality via `@randsum/games/blades`, `@randsum/games/fifth`, etc. All games share a single version and are published together.

## Consequences

- Simpler publishing and version management across all game packages.
- Single `bun install @randsum/games` gives access to all supported systems.
- Adding a new game requires only a spec file, generated code, and a subpath export entry.
- Trade-off: consumers install all games even if they only use one. Bundle size impact is mitigated by tree-shaking and the small size of individual game modules.
- Old per-game packages on npm need deprecation notices pointing to the new unified package.
