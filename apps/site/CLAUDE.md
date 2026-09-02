# @randsum/site — Documentation Website

## Overview

Starlight-powered documentation site with a custom marketing landing page.
Private app, deploys to Cloudflare Workers on push to `main` via
`.github/workflows/deploy-cloudflare.yml`. Lives at `randsum.dev`.

## Tech Stack

- **Astro** — static site framework, built through `@astrojs/cloudflare`.
  `output` is `static`; only `src/pages/api/roll.ts` opts out with
  `prerender = false`, which is why this site needs a Worker at all.
- **`@astrojs/starlight` 0.40.0** — docs framework (sidebar, search, routing)
  - `starlight-sidebar-topics` — top-level topic grouping in the sidebar
  - `starlight-page-actions` — per-page action links
- **`@astrojs/react` 5.0.7** — interactive React islands (playground, REPL)
- **`astro-expressive-code`** — code block rendering
- **`@randsum/roller` + `@randsum/dice-ui`** — workspace-linked, power the live
  playground / notation components
- Fonts (Inter, JetBrains Mono) via Astro's Google font provider

> **`typescript` is pinned to `6.0.3` here, deliberately — do NOT move it to `catalog:`.**
> The rest of the workspace is on TypeScript 7.0.2 via the root `catalog`; this app and
> `apps/rdn` are the only holdouts, and they are blocked upstream rather than overlooked.
> `@astrojs/check` declares `peerDependencies: { typescript: "^5.0.0 || ^6.0.0" }` as of its
> latest release (0.9.10), and under TS 7 `astro check` dies before checking anything with
> `Cannot read properties of undefined (reading 'fileExists')` in `@astrojs/language-server`'s
> `getTsconfig`. Revisit when `@astrojs/check` ships a release whose peer range admits
> TypeScript 7.

## Content Structure

Docs live in `src/content/docs/` as `.mdx` files; Starlight auto-routes them.
Top-level topics: `welcome/`, `roller/`, `notation/`, `games/` (incl.
`games/schema/`), `tools/`.

## Landing Page

The home page is **not** a Starlight doc — it's a custom `src/pages/index.astro`
that renders a `StarlightPage` shell wrapping landing sections from
`src/components/landing/` (`LandingHero`, `FeaturesGrid`, `FeaturesPlayground`,
`GamesGrid`, `PackagesGrid`, `ToolsGrid`, `IntegrationsSection`,
`GameSchemaSection`, `LandingFooter`, `LandingScripts`). There is also a
`src/pages/discord.astro` route.

## Adding Content

Create a `.mdx` file in the appropriate `src/content/docs/` subdirectory with
frontmatter:

```mdx
---
title: Page Title
description: Brief description
---
```

Then register the slug in `astro.config.mjs` under `starlightSidebarTopics` in
the matching topic's `items` array.

## Components

Starlight component overrides (in `src/components/`, wired in `astro.config.mjs`):

- `Head.astro` — `<head>` override (OG/Twitter meta)
- `Header.astro` — site header override
- `SiteTitle.astro` — logo/title override
- `ThemeSelect.astro` — theme toggle override

Interactive / shared components:

- `live-repl/` — live code examples (used via `<CodeExample>` in MDX)
- `NotationRoller/` — notation input component
- `HeroInteractive.tsx` — hero dice playground
- `GameSchemaViewer.tsx` — schema viewer
- `IntegrationViewer.tsx` — integration viewer
- `LabeledSection.astro` — labeled content block
- `ErrorBoundary/` — React error boundary

## Build Pipeline

- `src/integrations/copy-markdown-to-dist.ts` — custom Astro integration that
  copies raw markdown into `dist/` (so source docs are fetchable post-build).

## Package Data

`src/utils/packageData.ts` defines metadata for packages shown on the site
(`corePackages`, `games`, `toolPackages`).

## Commands

```bash
bun run dev        # Dev server (localhost:4321)
bun run build      # Production build
bun run preview    # Preview production build
bun run typecheck  # astro check
bun run check      # build + typecheck + format:check + lint + test
```
