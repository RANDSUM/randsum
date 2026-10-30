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
- Fonts (Gabarito for text and headings, JetBrains Mono for code)
  via Astro's Google font provider, loaded by the `<Font />` tags in `Head.astro`
- Brand: the pip R mark (`src/components/PipMark.astro`, outline and knockout) and a
  product family. Chrome is neutral; `src/utils/product.ts` maps a path to its product
  (roller, games, spec, mcp, discord, plugin), `Head.astro` stamps `<html data-product>`,
  and `theme.css` turns that into the page's accent (`--product-*`)

> **`typescript` is `7.1.0-beta` here, not the root `catalog:` (7.0.2).** `astro check` refuses
> TypeScript 7, so `typecheck` runs `tsc --noEmit --runExternalCode` with
> `@astrojs/ts-content-mapper` registered under `contentMappers` in `tsconfig.json`; that
> mapper needs TypeScript 7.1+. `src/virtual-modules.d.ts` declares the `virtual:` modules that
> Starlight's and Expressive Code's shipped `.astro` files import. Move to `catalog:` once the
> catalog reaches 7.1. Astro 7.4 needs Node >= 22.23.4.

## Theme

`src/styles/theme.css` is the only file that spells a colour, for the
Starlight pages and for `/spec`, whose `spec.css` `@import`s it. Each mode-dependent token is written
once as `light-dark(light, dark)`; the page's `color-scheme`, which Starlight
sets from `data-theme`, picks the arm. `custom.css` maps Starlight's
`--sl-color-*` onto it, and a game's colour is always `--game-<id>`. Tint with
`color-mix(in srgb, var(--token) N%, transparent)`.

## Design system

Every page is built from tokens and shared components, and tools hold them there:

- **Tokens** (`src/styles/theme.css`, the only file that spells a raw value):
  colours, `--rs-text-*` sizes, `--rs-weight-*`, `--rs-tracking-*`,
  `--rs-leading-*`, `--rs-radius-*`, `--rs-border`, `--rs-shadow-overlay` (only
  for things that float), `--rs-focus-ring`, `--rs-code-*` and motion.
