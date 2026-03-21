# @randsum/site - Documentation Website

## Overview

Starlight-powered static documentation site. Deploys to Netlify on push to main.

## Tech Stack

- **Astro** with `@astrojs/starlight` — docs framework with sidebar, search, and routing
- **React** via `@astrojs/react` — interactive components (playground, live REPL)
- **Netlify** adapter for static output

## Content Structure

All documentation lives in `src/content/docs/` as `.mdx` files. Starlight auto-routes them:

```
src/content/docs/
  welcome/
    introduction.mdx
    ecosystem-overview.mdx
  roller/
    introduction.mdx
    getting-started.mdx
    roll-options.mdx
    modifiers.mdx
    error-handling.mdx
    api-reference.mdx
  notation/
    introduction.mdx
    getting-started.mdx
    randsum-dice-notation.mdx
    validation-and-parsing.mdx
    api-reference.mdx
  games/
    introduction.mdx
    getting-started.mdx
    blades.mdx
    daggerheart.mdx
    fifth.mdx
    pbta.mdx
    root-rpg.mdx
    salvageunion.mdx
    schema/
      overview.mdx
      reference.mdx
      using-loadspec.mdx
      contributing-a-game.mdx
  tools/
    discord-bot.mdx
    claude-code-skill.mdx
```

## Adding Content

Create a `.mdx` file in the appropriate `src/content/docs/` subdirectory with frontmatter:

```mdx
---
title: Page Title
description: Brief description
---
```

Then register the slug in `astro.config.mjs` under `starlightSidebarTopics` in the matching topic's `items` array.

## Components

Custom Starlight component overrides in `src/components/`:

- `Header.astro` — site header override
- `SiteTitle.astro` — logo/title override
- `ThemeSelect.astro` — theme toggle override

Interactive components:

- `live-repl/` — live code examples (used via `<CodeExample>` in MDX)
- `HeroInteractive.tsx` — hero section dice playground
- `NotationRoller/` — notation input component
- `GameComparison.tsx` — game system comparison table
- `GameSchemaViewer.tsx` — schema viewer
- `IntegrationViewer.tsx` — integration viewer
- `LabeledSection.astro` — labeled content block

## Package Data

`src/utils/packageData.ts` defines metadata for packages shown on the site:

- `corePackages` — core packages array
- `games` — game system packages
- `toolPackages` — tool packages

## Build Commands

```bash
bun run dev        # Development server (localhost:4321)
bun run build      # Production build
bun run preview    # Preview production build
bun run typecheck  # astro check
bun run check      # Full check (build, typecheck, format, lint, test)
```
