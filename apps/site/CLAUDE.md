# @randsum/site — Documentation Website

## Overview

Starlight-powered documentation site with a custom marketing landing page.
Private app, deploys to Netlify on push to `main`. Lives at `randsum.dev`.

## Tech Stack

- **Astro 6.4.6** — static site framework (`output` via `@astrojs/netlify`)
- **`@astrojs/starlight` 0.40.0** — docs framework (sidebar, search, routing)
  - `starlight-sidebar-topics` — top-level topic grouping in the sidebar
  - `starlight-page-actions` — per-page action links
- **`@astrojs/react` 5.0.7** — interactive React islands (playground, REPL)
- **`astro-expressive-code`** — code block rendering
- **`@randsum/roller` + `@randsum/dice-ui`** — workspace-linked, power the live
  playground / notation components
- Fonts (Inter, JetBrains Mono) via Astro's Google font provider

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
