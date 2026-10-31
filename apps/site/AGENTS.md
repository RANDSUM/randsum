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
- Brand: the pip mark (`src/components/PipMark.astro`, outline and knockout) and a
  product family. The roller's die spells R, the family mark; every other product has its own
  pip pattern (`PIPS` in `src/utils/product.ts`), so pass `product` wherever a die stands
  for one. Chrome is neutral; `src/utils/product.ts` maps a path to its product (roller, games, spec, api, discord, plugin, app), `Head.astro` stamps `<html data-product>`,
  and `theme.css` turns that into the page's accent (`--product-*`)
- Social cards: `public/og-image.png` is the family card; each product has
  `public/og/<product>.png`, and `src/routeData.ts` (Starlight route middleware) points a
  product's pages at its card. `SpecLayout`, outside Starlight, sets its own.

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
  product's colour), `Section` (heading, lede, actions slot; `product` adds
  that product's die-and-name lockup, `layout="split"` puts the header beside
  the content), `Card` and `CardGrid`, `CodePanel`
  (Expressive Code with wrapping), `CodeFrame` (a named file with an action on
  its header bar) and `DiscordGlyph`.
  `ProductHero` and `ProductCarousel` render from `PRODUCTS` in `src/utils/product.ts`.
- **Enforcement**: Biome's `no-raw-color`, `no-raw-type`, `no-raw-shape`,
  `no-uppercase-labels` and `no-decorative-gradient` plugins (`biome-plugins/`)
  fail raw values in every `.css` file and Astro `<style>` block except
  `theme.css`. `__tests__/theme.test.ts` fails hex in markup and scripts, and
  the old ad-hoc `btn`, `pkg-card` and `section-divider` classes.
- **Avoided on purpose**: two-tone or gradient headlines, glow and lift on
  hover, hard shadows, uppercase letter-spaced labels and divider rules
  between sections.

## Notation Spec (`/spec`)

The RANDSUM Dice Notation spec is served at its own host, `notation.randsum.dev`,
but built by this app. It is **not** a Starlight page (ADR-015): `src/pages/spec/` are plain Astro pages
that render `src/spec/SpecLayout.astro`, which has its own header, sidebar,
scroll-spy and share actions in vanilla `<script>` blocks (ADR-017), and the
spec's product colour as its accent. Never import `StarlightPage` there, and keep `src/spec/spec.css`
imported only by `SpecLayout`, since its resets are global to the page.

- Hosting: Astro builds the pages under `/spec/`; `scripts/build-notation.ts`
  (the last step of `bun run build`) lifts `dist/spec/` to the root of
  `dist-notation/`, adds `/_astro/`, the favicons, `robots.txt` and
  `sitemap.xml`, and deletes `dist/spec/`. `wrangler.notation.jsonc` serves
  `dist-notation/` as static assets from the `randsum-rdn` Worker, which holds the
  hostname's Custom Domain (`docs/operations.md`). randsum.dev's
  `public/_redirects` 301s `/spec`, `/spec/*` and `/conformance/*` there.
- Links: a spec page links within the spec by its path on that host through
  `specPath()` (which adds `/spec` under `astro dev` only), names full URLs with
  `specUrl()`, and links to the rest of the site with `SITE_ORIGIN`, all from
  `src/spec/urls.ts`. Never write `/spec/` into a spec page's links, and never a
  bare `/` for a site page: neither exists on the spec's host.
  `__tests__/spec-build.test.ts` checks the built output.
