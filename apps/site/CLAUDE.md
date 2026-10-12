# @randsum/site — Documentation Website

## Overview

Starlight-powered documentation site with a custom marketing landing page.
Private app, deploys to Cloudflare Workers once CI is green on `main` via
`.github/workflows/deploy-cloudflare.yml`. Lives at `randsum.dev`.

## Tech Stack

- **Astro** — static site framework, `output: 'static'` with no adapter.
  `/api/roll` is a plain Worker in `worker/` (`index.ts` routes, `roll.ts`
  evaluates); `wrangler.jsonc` sends only `/api/*` to it via
  `run_worker_first`. Legacy 301s live in `public/_redirects`, not Astro's
  `redirects` option. Run the Worker locally with
  `bun run build && bunx wrangler@4 dev -c wrangler.jsonc`.
- **`@astrojs/starlight` 0.40.0** — docs framework (sidebar, search, routing)
  - `starlight-sidebar-topics` — top-level topic grouping in the sidebar
  - `starlight-page-actions` — per-page action links
- **`@astrojs/react` 5.0.7** — interactive React islands (playground, REPL)
- **`astro-expressive-code`** — code block rendering
- **`@randsum/roller`** — workspace-linked, powers the live notation components
- Fonts (Inter, JetBrains Mono) via Astro's Google font provider, loaded by the
  `<Font />` tags in `Head.astro`

> **`typescript` is pinned to `6.0.3` here, deliberately — do NOT move it to `catalog:`.**
> The rest of the workspace is on TypeScript 7.0.2 via the root `catalog`; this app and
> `apps/rdn` are the only holdouts, and they are blocked upstream rather than overlooked.
> `@astrojs/check` declares `peerDependencies: { typescript: "^5.0.0 || ^6.0.0" }` as of its
> latest release (0.9.10), and under TS 7 `astro check` dies before checking anything with
> `Cannot read properties of undefined (reading 'fileExists')` in `@astrojs/language-server`'s
> `getTsconfig`. Revisit when `@astrojs/check` ships a release whose peer range admits
> TypeScript 7.

## Theme

`src/styles/theme.css` is the only file that spells a colour, for this site
and for `apps/rdn`, which `@import`s it. Each mode-dependent token is written
once as `light-dark(light, dark)`; the page's `color-scheme`, which Starlight
sets from `data-theme`, picks the arm. `custom.css` maps Starlight's
`--sl-color-*` onto it, and a game's colour is always `--game-<id>`. Tint with
`color-mix(in srgb, var(--token) N%, transparent)`. The `no-raw-color` Biome
plugin fails hex in any other `.css` file, and `__tests__/theme.test.ts` does
the same for Astro `<style>` blocks.

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
- `dice-ui/` — the web-only React dice UI: `NotationRoller` (token-overlay
  input + roll button), `RollResultPanel`/`RollResultDisplay` (roll steps), and
  their internals (`TokenOverlayInput`, `RollSteps`, `useTheme`, `tokenColor`).
  `index.ts` is the barrel and loads `tokens.css` (spacing and radii) once;
  colours and fonts are the site theme's `--rs-*`. Its component tests live in `__tests__/dice-ui/`
  and mount through happy-dom, which `bunfig.toml` preloads for every site test.
- `NotationRoller/` — wraps `dice-ui`'s roller with the StackBlitz action and
  the floating result overlay
- `HeroInteractive.tsx` — hero dice playground
- `GameSchemaViewer.tsx` — schema viewer
- `IntegrationViewer.tsx` — integration viewer
- `LabeledSection.astro` — labeled content block
- `ErrorBoundary/` — React error boundary

## Build Pipeline

- `src/integrations/curated-llms-txt.ts` — prepends the repo-root `llms.txt` to
  the page list `starlight-page-actions` writes to `dist/llms.txt`. Edit the
  root file; there is no `public/` copy. It must stay after `starlight()`.

## Package Data

`src/utils/packageData.ts` defines metadata for packages shown on the site
(`corePackages`, `games`, `toolPackages`).

## Commands

```bash
bun run dev        # Dev server (localhost:4321)
bun run build      # Production build
bun run preview    # Preview production build
bun run typecheck  # astro check
bun run check      # build + typecheck + test
```