- **Components** (`src/components/ui/`): `Button` (primary, secondary, or a
  product's colour), `Section` (heading, lede, actions slot), `Card` and
  `CardGrid`, `CodePanel` (Expressive Code with wrapping) and `DiscordGlyph`.
  `ProductHero` and `ProductStack` render from `PRODUCTS` in `src/utils/product.ts`.
- **Enforcement**: Biome's `no-raw-color`, `no-raw-type`, `no-raw-shape`,
  `no-uppercase-labels` and `no-decorative-gradient` plugins (`biome-plugins/`)
  fail raw values in every `.css` file and Astro `<style>` block except
  `theme.css`. `__tests__/theme.test.ts` fails hex in markup and scripts, and
  the old ad-hoc `btn`, `pkg-card` and `section-divider` classes.
- **Avoided on purpose**: two-tone or gradient headlines, glow and lift on
  hover, hard shadows, uppercase letter-spaced labels and divider rules
  between sections.

## Notation Spec (`/spec`)

The RANDSUM Dice Notation spec is served from this app at `/spec` but is
**not** a Starlight page (ADR-015): `src/pages/spec/` are plain Astro pages
that render `src/spec/SpecLayout.astro`, which has its own header, sidebar,
scroll-spy and share actions in vanilla `<script>` blocks (ADR-017), and the
spec's product colour as its accent. Never import `StarlightPage` there, and keep `src/spec/spec.css`
imported only by `SpecLayout`, since its resets are global to the page.

- Versions live in `src/content/specs/` (the `specs` collection). `v0.9.0.md`
  has ID `0.9.0` and is served at `/spec/v/0.9.0/`; `/spec/` renders the latest
  inline, not as a redirect (ADR-016). Both name `/spec/v/<latest>/` as
  canonical, and only that page opts into the Pagefind index.
- `ModifierReference.astro` builds Appendix H from `@randsum/roller/docs`, so it
  renders only on the latest version.
- `/spec/llms.txt` and `/spec/llms-full.txt` are built from the same entry.
- Code blocks go through Starlight's Expressive Code, which reads a few
  `--sl-color-*` names; `spec.css` maps them onto the spec's tokens.
- The theme script shares Starlight's `starlight-theme` key, so one choice
  holds across the site.
- Conformance vectors: `packages/roller/spec/vectors.ts` is the source of
  truth (beside the roller test that runs them). `bun run conformance:gen`
  writes `public/conformance/v0.9.0.json`, served at `/conformance/v0.9.0.json`;
  `conformance:check` (pre-push and the site's `check`) fails if
  `public/conformance/` differs from what `conformance:gen` would write.
- The spec moved here from `notation.randsum.dev`, which now only 301s:
  `/conformance/*` keeps its path, everything else maps to `/spec/*`. The
  redirect is `worker/notation-redirect.ts`, deployed from
  `wrangler.notation.jsonc` to the old `randsum-rdn` Worker, which keeps the
  hostname's Custom Domain (`docs/operations.md`).

## Roller app (`/app`)

`src/pages/app/index.astro` is the installable roller, the "app" product
(lime). Like `/spec` it is not a Starlight page: a full-screen shell around
`components/roller-app/RollerApp.tsx`, which reuses `dice-ui`'s
`NotationRoller` and `RollResultDisplay` and keeps history in localStorage.
`public/app/` holds its manifest, icons and `sw.js`, a service worker scoped
to `/app/` that caches the page and its `/_astro/` assets for offline use
(`_headers` keeps `sw.js` uncached). Bump `CACHE` in `sw.js` only to force old
entries out; fingerprinted assets refresh on their own.

## Content Structure

Docs live in `src/content/docs/` as `.mdx` files; Starlight auto-routes them.
Top-level topics: `welcome/`, `roller/`, `notation/`, `games/` (incl.
`games/schema/`), `tools/`.

## Landing Page

The home page is **not** a Starlight doc — it's a custom `src/pages/index.astro`
that renders a `StarlightPage` shell wrapping landing sections from
`src/components/landing/` (`LandingHero`, `ProductStack`, `FeaturesPlayground`,
`GameSchemaSection`, `IntegrationsSection`, `GamesGrid`, `LandingFooter`,
`LandingScripts`). `ProductStack` renders one section per product from
`PRODUCTS` in `src/utils/product.ts`, which also feeds `ProductHero`, the
hero at the top of each product's introduction page. There is also a
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
- `PipMark.astro` — the pip R mark, outline or knockout
- `ProductHero.astro` — a product's hero: lockup, name in its colour, pitch, install, facts
- `ErrorBoundary/` — React error boundary

## Build Pipeline

- `src/integrations/curated-llms-txt.ts` — prepends the repo-root `llms.txt` to
  the page list `starlight-page-actions` writes to `dist/llms.txt`. Edit the
  root file; there is no `public/` copy. It must stay after `starlight()`.
- `public/schemas/v1/randsum.json` — checked-in copy of
  `packages/games/randsum.json`, served at the schema's `$id` by both `astro dev`
  and the production build. `__tests__/schema-sync.test.ts` fails if it drifts.

## Package Data

`src/utils/packageData.ts` defines metadata for packages shown on the site
(`corePackages`, `games`, `toolPackages`).

## Commands

```bash
bun run dev        # Dev server (localhost:4321)
bun run build      # Production build
bun run preview    # Preview production build
bun run typecheck  # astro sync, then tsc with the .astro content mapper
bun run check      # build + typecheck + test + conformance:check
bun run conformance:gen    # Regenerate public/conformance/v0.9.0.json
bun run conformance:check  # fail if public/conformance/ differs from what conformance:gen writes
```
