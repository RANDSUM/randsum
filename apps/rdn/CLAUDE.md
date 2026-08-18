# @randsum/rdn — RANDSUM Dice Notation Spec Site

## Overview

Pure **Astro 6.4.6** app serving the formal RANDSUM Dice Notation (RDN)
specification at `notation.randsum.dev`. **No Starlight, no React, no UI
framework** — a custom Astro layout (`SpecLayout.astro`) with vanilla TypeScript
for client interactivity (scroll-spy, mobile menu) via Astro `<script>` blocks.

Spec documents live in `src/content/specs/` as versioned Markdown. The current
spec is `v0.9.0.md` (content-collection ID `0.9.0`). Each version is reachable
at `/v/<id>` (e.g. `/v/0.9.0`). The root `/` renders the latest version inline
(it is **not** a redirect).

It also generates the normative conformance vectors under
`public/conformance/` from `@randsum/roller` via `conformance-gen.ts`.

## Directory Structure

```
apps/rdn/
  src/
    content/
      specs/             # Versioned spec docs (*.md) — currently v0.9.0.md
    content.config.ts    # specs collection; ID = filename minus leading "v" and ".md"
    pages/
      index.astro        # Renders the latest spec version inline
      404.astro
      v/
        [version].astro  # Dynamic route (getStaticPaths) — spec by version ID
    layouts/
      SpecLayout.astro   # Full-page shell (header, sidebar, aside, footer)
    components/
      SpecContent.astro      # Renders the Markdown body
      ModifierReference.astro# Auto-generated modifier appendix from roller docs
      SidebarNav.astro       # Version-aware nav sidebar
      OnThisPage.astro       # Heading-based table of contents
      VersionBanner.astro
      VersionDropdown.astro
      HeroHeader.astro
      ShareActions.astro
      MobileMenu.astro
      SkipLink.astro
    conformance/
      types.ts           # Conformance vector types
      vectors.ts         # CONFORMANCE_FILE — the vector source of truth
    utils/
      versions.ts        # getVersions(), getLatestVersion(), isLatestVersion()
    styles/
      global.css
  conformance-gen.ts     # Emits public/conformance/<version>.json from vectors.ts
  public/
    conformance/v0.9.0.json
    llms.txt
    llms-full.txt
  __tests__/
    conformance.test.ts  # bun:test
  astro.config.ts
  netlify.toml
```

## Commands

```bash
bun run dev               # Astro dev server (localhost:4322)
bun run build             # Static build → dist/
bun run preview           # Preview built output
bun run typecheck         # astro check
bun run lint              # ESLint
bun run format            # Biome
bun run test              # bun:test (__tests__/)
bun run conformance:gen   # Regenerate public/conformance/<version>.json
bun run conformance:check # conformance:gen + git diff --exit-code (CI guard)
bun run check             # build + typecheck + format:check + lint + test
```

## Content Authoring

Add a new spec version by creating `src/content/specs/<version>.md`
(e.g. `v1.0.md`).

The content-collection loader strips the leading `v` and `.md` extension — so
`v0.9.0.md` becomes ID `0.9.0`. The `[version].astro` route uses this ID as the
URL segment.

`getVersions()` sorts versions semantically: pre-release tags (e.g. `-alpha`)
sort before the release of the same number. `getLatestVersion()` returns the
last item in the sorted list.

Frontmatter fields are all optional: `title`, `version`, `status`, `date`.

## Conformance Vectors

`src/conformance/vectors.ts` defines `CONFORMANCE_FILE` (the canonical vector
set). `conformance-gen.ts` serializes it to `public/conformance/<version>.json`
with a stable key order. `conformance:check` regenerates and fails on any diff,
keeping the published JSON in sync with the source.

## Key Constraints

- **Dev dependency on `@randsum/roller`** (build-time only). `ModifierReference.astro`
  imports `MODIFIER_DOCS` / `DICE_DOCS` from `@randsum/roller/docs` to auto-generate
  the modifier reference appendix.
- No client-side framework — interactivity is vanilla TS in Astro `<script>` blocks.
- **`typescript` is pinned to `6.0.3` here, deliberately — do NOT move it to `catalog:`.**
  The rest of the workspace is on TypeScript 7.0.2 via the root `catalog`, and this app
  and `apps/site` are the only holdouts. They are blocked upstream, not by neglect:
  `@astrojs/check` declares `peerDependencies: { typescript: "^5.0.0 || ^6.0.0" }` as of
  its latest release (0.9.10), and under TS 7 `astro check` dies before checking anything
  with `Cannot read properties of undefined (reading 'fileExists')` in
  `@astrojs/language-server`'s `getTsconfig`. Revisit when `@astrojs/check` ships a
  release whose peer range admits TypeScript 7.
- Private app, never published to npm.
- **Deployed to both Netlify (`netlify.toml`) and Cloudflare Workers
  (`wrangler.jsonc`) during the migration.** Netlify is still the live site —
  DNS has not moved — and Cloudflare publishes alongside it until the cutover.
  Cloudflare deploys from `.github/workflows/deploy-cloudflare.yml` on merge to
  `main`, not from Workers Builds: rdn imports roller through a workspace
  subpath export that has to be built first, and CI already sequences that.
  No Astro adapter is involved — the site is `output: 'static'`, so Cloudflare
  serves `dist/` directly through an assets binding with no Worker script.
- Fonts: Inter (body) and JetBrains Mono (code/headings), via Astro's Google
  font provider (`astro.config.ts`).
