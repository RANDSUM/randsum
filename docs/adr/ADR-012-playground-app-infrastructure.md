# ADR-012: Playground App Infrastructure

## Status

Accepted

## Context

Epic #938 calls for an interactive playground at `playground.randsum.dev` — a live RANDSUM dice notation sandbox where users can type notation, see results, and share URLs. The existing docs site at `randsum.dev` is built with Astro + Starlight and deployed to a single Netlify site. Adding a playground directly to the docs site is possible but has meaningful drawbacks:

- **Starlight is a constraint.** Starlight imposes a two-column documentation layout and its own theming and routing conventions. A single-page interactive app does not fit the docs-page model and would require fighting Starlight to achieve a full-bleed interactive experience.
- **Independent deployment cadence.** The playground's content changes on every `@randsum/roller` release. The docs site requires manual content authoring. Coupling them means every playground update triggers a full docs rebuild and vice versa.
- **Separate URL namespace.** `playground.randsum.dev` is a distinct product surface from the documentation. A subdomain better communicates that distinction to users and gives the playground room to evolve independently.
- **Bundle size isolation.** The playground will pull in React-heavy interactive components. Keeping it out of the docs bundle prevents regression of the docs site's load performance.

The monorepo already has the pattern for private Astro apps in `apps/`. The root workspace config (`"workspaces": ["packages/*", "apps/*"]`) automatically picks up any new directory under `apps/`.

## Decision

### 1. App location and package identity

The playground lives at `apps/playground/` in the monorepo. It is a private workspace package named `@randsum/playground`. It is never published to npm.

```json
{
  "name": "@randsum/playground",
  "version": "1.0.0",
  "private": true
}
```

The package depends on:

- `@randsum/roller` (`workspace:~`) — for `roll()`, notation validation, and parsing
- `@randsum/display-utils` (`workspace:~`) — for step visualization and modifier documentation utilities
- `@astrojs/react` — for interactive React components
- `react`, `react-dom` — from the root catalog (`catalog:`)
- `astro` — pinned, same major as the docs site
- `@astrojs/netlify` — for the Netlify adapter

`@randsum/component-library` is not a dependency. The playground builds its own UI components locally; importing the full component library would add bundle weight and coupling with the docs site's design system at a time when the playground's visual design has not been finalized.

### 2. Astro configuration

The playground is a standalone Astro app with no Starlight integration. It is a single-page application (`src/pages/index.astro`) with React islands for the interactive dice roller.

Key configuration decisions:

- `output: 'static'` in development; Netlify adapter active in production (same pattern as `apps/site/`)
- `@astrojs/react` integration enabled
- No Starlight, no sidebar, no content collections
- `site` set to `https://playground.randsum.dev`
- Vite aliases resolve `@randsum/roller` and `@randsum/display-utils` from workspace source during development, not from built `dist/` artifacts, matching the pattern in `apps/site/astro.config.mjs`

The app uses its own `src/styles/`, `src/components/`, and `src/pages/` directories. There is no shared layout import from `apps/site/`.

### 3. Netlify deployment

The playground is deployed as a **separate Netlify site** from the docs site. Each site has its own Netlify project, deploy key, and environment variables.

The playground's `netlify.toml` lives at `apps/playground/netlify.toml`. It does not inherit from any root-level config. Build configuration:

```toml
[build]
  base = "."
  command = "bun run build && bun run playground:build"
  publish = "apps/playground/dist"
```

The `base` directory for the Netlify build is the **monorepo root**, not `apps/playground/`. This is required because the build command must first build `@randsum/roller` and `@randsum/display-utils` before the playground's Astro build can resolve its workspace dependencies. This mirrors the docs site's existing Netlify setup.

The `publish` directory is `apps/playground/dist`, which is what Astro writes when building from the monorepo root with `bun run --filter @randsum/playground build`.

### 4. DNS and subdomain

`playground.randsum.dev` is configured as a CNAME pointing to the Netlify site's auto-assigned domain (e.g., `randsum-playground.netlify.app`). This is a **manual infrastructure step** performed once in the DNS provider's control panel and in the Netlify site's domain settings.

This step is not automatable from the codebase and is not part of any CI pipeline. It is documented as a one-time setup prerequisite in `apps/playground/README.md` (or equivalent setup notes) rather than in CI config.

### 5. Root build script integration

The root `bun run build` script is **not changed** to include the playground. The current build script explicitly names each publishable package:

```
bun run --filter '@randsum/roller' build && bun run --filter '@randsum/display-utils' build && ...
```

