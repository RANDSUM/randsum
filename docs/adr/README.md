# Architecture Decision Records (ADR) Index

Architecture Decision Records for RANDSUM. Each ADR captures a single decision, its context, and consequences. Use this index to find the ADR relevant to a topic without having to scan every file.

## Categories

### Package Architecture

| #                                                         | Title                                                  | Status                   |
| --------------------------------------------------------- | ------------------------------------------------------ | ------------------------ |
| [001](./ADR-001-unified-games-package.md)                 | Unified games package with subpath exports             | Accepted                 |
| [003](./ADR-003-notation-as-separate-package.md)          | Notation as separate zero-dependency package           | Superseded by ADR-005    |
| [005](./ADR-005-merge-notation-into-roller.md)            | Merge @randsum/notation back into @randsum/roller      | Accepted                 |
| [007](./ADR-007-modifier-co-location.md)                  | Modifier co-location into `src/modifiers/`             | Proposed                 |
| [009](./ADR-009-public-api-surface-reduction.md)          | Public API surface reduction for @randsum/roller       | Proposed                 |

### Code Generation and Schema

| #                                                   | Title                              | Status   |
| --------------------------------------------------- | ---------------------------------- | -------- |
| [002](./ADR-002-code-generation-from-json-specs.md) | Code generation from JSON specs    | Accepted |

### Notation and Modifiers

| #                                                   | Title                                                          | Status   |
| --------------------------------------------------- | -------------------------------------------------------------- | -------- |
| [004](./ADR-004-literal-types-over-branded-types.md)| Literal types over branded types for public API                | Accepted |
| [006](./ADR-006-notation-scope-boundary.md)         | Notation scope boundary — single roll expressions only         | Accepted |
| [014](./ADR-014-modifier-category-taxonomy.md)      | Modifier category taxonomy and pipeline model                  | Accepted |

### Publishing and Build

| #                                                   | Title                                                     | Status   |
| --------------------------------------------------- | --------------------------------------------------------- | -------- |
| [008](./ADR-008-esm-only-package-output.md)         | ESM-only package output across all publishable packages   | Proposed |

### Toolchain

| #                                                             | Title                                 | Status                          |
| ------------------------------------------------------------- | ------------------------------------- | ------------------------------- |
| [013](./ADR-013-biome-migration-evaluation.md)                | Biome migration evaluation            | Accepted (deferred migration)   |

### Documentation Sites

| #                                                                   | Title                                                        | Status                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| [010](./ADR-010-docs-site-notation-merge-alignment.md)              | Documentation site alignment with notation-into-roller merge | Accepted                                 |
| [015](./ADR-015-custom-astro-layout-over-starlight.md)              | Custom Astro layout over Starlight for notation.randsum.dev  | Accepted                                 |
| [016](./ADR-016-static-version-embedding.md)                        | Per-version static pages for spec versioning                 | Accepted (amended)                       |
| [017](./ADR-017-vanilla-typescript-client-interactivity.md)         | Vanilla TypeScript for client interactivity in apps/spec     | Accepted                                 |

### Playground / Interactive Apps

| #                                                     | Title                           | Status   |
| ----------------------------------------------------- | ------------------------------- | -------- |
| [011](./ADR-011-playground-layout-design.md)          | Playground layout design        | Accepted |
| [012](./ADR-012-playground-app-infrastructure.md)     | Playground app infrastructure   | Accepted |

## For AI Agents

Consult these ADRs before starting the related kind of task.

- **Adding a new game package** — check [ADR-001](./ADR-001-unified-games-package.md) (single `@randsum/games` with subpath exports) and [ADR-002](./ADR-002-code-generation-from-json-specs.md) (never hand-write — extend the JSON schema and regenerate).
- **Extending dice notation or adding a new modifier** — check [ADR-006](./ADR-006-notation-scope-boundary.md) (no multi-expression composition) and [ADR-014](./ADR-014-modifier-category-taxonomy.md) (pipeline model, category taxonomy). For modifier file layout, [ADR-007](./ADR-007-modifier-co-location.md).
- **Changing `roll()` input types** — [ADR-004](./ADR-004-literal-types-over-branded-types.md) established literal-type API. Branded types are rejected.
- **Modifying the roller public API surface** — [ADR-009](./ADR-009-public-api-surface-reduction.md) limits the public symbols. Consult before adding exports.
- **Adding CJS support or a `require` conditional export** — rejected by [ADR-008](./ADR-008-esm-only-package-output.md).
- **Looking for `@randsum/notation`** — gone. Merged into roller per [ADR-005](./ADR-005-merge-notation-into-roller.md). Original separation rationale in [ADR-003](./ADR-003-notation-as-separate-package.md) (superseded).
- **Considering a linter/formatter swap (e.g., Biome)** — [ADR-013](./ADR-013-biome-migration-evaluation.md) deferred the migration. Re-evaluate only with new evidence.
- **Working on notation.randsum.dev (`apps/spec/` / `apps/rdn/`)** — [ADR-015](./ADR-015-custom-astro-layout-over-starlight.md) (no Starlight), [ADR-016](./ADR-016-static-version-embedding.md) (per-version static pages), [ADR-017](./ADR-017-vanilla-typescript-client-interactivity.md) (no React islands).
- **Working on the playground app** — [ADR-011](./ADR-011-playground-layout-design.md) (layout), [ADR-012](./ADR-012-playground-app-infrastructure.md) (infrastructure). Note the playground is in the process of being retired in favor of `apps/expo/` per the Unified Roller App Sprint.
- **Updating the docs site copy or examples** — [ADR-010](./ADR-010-docs-site-notation-merge-alignment.md) aligned the site with the notation-into-roller merge. Any doc that still references `@randsum/notation` as a separate package is stale.

When a proposed change conflicts with an ADR, either amend the ADR in the same PR (with explicit superseded/amended status) or reject the change.