- Versions live in `packages/notation-spec/spec/` (the `specs` collection's glob
  loader reads that directory; the package is the spec's source of truth). `v0.9.0.md`
  has ID `0.9.0` and is served at `/v/0.9.0/`; `/` renders the latest
  inline, not as a redirect (ADR-016). Both name `https://notation.randsum.dev/` as
  canonical, only `/` opts into the Pagefind index, and the spec host's
  `sitemap.xml` leaves out `/v/<latest>/`. Older versions are canonical to themselves.
- `ModifierReference.astro` builds Appendix H from `@randsum/roller/docs`, so it
  renders only on the latest version.
- The page follows formal-spec conventions (W3C/IETF), not the site's
  marketing look: a document header (`SpecHead.astro`), a numbered table of
  contents (`SpecToc.astro`), a Source Serif body (`--rs-font-serif`), and
  section numbers, BCP 14 keywords, non-normative labels and note boxes
  marked by `src/spec/specHtml.ts`. Sätteri takes no rehype plugins, so that
  is a string transform over `entry.rendered.html`. `src/spec/sections.ts`
  groups headings for the sidebar; `src/spec/document.ts` puts the front
  matter (title, version, revision, status, date, editor, all validated by
  `content.config.ts`) back on the Markdown for `llms-full.txt`.
- Conformance badges: `src/pages/spec/badges/[version]/[badge].ts` serves a
  shields-style SVG per level at `/badges/v<version>/level-<n>.svg`,
  drawn by `src/spec/badges.ts` in theme colours. `/conformance/`
  (`src/pages/spec/conformance/index.astro`) explains how to claim a level and
  gives the embed snippets.
- `/llms.txt` and `/llms-full.txt` on the spec's host are built from the same entry.
- Code blocks go through Starlight's Expressive Code, which reads a few
  `--sl-color-*` names; `spec.css` maps them onto the spec's tokens.
- The theme script shares Starlight's `starlight-theme` key, but localStorage is
  per host, so the spec's host keeps its own choice.
- Conformance vectors: `packages/notation-spec/vectors/v0.9.0.json` is the
  source of truth. `src/pages/spec/conformance/[file].ts` serves it verbatim at
  `/conformance/v0.9.0.json`, with its schema at `/conformance/conformance.schema.json`.

## Roller app (app.randsum.dev)

The installable roller, the "app" product (lime), is served from its own
host, `app.randsum.dev`, by `wrangler.app.jsonc` (the `randsum-app` Worker,
static assets only). `randsum.dev/app/` (`src/pages/app/index.astro`) is its
product page: a Starlight splash page that opens with the app's `ProductHero`.

- The shell is `src/pages/app-shell/index.astro`. Like `/spec` it is not a
  Starlight page: a full-screen shell around `components/roller-app/RollerApp.tsx`,
  which reuses `dice-ui`'s `NotationRoller` and `RollResultDisplay` and keeps
  history in localStorage. Its links are absolute to the app host's root.
- `bun run build` is `astro build` then `scripts/build-app.ts`, which writes
  `dist-app/`: the shell as `index.html`, `app-public/` (manifest, icons,
  `_headers`, `sw.js`), `dist/_astro/` and the favicon. It then deletes
  `dist/app-shell/`, and the sitemap filters it, so randsum.dev never serves it.
- `app-public/sw.js` is scoped to `/` and caches the page and its `/_astro/`
  assets for offline use. Bump `CACHE` only to force old entries out;
  fingerprinted assets refresh on their own.
- `public/app/sw.js` on randsum.dev only retires the worker that installs from
  the old `randsum.dev/app/` registered: it clears their caches and
  unregisters. The product page sends a standalone (installed) window on to
  `app.randsum.dev`. Keep both while old installs may still open.
- `public/app/roller-phone-{dark,light}.png` are the product page's screenshots
  of the real app at 390x844 @2x; retake them when the app's look changes.

## Content Structure

Docs live in `src/content/docs/` as `.mdx` files; Starlight auto-routes them.
Top-level topics: `welcome/`, `roller/`, `notation/`, `games/` (incl.
`games/schema/`), `api/`, `tools/`.

## Landing Page

The home page is **not** a Starlight doc — it's a custom `src/pages/index.astro`
that renders a `StarlightPage` shell wrapping landing sections from
`src/components/landing/` (`LandingHero`, `ProductCarousel`, `QuickStart`,
`GameSchemaSection`, `GamesGrid`, `Faq`, `ClosingCta`, `LandingFooter`,
`LandingScripts`). `LandingHero` puts the live roller beside the tagline.
`ProductCarousel` is a vertical carousel with one pane per product from
`PRODUCTS` in `src/utils/product.ts`; every pane is in the HTML, and the script
only slides between them. `PRODUCTS` also feeds `ProductHero`, the
hero at the top of each product's introduction page. After the carousel, each
section wears its product's lockup (`QuickStart` the roller, `GameSchemaSection`
the games, whose spec samples live in `src/utils/gameSchemas.ts` and render
server-side behind tabs), and `ClosingCta` and `LandingFooter` show the whole
family's dice. `landing.css` holds only the page frame and the hero; every
other section styles itself. `Faq` and the page's
FAQPage structured data share `LANDING_FAQ` in `src/utils/faq.ts`. The Discord bot's
only page is `/tools/discord-bot/`; `/discord/` 301s there (`public/_redirects`).

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
- `HeroRoller/` — the landing hero's live roller (notation field, token breakdown,
  rolled result with every step, example presets), in the roller's colour
- `HeroInteractive.tsx` — the clickable tagline, which spins `HeroRoller`'s presets
- `PipMark.astro` — the pip mark, outline or knockout, in a product's pattern (R by default)
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
bun run check      # build + typecheck + test
```