The playground is private, not published to npm, and has a different deployment target. It does not belong in the publish-oriented build chain.

A new root script `playground:build` is added:

```json
"playground:build": "bun run --filter @randsum/playground build",
"playground:dev": "bun run --filter @randsum/roller dev & bun run --filter @randsum/display-utils dev & bun run --filter @randsum/playground dev"
```

This keeps the playground accessible from the root without embedding it in the npm publish pipeline.

### 6. CI integration

The playground build is **not included** in `check:all`. The rationale:

- `check:all` runs on every PR and targets publishable packages. The playground is private infrastructure.
- Adding the playground to `check:all` would slow down every PR with an Astro build that is only relevant when playground source files change.
- Netlify already runs a deploy preview build on every PR that touches `apps/playground/`. That preview build serves as the playground's CI gate.

If a future pre-push hook or CI step is added for the playground, it should be scoped to changes in `apps/playground/`, `packages/roller/`, or `packages/display-utils/` using path filters.

No size-limit entry is added for the playground. `size-limit` in this monorepo enforces npm bundle size for published packages. The playground is an app deployed to a CDN; its size is managed by Netlify's deploy preview performance metrics, not by `size-limit`.

### 7. Shared vs local concerns

**Shared (consumed from workspace packages):**

- `@randsum/roller` — all dice mechanics and notation parsing
- `@randsum/display-utils` — step visualization, modifier documentation, StackBlitz utilities
- Root ESLint config (`eslint.config.js`)
- Root Prettier config (`.prettierrc`, `.prettierignore`)
- Root TypeScript base config (extended in `apps/playground/tsconfig.json`)

**Local to the playground:**

- Astro config (`apps/playground/astro.config.mjs`)
- Netlify config (`apps/playground/netlify.toml`)
- All React components in `apps/playground/src/components/`
- Page layout and styles in `apps/playground/src/`
- Any URL-sharing logic for shareable playground state

**Not shared with `apps/site/`:**

- Starlight theme, customCss, sidebar configuration
- Starlight content collections and MDX pages
- `@astrojs/starlight` integration
- The `Header.astro` component override
- Google Font configurations (the playground chooses its own typography independently)
- `@randsum/component-library` (docs site imports it; playground does not)

Design tokens (CSS custom properties for color, spacing, radius) may be extracted from `apps/site/src/styles/custom.css` into a shared stylesheet in the future, but this is deferred. At launch, the playground defines its own CSS variables. Premature sharing creates a coupling risk between two apps with different visual requirements.

## Consequences

### Positive

- The playground has a clean, unconstrained Astro setup. No Starlight conventions to work around.
- The docs site and playground deploy independently. A broken playground deploy does not block a docs release.
- `check:all` is not slower. PR CI time is unaffected for non-playground changes.
- The monorepo workspace automatically picks up `apps/playground/` with zero root config changes.
- Netlify deploy previews provide per-PR playground testing at no extra configuration cost.
- Bundle size enforcement for publishable packages is not diluted by app-level assets.

### Negative

- Two separate Netlify sites to manage (billing, environment variables, deploy keys). The operational surface doubles for anyone managing Netlify configuration.
- The subdomain CNAME is a manual step that must be documented and performed by a human with DNS access. It cannot be verified by CI.
- CSS tokens are duplicated between `apps/site/` and `apps/playground/` at launch. If the design system evolves, changes must be applied in two places until a shared token package is introduced.
- `@randsum/display-utils` must be built before the playground build runs. Netlify's build command (`bun run build && bun run playground:build`) ensures ordering, but local development requires running dependencies first (`playground:dev` handles this via the `&` chain).
- The playground is excluded from `check:all`, so a breaking change in `@randsum/roller`'s public API that crashes the playground will not surface in the standard CI pipeline. It surfaces only in Netlify deploy previews on PRs that touch `apps/playground/`.

## References

- Epic #938: Interactive Playground with Shareable URLs (randsum.dev/playground)
- `apps/site/astro.config.mjs` — existing Astro + Starlight + Netlify configuration (reference pattern)
- `apps/site/netlify.toml` — existing Netlify build config (reference pattern)
- `apps/site/package.json` — existing private app package structure (reference pattern)
- Root `package.json` — workspace config, build scripts, catalog deps
- `packages/display-utils/` — utilities consumed by the playground
- ADR-008: ESM-only package output (applies to `@randsum/roller` and `@randsum/display-utils` consumed by the playground)
